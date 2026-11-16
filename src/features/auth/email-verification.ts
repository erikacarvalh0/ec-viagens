import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "./email-verification-email";

const LIFETIME_MS = 60 * 60 * 1000;

export async function requestEmailVerification(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const recipient = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.emailVerifiedAt) return null;
    const now = new Date();
    const recent = await tx.emailVerificationToken.findFirst({
      where: { userId, createdAt: { gt: new Date(now.getTime() - 60_000) } },
    });
    if (recent) throw new Error("Aguarde um minuto antes de tentar novamente.");
    await tx.emailVerificationToken.create({
      data: {
        userId, email: user.email,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(now.getTime() + LIFETIME_MS),
      },
    });
    return user.email;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  // Keep previous links valid when resending, including when delivery fails.
  if (recipient) await sendVerificationEmail(recipient, token);
}

export async function completeEmailVerification(userId: string, token: unknown): Promise<void> {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    throw new Error("Invalid verification token.");
  }
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.$transaction(async (tx) => {
    const stored = await tx.emailVerificationToken.findUnique({ where: { tokenHash } });
    const now = new Date();
    if (!stored || stored.userId !== userId || stored.usedAt || stored.expiresAt <= now) {
      throw new Error("Invalid verification token.");
    }
    const claimed = await tx.emailVerificationToken.updateMany({
      where: { id: stored.id, userId, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) throw new Error("Invalid verification token.");
    const updated = await tx.user.updateMany({
      where: { id: userId, email: stored.email, emailVerifiedAt: null },
      data: { emailVerifiedAt: now },
    });
    if (updated.count !== 1) throw new Error("Email already verified or changed.");
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

import { prisma } from "@/lib/prisma";
import { createPasswordResetToken, hashPasswordResetToken } from "./password-reset-token";

const RESET_LIFETIME_MS = 60 * 60 * 1000;

export async function storePasswordResetToken(userId: string): Promise<string> {
  const token = createPasswordResetToken();
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashPasswordResetToken(token),
      expiresAt: new Date(Date.now() + RESET_LIFETIME_MS),
    },
  });
  return token;
}

export async function consumePasswordResetToken(token: string): Promise<string> {
  const tokenHash = hashPasswordResetToken(token);
  return prisma.$transaction(async (transaction) => {
    const stored = await transaction.passwordResetToken.findUnique({ where: { tokenHash } });
    const now = new Date();
    if (!stored || stored.usedAt || stored.expiresAt <= now) {
      throw new Error("Invalid or expired reset token.");
    }
    const claimed = await transaction.passwordResetToken.updateMany({
      where: { id: stored.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) throw new Error("Invalid or expired reset token.");
    return stored.userId;
  });
}

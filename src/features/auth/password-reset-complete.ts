import { Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { passwordResetConfirmationSchema } from "./password-reset-schema";
import { hashPasswordResetToken } from "./password-reset-token";

export async function completePasswordReset(input: unknown): Promise<void> {
  const { token, password } = passwordResetConfirmationSchema.parse(input);
  const tokenHash = hashPasswordResetToken(token);
  const passwordHash = await hashPassword(password);
  await prisma.$transaction(async (transaction) => {
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
    await transaction.user.update({
      where: { id: stored.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

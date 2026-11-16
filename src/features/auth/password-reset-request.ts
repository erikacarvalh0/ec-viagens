import { prisma } from "@/lib/prisma";
import { passwordResetRequestSchema } from "./password-reset-schema";
import { storePasswordResetToken } from "./password-reset-store";

export type ResetTokenDelivery = (email: string, token: string) => Promise<void>;

/**
 * Generates a one-time reset token only for existing accounts.
 * The caller must use an identical public response for both cases.
 * Delivery must be backed by a trusted email provider before public exposure.
 */
export async function requestPasswordReset(
  input: unknown,
  deliver: ResetTokenDelivery,
): Promise<void> {
  const { email } = passwordResetRequestSchema.parse(input);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) return;

  const recentToken = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } },
    select: { id: true },
  });
  if (recentToken) return;

  const token = await storePasswordResetToken(user.id);
  await deliver(user.email, token);
}

"use server";

import { completePasswordReset } from "./password-reset-complete";
import { passwordResetConfirmationSchema } from "./password-reset-schema";

export type PasswordResetState = { error: string; success: boolean };

export async function confirmPasswordReset(
  _previous: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem.", success: false };
  }
  const parsed = passwordResetConfirmationSchema.safeParse({
    token: formData.get("token"),
    password,
  });
  if (!parsed.success) {
    return { error: "Link inválido ou senha fora dos requisitos.", success: false };
  }
  try {
    await completePasswordReset(parsed.data);
    return { error: "", success: true };
  } catch {
    return { error: "Não foi possível redefinir a senha. Solicite um novo link.", success: false };
  }
}

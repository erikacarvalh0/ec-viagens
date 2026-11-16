"use server";

import { requireUserId } from "@/lib/session";
import { completeEmailVerification, requestEmailVerification } from "./email-verification";

export type VerificationState = { message: string; success: boolean };

export async function sendVerification(_previous: VerificationState): Promise<VerificationState> {
  const userId = await requireUserId();
  try {
    await requestEmailVerification(userId);
    return { message: "Se o e-mail ainda não foi confirmado, enviamos um link válido por uma hora.", success: true };
  } catch {
    return { message: "Não foi possível enviar. Aguarde um minuto e tente novamente.", success: false };
  }
}

export async function confirmVerification(_previous: VerificationState, formData: FormData): Promise<VerificationState> {
  const userId = await requireUserId();
  try {
    await completeEmailVerification(userId, formData.get("token"));
    return { message: "E-mail confirmado.", success: true };
  } catch {
    return { message: "Link inválido, expirado ou já utilizado. Entre na conta correta ou solicite outro link.", success: false };
  }
}

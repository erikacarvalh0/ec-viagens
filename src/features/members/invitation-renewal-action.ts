"use server";

import { revalidatePath } from "next/cache";

import { renewInvitation } from "./invitation-renewal";

export async function renewExpiredInvitation(tripId: string, invitationId: string): Promise<{
  error: string;
  invitationUrl?: string;
}> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) return { error: "Configure NEXT_PUBLIC_APP_URL para compartilhar convites." };
  try {
    const token = await renewInvitation(tripId, invitationId);
    const invitationUrl = new URL(`/invite/${token}`, baseUrl).toString();
    revalidatePath(`/trips/${tripId}/members`);
    return { error: "", invitationUrl };
  } catch {
    return { error: "Não foi possível renovar este convite expirado." };
  }
}

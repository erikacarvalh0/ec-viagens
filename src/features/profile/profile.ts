"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

import { profileSchema, type ProfileDraft } from "./schema";

export async function updateProfile(draft: ProfileDraft) {
  const result = profileSchema.safeParse(draft);
  if (!result.success) return { success: false, error: result.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const userId = await requireUserId();
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: result.data.name,
        city: result.data.city || null,
        state: result.data.state || null,
        whatsapp: result.data.whatsapp || null,
      },
    });
    revalidatePath("/settings/profile");
    revalidatePath("/settings/notifications");
    revalidatePath("/dashboard");
    return { success: true, error: "" };
  } catch {
    return { success: false, error: "Não foi possível atualizar o perfil. Verifique se o WhatsApp já está cadastrado." };
  }
}

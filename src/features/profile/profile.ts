"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  city: z.string().trim().max(100),
  state: z.string().trim().max(80),
  whatsapp: z.string().trim().refine((value) => !value || /^\d{10,15}$/.test(value), {
    message: "Informe o WhatsApp com DDI e DDD, somente números.",
  }),
});

export type ProfileDraft = z.infer<typeof profileSchema>;

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

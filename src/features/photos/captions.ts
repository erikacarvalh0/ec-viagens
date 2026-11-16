"use server";

import { revalidatePath } from "next/cache";

import { requireTripMember } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

export async function updatePhotoCaption(tripId: string, photoId: string, caption: string) {
  if (typeof caption !== "string" || caption.length > 200) {
    return { error: "A legenda deve ter até 200 caracteres." };
  }

  try {
    const actor = await requireTripMember(tripId);
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, tripId },
      select: { id: true, uploadedById: true },
    });

    if (!photo) return { error: "Foto não encontrada nesta viagem." };
    if (actor.role !== "ADMIN" && photo.uploadedById !== actor.userId) {
      return { error: "Você não tem permissão para editar esta legenda." };
    }

    const result = await prisma.photo.updateMany({
      where: { id: photoId, tripId },
      data: { caption: caption.trim() || null },
    });

    if (result.count !== 1) return { error: "A foto já foi removida." };
    revalidatePath(`/trips/${tripId}/photos`);
    return { success: true, error: "" };
  } catch {
    return { error: "Não foi possível atualizar a legenda." };
  }
}

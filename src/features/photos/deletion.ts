"use server";

import { photosEnabled } from "./availability";

import { revalidatePath } from "next/cache";

import { requireTripMember } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

import { deletePrivatePhoto } from "./storage";

export async function deleteTripPhoto(tripId: string, photoId: string) {
  if (!photosEnabled()) return { error: "Galeria temporariamente indisponível." };
  try {
    const actor = await requireTripMember(tripId);
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, tripId },
    });

    if (!photo) {
      return { error: "Foto não encontrada nesta viagem." };
    }

    if (actor.role !== "ADMIN" && photo.uploadedById !== actor.userId) {
      return { error: "Você não tem permissão para excluir esta foto." };
    }

    if (photo.thumbnailKey) {
      await deletePrivatePhoto(photo.thumbnailKey);
    }
    await deletePrivatePhoto(photo.storageKey);
    const result = await prisma.photo.deleteMany({
      where: { id: photoId, tripId },
    });

    if (result.count !== 1) {
      return { error: "A foto já foi removida." };
    }

    revalidatePath(`/trips/${tripId}/photos`);
    return { error: "", success: true };
  } catch {
    return { error: "Não foi possível excluir a foto." };
  }
}

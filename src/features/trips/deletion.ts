"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireTripAdmin } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

export async function deleteEmptyTrip(tripId: string, confirmation: string) {
  await requireTripAdmin(tripId);
  if (confirmation !== "EXCLUIR") {
    throw new Error("Confirmação inválida. Digite EXCLUIR.");
  }

  await prisma.$transaction(async (tx) => {
    const [photoCount, chargeCount] = await Promise.all([
      tx.photo.count({ where: { tripId } }),
      tx.charge.count({ where: { plan: { tripId } } }),
    ]);
    if (photoCount > 0) {
      throw new Error("Remova as fotos antes de excluir a viagem.");
    }
    if (chargeCount > 0) {
      throw new Error("Não é possível excluir uma viagem com cobranças. Preserve o histórico financeiro.");
    }
    const deleted = await tx.trip.deleteMany({ where: { id: tripId } });
    if (deleted.count === 0) throw new Error("Viagem não encontrada.");
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  revalidatePath("/dashboard");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";

import { requireTripAdmin } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

export async function resolveNotificationReview(
  tripId: string,
  notificationId: string,
) {
  try {
    await requireTripAdmin(tripId);
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        kind: "PAYMENT_REMINDER",
        referenceId: {
          in: (await prisma.charge.findMany({
            where: { plan: { tripId } },
            select: { id: true },
          })).map((charge) => charge.id),
        },
      },
    });

    if (!notification || notification.status !== "REVIEW_REQUIRED") {
      return { error: "Lembrete indisponível para revisão." };
    }

    const result = await prisma.notification.updateMany({
      where: { id: notification.id, status: "REVIEW_REQUIRED" },
      data: { status: "REVIEWED" },
    });
    if (result.count !== 1) {
      return { error: "O status do lembrete foi alterado. Atualize a página." };
    }

    revalidatePath(`/trips/${tripId}/payments/notifications`);
    return { error: "", success: true };
  } catch {
    return { error: "Não foi possível concluir a revisão." };
  }
}

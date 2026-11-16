"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function updateReminderConsent(consent: boolean) {
  if (typeof consent !== "boolean") {
    return { error: "Escolha uma opção válida." };
  }

  try {
    const userId = await requireUserId();
    const user = await prisma.user.update({
      where: { id: userId },
      data: { paymentReminderConsentAt: consent ? new Date() : null },
      select: { whatsapp: true },
    });
    if (!consent && user.whatsapp) {
      const charges = await prisma.charge?.findMany({
        where: { member: { userId } },
        select: { id: true },
      });
      await prisma.notification.updateMany({
        where: {
          kind: "PAYMENT_REMINDER",
          status: "PENDING",
          recipientWhatsapp: user.whatsapp,
          ...(charges ? { referenceId: { in: charges.map((charge) => charge.id) } } : {}),
        },
        data: { status: "CANCELLED" },
      });
    }
    revalidatePath("/settings/notifications");
    return { error: "", success: true };
  } catch {
    return { error: "Não foi possível atualizar sua preferência." };
  }
}

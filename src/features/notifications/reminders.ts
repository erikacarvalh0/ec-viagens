"use server";

import { revalidatePath } from "next/cache";

import { requireTripAdmin } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

export type ReminderResult = { error: string; success?: boolean };

export async function schedulePaymentReminder(
  tripId: string,
  chargeId: string,
): Promise<ReminderResult> {
  try {
    await requireTripAdmin(tripId);

    const charge = await prisma.charge.findFirst({
      where: { id: chargeId, plan: { tripId } },
      include: { member: { include: { user: true } } },
    });

    if (!charge) {
      return { error: "Cobrança não encontrada nesta viagem." };
    }

    if (charge.status !== "PENDING" && charge.status !== "OVERDUE") {
      return { error: "A cobrança não está pendente de pagamento." };
    }

    if (!charge.member.user.paymentReminderConsentAt) {
      return { error: "A participante ainda não autorizou lembretes pelo WhatsApp." };
    }

    const whatsapp = charge.member.user.whatsapp;
    if (!whatsapp || !/^\d{10,15}$/.test(whatsapp) || !charge.paymentUrl) {
      return { error: "A participante precisa de WhatsApp válido e link de pagamento." };
    }

    // One reminder per charge per calendar day; scheduling is not delivery.
    const scheduledFor = new Date();
    scheduledFor.setUTCDate(scheduledFor.getUTCDate() + 1);
    scheduledFor.setUTCHours(15, 0, 0, 0);

    await prisma.notification.upsert({
      where: {
        kind_referenceId_scheduledFor: {
          kind: "PAYMENT_REMINDER",
          referenceId: charge.id,
          scheduledFor,
        },
      },
      create: {
        recipientWhatsapp: whatsapp,
        kind: "PAYMENT_REMINDER",
        referenceId: charge.id,
        scheduledFor,
        status: "PENDING",
      },
      update: {},
    });

    revalidatePath(`/trips/${tripId}/payments`);
    return { error: "", success: true };
  } catch {
    return { error: "Não foi possível agendar o lembrete." };
  }
}

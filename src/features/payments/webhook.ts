import { Prisma, type ChargeStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const webhookSchema = z.object({
  id: z.string().min(1),
  event: z.string().min(1),
  payment: z.object({
    id: z.string().min(1),
    externalReference: z.string().nullish(),
    paymentDate: z.string().nullish(),
    confirmedDate: z.string().nullish(),
  }),
});

const eventStatuses: Record<string, ChargeStatus> = {
  PAYMENT_CONFIRMED: "PAID",
  PAYMENT_RECEIVED: "PAID",
  PAYMENT_OVERDUE: "OVERDUE",
  PAYMENT_DELETED: "CANCELLED",
  PAYMENT_REFUNDED: "REFUNDED",
  PAYMENT_REFUND_IN_PROGRESS: "REFUNDED",
  PAYMENT_RESTORED: "PENDING",
};

export async function reconcileAsaasEvent(input: unknown) {
  const event = webhookSchema.parse(input);
  const status = eventStatuses[event.event];

  if (!status) {
    return "ignored" as const;
  }

  const charge = await prisma.charge.findFirst({
    where: {
      OR: [
        { asaasPaymentId: event.payment.id },
        ...(event.payment.externalReference
          ? [{ id: event.payment.externalReference }]
          : []),
      ],
    },
  });

  if (!charge) {
    throw new Error("Charge not found for payment.");
  }

  if (
    (charge.asaasPaymentId && charge.asaasPaymentId !== event.payment.id) ||
    (event.payment.externalReference &&
      event.payment.externalReference !== charge.id)
  ) {
    throw new Error("Payment reference mismatch.");
  }

  try {
    await prisma.$transaction(async (transaction) => {
      // A unique event ID prevents replay and simultaneous duplicate processing.
      await transaction.paymentEvent.create({
        data: {
          chargeId: charge.id,
          externalEventId: event.id,
          eventType: event.event,
          payload: event as Prisma.InputJsonValue,
        },
      });

      const terminal = charge.status === "REFUNDED" || charge.status === "CANCELLED";
      const downgradePaid = charge.status === "PAID" &&
        (status === "OVERDUE" || status === "PENDING");

      if (terminal && status !== "REFUNDED") {
        return;
      }

      if (downgradePaid) {
        return;
      }

      const date = event.payment.paymentDate ?? event.payment.confirmedDate;
      const paidAt = status === "PAID"
        ? date && !Number.isNaN(Date.parse(date))
          ? new Date(date)
          : new Date()
        : status === "REFUNDED" || status === "CANCELLED"
          ? null
          : charge.paidAt;

      await transaction.charge.update({
        where: { id: charge.id },
        data: {
          status,
          paidAt,
          ...(!charge.asaasPaymentId
            ? { asaasPaymentId: event.payment.id }
            : {}),
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return "duplicate" as const;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return "duplicate" as const;
    }

    throw error;
  }

  return "processed" as const;
}

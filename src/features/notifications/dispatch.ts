import { prisma } from "@/lib/prisma";

import { sendPaymentReminderTemplate } from "./whatsapp";
import { markStaleProcessingForReview } from "./stale";

export async function dispatchDuePaymentReminders() {
  if (process.env.WHATSAPP_REMINDERS_ENABLED !== "true") {
    return { processed: 0, disabled: true };
  }

  const now = new Date();
  await markStaleProcessingForReview(now);
  const due = await prisma.notification.findMany({
    where: {
      kind: "PAYMENT_REMINDER",
      status: "PENDING",
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: "asc" },
    take: 20,
  });

  let processed = 0;

  for (const notification of due) {
    // Claim before contacting the provider. Never automatically retry a
    // claimed item: a timeout can occur after WhatsApp accepted the message.
    const claim = await prisma.notification.updateMany({
      where: { id: notification.id, status: "PENDING" },
      data: { status: "PROCESSING", processingStartedAt: new Date() },
    });

    if (claim.count !== 1) {
      continue;
    }

    try {
      const charge = await prisma.charge.findUnique({
        where: { id: notification.referenceId },
        include: { member: { include: { user: true } } },
      });

      const user = charge?.member.user;
      if (
        !charge ||
        (charge.status !== "PENDING" && charge.status !== "OVERDUE") ||
        !charge.paymentUrl ||
        !user?.paymentReminderConsentAt ||
        !user.whatsapp ||
        user.whatsapp !== notification.recipientWhatsapp
      ) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: "CANCELLED" },
        });
        continue;
      }

      const messageId = await sendPaymentReminderTemplate({
        to: user.whatsapp,
        name: user.name,
        paymentUrl: charge.paymentUrl,
      });

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          providerMessageId: messageId,
        },
      });
      processed++;
    } catch {
      // Unknown delivery outcome. Require manual reconciliation before retry.
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "REVIEW_REQUIRED" },
      });
    }
  }

  return { processed };
}

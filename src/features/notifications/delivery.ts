import { z } from "zod";

import { prisma } from "@/lib/prisma";

const receiptSchema = z.object({
  entry: z.array(z.object({
    changes: z.array(z.object({
      field: z.string(),
      value: z.object({
        statuses: z.array(z.object({
          id: z.string().min(1),
          status: z.enum(["sent", "delivered", "read", "failed"]),
        })).optional(),
      }),
    })),
  })),
});

const transitions = {
  sent: { status: "SENT", from: ["PROCESSING"] },
  delivered: { status: "DELIVERED", from: ["SENT"] },
  read: { status: "READ", from: ["SENT", "DELIVERED"] },
  failed: { status: "REVIEW_REQUIRED", from: ["SENT"] },
} as const;

export async function reconcileWhatsAppStatuses(input: unknown) {
  const parsed = receiptSchema.parse(input);
  let updated = 0;

  for (const entry of parsed.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;

      for (const receipt of change.value.statuses ?? []) {
        const notification = await prisma.notification.findFirst({
          where: { providerMessageId: receipt.id },
        });
        if (!notification) continue;

        const transition = transitions[receipt.status];
        const result = await prisma.notification.updateMany({
          where: {
            id: notification.id,
            status: { in: [...transition.from] },
          },
          data: { status: transition.status },
        });
        updated += result.count;
      }
    }
  }

  return updated;
}

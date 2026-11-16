import { prisma } from "@/lib/prisma";

export async function markStaleProcessingForReview(now = new Date()) {
  const cutoff = new Date(now.getTime() - 30 * 60 * 1000);
  const result = await prisma.notification.updateMany({
    where: {
      kind: "PAYMENT_REMINDER",
      status: "PROCESSING",
      processingStartedAt: { lt: cutoff },
    },
    data: { status: "REVIEW_REQUIRED" },
  });

  return result.count;
}

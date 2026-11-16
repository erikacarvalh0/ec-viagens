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

  if (result.count > 0) {
    console.warn(JSON.stringify({
      event: "notifications.stale_processing_review_required",
      count: result.count,
    }));
  }

  return result.count;
}

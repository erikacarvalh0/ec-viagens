import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ updateMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { notification: { updateMany: mocks.updateMany } },
}));

import { markStaleProcessingForReview } from "./stale";

describe("stale WhatsApp processing", () => {
  beforeEach(() => mocks.updateMany.mockResolvedValue({ count: 2 }));

  it("emits only aggregate, privacy-safe recovery telemetry", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      await markStaleProcessingForReview(new Date("2026-11-16T12:00:00Z"));
      expect(warn).toHaveBeenCalledWith(JSON.stringify({
        event: "notifications.stale_processing_review_required",
        count: 2,
      }));
    } finally {
      warn.mockRestore();
    }
  });

  it("does not emit recovery warnings when no stale items exist", async () => {
    mocks.updateMany.mockResolvedValueOnce({ count: 0 });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      expect(await markStaleProcessingForReview()).toBe(0);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it("flags processing older than 30 minutes without requeueing", async () => {
    const now = new Date("2026-11-16T12:00:00Z");
    expect(await markStaleProcessingForReview(now)).toBe(2);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        kind: "PAYMENT_REMINDER",
        status: "PROCESSING",
        processingStartedAt: { lt: new Date("2026-11-16T11:30:00Z") },
      },
      data: { status: "REVIEW_REQUIRED" },
    });
  });
});

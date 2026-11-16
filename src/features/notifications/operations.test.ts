import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  findFirst: vi.fn(),
  charges: vi.fn(),
  updateMany: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/features/members/permissions", () => ({ requireTripAdmin: mocks.admin }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    charge: { findMany: mocks.charges },
    notification: {
      findFirst: mocks.findFirst,
      updateMany: mocks.updateMany,
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { resolveNotificationReview } from "./operations";

describe("notification review", () => {
  beforeEach(() => {
    mocks.admin.mockResolvedValue({ id: "admin" });
    mocks.findFirst.mockResolvedValue({ id: "notification-1", status: "REVIEW_REQUIRED" });
    mocks.charges.mockResolvedValue([{ id: "charge-1" }]);
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("closes a review without resending", async () => {
    expect(await resolveNotificationReview("trip-1", "notification-1")).toEqual({
      error: "", success: true,
    });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "notification-1", status: "REVIEW_REQUIRED" },
      data: { status: "REVIEWED" },
    });
  });

  it("blocks non-admin users", async () => {
    mocks.admin.mockRejectedValue(new Error("Forbidden"));
    expect((await resolveNotificationReview("trip-1", "notification-1")).error).not.toBe("");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("blocks notifications from other trips", async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect((await resolveNotificationReview("trip-1", "notification-1")).error).not.toBe("");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("does not overwrite delivered notifications", async () => {
    mocks.findFirst.mockResolvedValue({ id: "notification-1", status: "DELIVERED" });
    expect((await resolveNotificationReview("trip-1", "notification-1")).error).not.toBe("");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});

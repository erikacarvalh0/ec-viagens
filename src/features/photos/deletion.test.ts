import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  findFirst: vi.fn(),
  deleteMany: vi.fn(),
  removeObject: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/features/members/permissions", () => ({ requireTripMember: mocks.member }));
vi.mock("@/lib/prisma", () => ({
  prisma: { photo: { findFirst: mocks.findFirst, deleteMany: mocks.deleteMany } },
}));
vi.mock("./storage", () => ({ deletePrivatePhoto: mocks.removeObject }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { deleteTripPhoto } from "./deletion";

describe("trip photo deletion", () => {
  beforeEach(() => {
    mocks.member.mockResolvedValue({ userId: "user-1", role: "MEMBER" });
    mocks.findFirst.mockResolvedValue({
      id: "photo-1", tripId: "trip-1", uploadedById: "user-1",
      storageKey: "trips/trip-1/photo.jpg",
    });
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    mocks.removeObject.mockResolvedValue(undefined);
  });

  it("allows the uploader to delete their own photo", async () => {
    expect(await deleteTripPhoto("trip-1", "photo-1")).toEqual({
      success: true, error: "",
    });
    expect(mocks.removeObject).toHaveBeenCalledWith("trips/trip-1/photo.jpg");
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { id: "photo-1", tripId: "trip-1" },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/trips/trip-1/photos");
  });

  it("allows a trip admin to delete photos", async () => {
    mocks.member.mockResolvedValue({ userId: "admin", role: "ADMIN" });
    expect((await deleteTripPhoto("trip-1", "photo-1")).success).toBe(true);
  });

  it("blocks other participants", async () => {
    mocks.member.mockResolvedValue({ userId: "other", role: "MEMBER" });
    expect((await deleteTripPhoto("trip-1", "photo-1")).success).toBeUndefined();
    expect(mocks.removeObject).not.toHaveBeenCalled();
  });

  it("blocks cross-trip deletion", async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect((await deleteTripPhoto("trip-1", "photo-1")).success).toBeUndefined();
    expect(mocks.removeObject).not.toHaveBeenCalled();
  });

  it("does not remove storage or metadata if trip membership is denied", async () => {
    mocks.member.mockRejectedValueOnce(new Error("Forbidden"));
    expect((await deleteTripPhoto("trip-1", "photo-1")).success).toBeUndefined();
    expect(mocks.removeObject).not.toHaveBeenCalled();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("does not delete metadata when storage deletion times out", async () => {
    mocks.removeObject.mockRejectedValueOnce(new Error("Timeout"));
    const result = await deleteTripPhoto("trip-1", "photo-1");
    expect(result.success).toBeUndefined();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("does not delete metadata if storage deletion fails", async () => {
    mocks.removeObject.mockRejectedValue(new Error("S3 error"));
    expect((await deleteTripPhoto("trip-1", "photo-1")).success).toBeUndefined();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });
});

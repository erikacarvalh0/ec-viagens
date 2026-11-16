import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/features/members/permissions", () => ({ requireTripMember: mocks.member }));
vi.mock("@/lib/prisma", () => ({
  prisma: { photo: { findFirst: mocks.findFirst, updateMany: mocks.updateMany } },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { updatePhotoCaption } from "./captions";

describe("photo captions", () => {
  beforeEach(() => {
    mocks.member.mockResolvedValue({ userId: "uploader", role: "MEMBER" });
    mocks.findFirst.mockResolvedValue({ id: "photo-1", uploadedById: "uploader" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("allows the uploader to edit their caption", async () => {
    expect(await updatePhotoCaption("trip-1", "photo-1", "  Praia!  ")).toEqual({
      success: true, error: "",
    });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "photo-1", tripId: "trip-1" },
      data: { caption: "Praia!" },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/trips/trip-1/photos");
  });

  it("allows a trip administrator to edit captions", async () => {
    mocks.member.mockResolvedValue({ userId: "admin", role: "ADMIN" });
    expect((await updatePhotoCaption("trip-1", "photo-1", "Novo texto")).success).toBe(true);
  });

  it("allows clearing a caption", async () => {
    await updatePhotoCaption("trip-1", "photo-1", "  ");
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "photo-1", tripId: "trip-1" },
      data: { caption: null },
    });
  });

  it("blocks another member", async () => {
    mocks.member.mockResolvedValue({ userId: "other", role: "MEMBER" });
    expect((await updatePhotoCaption("trip-1", "photo-1", "new")).success).toBeUndefined();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("blocks a photo outside the trip", async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect((await updatePhotoCaption("trip-1", "photo-1", "new")).success).toBeUndefined();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects captions longer than 200 characters", async () => {
    expect((await updatePhotoCaption("trip-1", "photo-1", "a".repeat(201))).success).toBeUndefined();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("blocks unauthenticated members", async () => {
    mocks.member.mockRejectedValue(new Error("Forbidden"));
    expect((await updatePhotoCaption("trip-1", "photo-1", "new")).success).toBeUndefined();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});

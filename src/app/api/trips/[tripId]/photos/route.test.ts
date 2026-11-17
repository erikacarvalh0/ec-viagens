import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  create: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  optimize: vi.fn(),
}));
vi.mock("@/features/members/permissions", () => ({ requireTripMember: mocks.member }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "user-1" } })) }));
vi.mock("@/lib/prisma", () => ({ prisma: { photo: { create: mocks.create } } }));
vi.mock("@/features/photos/storage", () => ({ uploadPrivatePhoto: mocks.upload, deletePrivatePhoto: mocks.remove }));

vi.mock("@/features/photos/optimization", () => ({ optimizePhoto: mocks.optimize }));

import { POST } from "./route";

describe("photo uploads", () => {
  beforeEach(() => {
    mocks.member.mockResolvedValue({ userId: "user-1" });
    mocks.create.mockResolvedValue({ id: "photo-1" });
    mocks.upload.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
    const optimized = { bytes: new Uint8Array([255, 216, 255]), contentType: "image/jpeg" };
    mocks.optimize.mockResolvedValue({ original: optimized, thumbnail: optimized });
  });

  it("rejects unauthorized uploads", async () => {
    mocks.member.mockRejectedValue(new Error("Forbidden"));
    const response = await POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ tripId: "trip-1" }),
    });
    expect(response.status).toBe(403);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("rejects missing photo data", async () => {
    const response = await POST(new Request("http://localhost", {
      method: "POST",
      body: new FormData(),
    }), { params: Promise.resolve({ tripId: "trip-1" }) });
    expect(response.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("attempts cleanup when the first upload has an uncertain outcome", async () => {
    mocks.upload.mockRejectedValueOnce(new Error("timeout"));
    const body = new FormData();
    body.append("photo", new File([new Uint8Array([255, 216, 255, 224])], "photo.jpg", { type: "image/jpeg" }));
    const response = await POST(new Request("http://localhost", { method: "POST", body }), { params: Promise.resolve({ tripId: "trip-1" }) });
    expect(response.status).toBe(500);
    expect(mocks.remove).toHaveBeenCalledWith(mocks.upload.mock.calls[0][0]);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

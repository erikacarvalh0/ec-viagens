import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  create: vi.fn(),
  upload: vi.fn(),
}));
vi.mock("@/features/members/permissions", () => ({ requireTripMember: mocks.member }));
vi.mock("@/lib/prisma", () => ({ prisma: { photo: { create: mocks.create } } }));
vi.mock("@/features/photos/storage", () => ({ uploadPrivatePhoto: mocks.upload }));

import { POST } from "./route";

describe("photo uploads", () => {
  beforeEach(() => {
    mocks.member.mockResolvedValue({ userId: "user-1" });
    mocks.create.mockResolvedValue({ id: "photo-1" });
    mocks.upload.mockResolvedValue(undefined);
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
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  findFirst: vi.fn(),
  download: vi.fn(),
}));
vi.mock("@/features/members/permissions", () => ({ requireTripMember: mocks.member }));
vi.mock("@/lib/prisma", () => ({ prisma: { photo: { findFirst: mocks.findFirst } } }));
vi.mock("@/features/photos/storage", () => ({ downloadPrivatePhoto: mocks.download }));

import { GET } from "./route";

const context = { params: Promise.resolve({ tripId: "trip-1", photoId: "photo-1" }) };

describe("private photo downloads", () => {
  beforeEach(() => {
    mocks.member.mockResolvedValue({ userId: "user-1" });
    mocks.findFirst.mockResolvedValue({
      storageKey: "trips/trip-1/original.jpg",
      thumbnailKey: "trips/trip-1/thumbnail.jpg",
    });
    mocks.download.mockResolvedValue(new Response(new Uint8Array([255, 216, 255])));
  });

  it("serves a photo as an attachment on request", async () => {
    const response = await GET(new Request("http://localhost/api/photo?download=1"), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="trip-photo-photo-1.jpg"');
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.download).toHaveBeenCalledWith("trips/trip-1/original.jpg");
  });

  it("serves thumbnails inline by default", async () => {
    const response = await GET(new Request("http://localhost/api/photo?size=thumb"), context);
    expect(response.headers.get("Content-Disposition")).toBeNull();
    expect(mocks.download).toHaveBeenCalledWith("trips/trip-1/thumbnail.jpg");
  });

  it("rejects non-members before accessing storage", async () => {
    mocks.member.mockRejectedValue(new Error("Forbidden"));
    const response = await GET(new Request("http://localhost/api/photo?download=1"), context);
    expect(response.status).toBe(403);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.download).not.toHaveBeenCalled();
  });

  it("rejects photos from other trips", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/photo?download=1"), context);
    expect(response.status).toBe(404);
    expect(mocks.download).not.toHaveBeenCalled();
  });

  it("returns a gateway error when storage fails", async () => {
    mocks.download.mockRejectedValue(new Error("S3 unavailable"));
    const response = await GET(new Request("http://localhost/api/photo?download=1"), context);
    expect(response.status).toBe(502);
  });
});

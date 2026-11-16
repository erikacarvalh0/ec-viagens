import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ admin: vi.fn(), updateMany: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/features/members/permissions", () => ({ requireTripAdmin: mocks.admin }));
vi.mock("@/lib/prisma", () => ({ prisma: { trip: { updateMany: mocks.updateMany } } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { setTripArchived } from "./archiving";

describe("trip archiving", () => {
  beforeEach(() => {
    mocks.admin.mockResolvedValue({ role: "ADMIN" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("archives a trip without deleting data", async () => {
    await expect(setTripArchived("trip-1", true)).resolves.toEqual({ success: true });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "trip-1" },
      data: { archivedAt: expect.any(Date) },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/dashboard");
  });

  it("restores an archived trip", async () => {
    await setTripArchived("trip-1", false);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "trip-1" },
      data: { archivedAt: null },
    });
  });

  it("rejects non-admin users", async () => {
    mocks.admin.mockRejectedValue(new Error("Forbidden"));
    await expect(setTripArchived("trip-1", true)).rejects.toThrow("Forbidden");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects missing trips", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await expect(setTripArchived("trip-1", true)).rejects.toThrow("Trip not found");
  });

  it("rejects invalid archive state", async () => {
    await expect(setTripArchived("trip-1", "yes" as unknown as boolean)).rejects.toThrow("Invalid");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});

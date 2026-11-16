import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  updateMany: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/features/members/permissions", () => ({ requireTripAdmin: mocks.admin }));
vi.mock("@/lib/prisma", () => ({ prisma: { trip: { updateMany: mocks.updateMany } } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { saveTripChanges } from "./editing";

const draft = {
  name: "Viagem 2027",
  startsAt: "2027-05-10",
  endsAt: "2027-05-15",
  locationName: "Ibiúna",
  mapUrl: "",
};

describe("editing trip details", () => {
  beforeEach(() => {
    mocks.admin.mockResolvedValue({ role: "ADMIN", userId: "admin-1" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("allows a trip admin to update validated details", async () => {
    await expect(saveTripChanges("trip-1", draft)).resolves.toEqual({ success: true });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "trip-1", memberships: { some: { userId: "admin-1", role: "ADMIN" } } },
      data: {
        name: "Viagem 2027",
        startsAt: new Date("2027-05-10T12:00:00Z"),
        endsAt: new Date("2027-05-15T12:00:00Z"),
        locationName: "Ibiúna",
        mapUrl: null,
      },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/dashboard");
  });

  it("blocks non-admin users", async () => {
    mocks.admin.mockRejectedValue(new Error("Forbidden"));
    await expect(saveTripChanges("trip-1", draft)).rejects.toThrow("Forbidden");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a mutation if admin rights were revoked after the initial check", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await expect(saveTripChanges("trip-1", draft)).rejects.toThrow("Trip not found");
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "trip-1", memberships: { some: { userId: "admin-1", role: "ADMIN" } } },
    }));
  });

  it("rejects invalid dates before updating", async () => {
    await expect(saveTripChanges("trip-1", { ...draft, endsAt: "2027-01-01" })).rejects.toThrow();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects trips that do not exist", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await expect(saveTripChanges("trip-1", draft)).rejects.toThrow("Trip not found");
  });
});

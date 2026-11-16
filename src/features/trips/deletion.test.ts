import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  transaction: vi.fn(),
  photoCount: vi.fn(),
  chargeCount: vi.fn(),
  deleteMany: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/features/members/permissions", () => ({ requireTripAdmin: mocks.admin }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { deleteEmptyTrip } from "./deletion";

describe("safe trip deletion", () => {
  beforeEach(() => {
    mocks.admin.mockResolvedValue({ id: "member-1", role: "ADMIN" });
    mocks.photoCount.mockResolvedValue(0);
    mocks.chargeCount.mockResolvedValue(0);
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        photo: { count: mocks.photoCount },
        charge: { count: mocks.chargeCount },
        trip: { deleteMany: mocks.deleteMany },
      }),
    );
  });

  it("deletes a trip without photos or charges", async () => {
    await expect(deleteEmptyTrip("trip-1", "EXCLUIR")).resolves.toEqual({ success: true });
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: "trip-1" } });
    expect(mocks.revalidate).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects deletion without explicit confirmation", async () => {
    await expect(deleteEmptyTrip("trip-1", "delete")).rejects.toThrow("Confirmação");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects non-admin users", async () => {
    mocks.admin.mockRejectedValue(new Error("Forbidden"));
    await expect(deleteEmptyTrip("trip-1", "EXCLUIR")).rejects.toThrow("Forbidden");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("protects trips with stored photos", async () => {
    mocks.photoCount.mockResolvedValue(1);
    await expect(deleteEmptyTrip("trip-1", "EXCLUIR")).rejects.toThrow("fotos");
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("protects trips with financial charges", async () => {
    mocks.chargeCount.mockResolvedValue(1);
    await expect(deleteEmptyTrip("trip-1", "EXCLUIR")).rejects.toThrow("cobranças");
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("rejects a missing trip", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteEmptyTrip("trip-1", "EXCLUIR")).rejects.toThrow("não encontrada");
  });
});

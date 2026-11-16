import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTripAdmin: vi.fn(), findFirst: vi.fn(), create: vi.fn(), transaction: vi.fn(),
  updateMany: vi.fn(),
}));
vi.mock("@/features/members/permissions", () => ({ requireTripAdmin: mocks.requireTripAdmin }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

import { renewInvitation } from "./invitation-renewal";

describe("invitation renewal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTripAdmin.mockResolvedValue({ id: "admin" });
    mocks.findFirst.mockResolvedValue({
      id: "invite-a", tripId: "trip-a", status: "PENDING",
      expiresAt: new Date(Date.now() - 60_000),
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (fn) => fn({
      invitation: { findFirst: mocks.findFirst, updateMany: mocks.updateMany, create: mocks.create },
    }));
  });

  it("replaces an expired invitation with a new single-use token", async () => {
    const token = await renewInvitation("trip-a", "invite-a");
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "invite-a", tripId: "trip-a", status: "PENDING", expiresAt: { lte: expect.any(Date) } },
      data: { status: "EXPIRED" },
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        tripId: "trip-a", whatsapp: "", tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
      },
    });
    expect(mocks.create.mock.calls[0][0].data.tokenHash).not.toBe(token);
  });

  it("requires administrator access", async () => {
    mocks.requireTripAdmin.mockRejectedValue(new Error("Forbidden"));
    await expect(renewInvitation("trip-a", "invite-a")).rejects.toThrow("Forbidden");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects used invitations and invitations belonging to another trip", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(renewInvitation("trip-a", "invite-a")).rejects.toThrow("expired invitation");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("does not renew an invitation that has not expired", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "invite-a", status: "PENDING", expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(renewInvitation("trip-a", "invite-a")).rejects.toThrow("expired invitation");
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userId: vi.fn(),
  invitation: vi.fn(),
  transaction: vi.fn(),
  trip: vi.fn(),
  claim: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ requireUserId: mocks.userId }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    invitation: { findUnique: mocks.invitation },
    $transaction: mocks.transaction,
  },
}));

import { acceptInvitation } from "./invitations";

const token = "a".repeat(64);

describe("archive during invitation redemption", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId.mockResolvedValue("user-1");
    mocks.invitation.mockResolvedValue({
      id: "inv-1",
      tripId: "trip-1",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 60_000),
      trip: { archivedAt: null },
    });
    mocks.trip.mockResolvedValue({ archivedAt: null });
    mocks.claim.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback) => callback({
      trip: { findUnique: mocks.trip },
      invitation: { updateMany: mocks.claim },
      tripMember: { upsert: mocks.upsert },
    }));
  });

  it("rejects a trip archived after the invitation was first read", async () => {
    mocks.trip.mockResolvedValue({ archivedAt: new Date() });

    await expect(acceptInvitation(token)).rejects.toThrow(
      "Archived trips cannot accept new invitations.",
    );
    expect(mocks.claim).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("redeems an invitation for an active trip without removing existing memberships", async () => {
    await expect(acceptInvitation(token)).resolves.toBe("trip-1");
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { tripId_userId: { tripId: "trip-1", userId: "user-1" } },
      create: { tripId: "trip-1", userId: "user-1", role: "MEMBER" },
      update: {},
    });
  });

  it("rolls back when a trip disappears before redemption", async () => {
    mocks.trip.mockResolvedValue(null);
    await expect(acceptInvitation(token)).rejects.toThrow(
      "Archived trips cannot accept new invitations.",
    );
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});

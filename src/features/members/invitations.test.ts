import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTripAdmin: vi.fn(),
  requireUserId: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  upsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireUserId: mocks.requireUserId,
}));

vi.mock("@/features/members/permissions", () => ({
  requireTripAdmin: mocks.requireTripAdmin,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    invitation: {
      create: mocks.create,
      findUnique: mocks.findUnique,
    },
    $transaction: mocks.transaction,
  },
}));

import {
  acceptInvitation,
  createInvitation,
  getInvitation,
} from "./invitations";

const validToken = "a".repeat(64);

describe("trip invitations", () => {
  beforeEach(() => {
    mocks.requireUserId.mockResolvedValue("user-b");
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        invitation: { updateMany: mocks.updateMany },
        tripMember: { upsert: mocks.upsert },
      }),
    );
    mocks.findUnique.mockResolvedValue({
      id: "invitation",
      tripId: "trip-a",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 60_000),
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("requires administrator permissions before creating an invitation", async () => {
    mocks.requireTripAdmin.mockRejectedValue(new Error("Forbidden"));

    await expect(createInvitation("trip-a")).rejects.toThrow("Forbidden");

    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("stores a token hash rather than the invitation secret", async () => {
    await createInvitation("trip-a").catch(() => undefined);
    mocks.requireTripAdmin.mockResolvedValue({ id: "actor" });

    const token = await createInvitation("trip-a");
    const input = mocks.create.mock.lastCall?.[0];

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(input.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(input.data.tokenHash).not.toBe(token);
  });

  it("does not query the database for malformed tokens", async () => {
    await expect(getInvitation("invalid")).resolves.toBeNull();

    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an expired invitation", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "invitation",
      tripId: "trip-a",
      status: "PENDING",
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(acceptInvitation(validToken)).rejects.toThrow(
      "This invitation is invalid or expired.",
    );

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("adds a member to the invited trip on redemption", async () => {
    await expect(acceptInvitation(validToken)).resolves.toBe("trip-a");

    expect(mocks.upsert).toHaveBeenCalledWith({
      where: {
        tripId_userId: { tripId: "trip-a", userId: "user-b" },
      },
      create: {
        tripId: "trip-a",
        userId: "user-b",
        role: "MEMBER",
      },
      update: {},
    });
  });

  it("rejects a token already claimed by another request", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    await expect(acceptInvitation(validToken)).rejects.toThrow(
      "This invitation has already been used.",
    );

    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});

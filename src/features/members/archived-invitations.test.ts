import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(), user: vi.fn(), create: vi.fn(), findUnique: vi.fn(), transaction: vi.fn(),
}));
vi.mock("@/features/members/permissions", () => ({ requireTripAdmin: mocks.admin }));
vi.mock("@/lib/session", () => ({ requireUserId: mocks.user }));
vi.mock("@/lib/prisma", () => ({
  prisma: { invitation: { create: mocks.create, findUnique: mocks.findUnique }, $transaction: mocks.transaction },
}));
import { acceptInvitation, createInvitation } from "./invitations";

describe("archived trip invitation safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.admin.mockResolvedValue({ trip: { archivedAt: null } });
    mocks.user.mockResolvedValue("user-1");
  });

  it("prevents creating new invitations for archived trips", async () => {
    mocks.admin.mockResolvedValue({ trip: { archivedAt: new Date() } });
    await expect(createInvitation("trip-1")).rejects.toThrow("Archived trips cannot accept new invitations.");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("prevents redeeming invitations after a trip is archived", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "invite-1", tripId: "trip-1", status: "PENDING",
      expiresAt: new Date(Date.now() + 60000), trip: { archivedAt: new Date() },
    });
    await expect(acceptInvitation("a".repeat(64))).rejects.toThrow("Archived trips cannot accept new invitations.");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

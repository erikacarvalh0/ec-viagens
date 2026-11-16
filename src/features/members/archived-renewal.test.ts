import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), transaction: vi.fn() }));
vi.mock("@/features/members/permissions", () => ({ requireTripAdmin: mocks.admin }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
import { renewInvitation } from "./invitation-renewal";
describe("archived invitation renewal", () => {
  it("rejects renewal for an archived trip without changing invitations", async () => {
    mocks.admin.mockResolvedValue({ trip: { archivedAt: new Date() } });
    await expect(renewInvitation("trip-1", "invite-1")).rejects.toThrow("Archived trips cannot accept new invitations.");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

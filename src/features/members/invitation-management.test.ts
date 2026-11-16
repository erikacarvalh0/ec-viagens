import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ admin: vi.fn(), updateMany: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/features/members/permissions", () => ({ requireTripAdmin: mocks.admin }));
vi.mock("@/lib/prisma", () => ({ prisma: { invitation: { updateMany: mocks.updateMany } } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { revokeInvitation } from "./invitation-management";

describe("invitation revocation", () => {
  beforeEach(() => {
    mocks.admin.mockResolvedValue({ role: "ADMIN" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("revokes only a pending invitation in the selected trip", async () => {
    await expect(revokeInvitation("trip-a", "invite-a")).resolves.toEqual({ success: true });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "invite-a", tripId: "trip-a", status: "PENDING" },
      data: { status: "REVOKED" },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/trips/trip-a/members");
  });

  it("prevents non-admin users from revoking invitations", async () => {
    mocks.admin.mockRejectedValue(new Error("Forbidden"));
    await expect(revokeInvitation("trip-a", "invite-a")).rejects.toThrow("Forbidden");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects invitations that are used, revoked or from another trip", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await expect(revokeInvitation("trip-a", "invite-a")).rejects.toThrow("pending invitation");
  });
});

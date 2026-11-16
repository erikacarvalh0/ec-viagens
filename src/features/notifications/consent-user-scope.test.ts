import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userId: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ requireUserId: mocks.userId }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: mocks.update },
    notification: { updateMany: mocks.updateMany },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { updateReminderConsent } from "./consent";

describe("consent revocation ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userId.mockResolvedValue("user-1");
    mocks.update.mockResolvedValue({ whatsapp: "5511999999999" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("only cancels pending reminders for charges owned by the current user", async () => {
    await updateReminderConsent(false);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        kind: "PAYMENT_REMINDER",
        status: "PENDING",
        recipientWhatsapp: "5511999999999",
        referenceId: { in: expect.any(Array) },
      },
      data: { status: "CANCELLED" },
    });
  });

  it("never deletes delivered reminders when opting out", async () => {
    await updateReminderConsent(false);
    expect(mocks.updateMany.mock.calls[0][0].where.status).toBe("PENDING");
  });
});

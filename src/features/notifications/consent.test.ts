import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userId: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ requireUserId: mocks.userId }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { update: mocks.update }, notification: { updateMany: mocks.updateMany } } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { updateReminderConsent } from "./consent";

describe("WhatsApp reminder consent", () => {
  beforeEach(() => {
    mocks.userId.mockResolvedValue("user-1");
    mocks.update.mockResolvedValue({ whatsapp: null });
    mocks.updateMany.mockResolvedValue({ count: 0 });
  });

  it("records explicit opt-in for the authenticated user", async () => {
    const result = await updateReminderConsent(true);

    expect(result.error).toBe("");
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { paymentReminderConsentAt: expect.any(Date) },
      select: { whatsapp: true },
    });
  });

  it("revokes consent for the authenticated user", async () => {
    const result = await updateReminderConsent(false);

    expect(result.error).toBe("");
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { paymentReminderConsentAt: null },
      select: { whatsapp: true },
    });
  });

  it("rejects non-boolean consent values", async () => {
    const result = await updateReminderConsent("yes" as unknown as boolean);

    expect(result.error).not.toBe("");
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

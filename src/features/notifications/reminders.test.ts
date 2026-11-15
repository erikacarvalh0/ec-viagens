import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  findFirst: vi.fn(),
  upsert: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/features/members/permissions", () => ({
  requireTripAdmin: mocks.admin,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    charge: { findFirst: mocks.findFirst },
    notification: { upsert: mocks.upsert },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { schedulePaymentReminder } from "./reminders";

const charge = {
  id: "charge-1",
  status: "PENDING",
  paymentUrl: "https://sandbox.asaas.com/i/example",
  member: { user: { whatsapp: "5511999999999", paymentReminderConsentAt: new Date("2026-11-15") } },
};

describe("payment reminder scheduling", () => {
  beforeEach(() => {
    mocks.admin.mockResolvedValue({ id: "admin" });
    mocks.findFirst.mockResolvedValue(charge);
    mocks.upsert.mockResolvedValue({ id: "notification-1" });
  });

  it("schedules a unique reminder without sending a message", async () => {
    const result = await schedulePaymentReminder("trip-1", "charge-1");

    expect(result.error).toBe("");
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: {
        kind_referenceId_scheduledFor: {
          kind: "PAYMENT_REMINDER",
          referenceId: "charge-1",
          scheduledFor: expect.any(Date),
        },
      },
      create: expect.objectContaining({
        recipientWhatsapp: "5511999999999",
        kind: "PAYMENT_REMINDER",
        referenceId: "charge-1",
        status: "PENDING",
      }),
      update: {},
    });
  });

  it("blocks non-admin users", async () => {
    mocks.admin.mockRejectedValue(new Error("Forbidden"));

    const result = await schedulePaymentReminder("trip-1", "charge-1");

    expect(result.error).not.toBe("");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("rejects charges outside the trip", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const result = await schedulePaymentReminder("trip-1", "charge-1");

    expect(result.error).not.toBe("");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("does not schedule paid charges", async () => {
    mocks.findFirst.mockResolvedValue({ ...charge, status: "PAID" });

    const result = await schedulePaymentReminder("trip-1", "charge-1");

    expect(result.error).not.toBe("");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("requires explicit WhatsApp consent", async () => {
    mocks.findFirst.mockResolvedValue({
      ...charge,
      member: { user: { whatsapp: "5511999999999", paymentReminderConsentAt: null } },
    });

    const result = await schedulePaymentReminder("trip-1", "charge-1");

    expect(result.error).not.toBe("");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("requires a phone number and payment link", async () => {
    mocks.findFirst.mockResolvedValue({
      ...charge,
      member: { user: { whatsapp: null } },
    });

    const result = await schedulePaymentReminder("trip-1", "charge-1");

    expect(result.error).not.toBe("");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  findUnique: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findMany: mocks.findMany,
      updateMany: mocks.updateMany,
      update: mocks.update,
    },
    charge: { findUnique: mocks.findUnique },
  },
}));
vi.mock("./whatsapp", () => ({
  sendPaymentReminderTemplate: mocks.send,
}));

import { dispatchDuePaymentReminders } from "./dispatch";

const notification = {
  id: "notification-1",
  referenceId: "charge-1",
  recipientWhatsapp: "5511999999999",
};
const charge = {
  status: "PENDING",
  paymentUrl: "https://sandbox.asaas.com/i/test",
  member: {
    user: {
      name: "Ana",
      whatsapp: "5511999999999",
      paymentReminderConsentAt: new Date("2026-11-15"),
    },
  },
};

beforeEach(() => {
  vi.stubEnv("WHATSAPP_REMINDERS_ENABLED", "true");
  mocks.findMany.mockResolvedValue([notification]);
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.findUnique.mockResolvedValue(charge);
  mocks.update.mockResolvedValue({});
  mocks.send.mockResolvedValue("wamid.123");
});
afterEach(() => vi.unstubAllEnvs());

describe("payment reminder dispatcher", () => {
  it("stays disabled unless explicitly enabled", async () => {
    vi.stubEnv("WHATSAPP_REMINDERS_ENABLED", "false");
    expect(await dispatchDuePaymentReminders()).toEqual({
      processed: 0,
      disabled: true,
    });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("claims and sends eligible reminders", async () => {
    expect(await dispatchDuePaymentReminders()).toEqual({ processed: 1 });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "notification-1", status: "PENDING" },
      data: { status: "PROCESSING" },
    });
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "notification-1" },
      data: expect.objectContaining({
        status: "SENT",
        providerMessageId: "wamid.123",
      }),
    });
  });

  it("does not send when consent was withdrawn", async () => {
    mocks.findUnique.mockResolvedValue({
      ...charge,
      member: {
        user: { ...charge.member.user, paymentReminderConsentAt: null },
      },
    });
    expect(await dispatchDuePaymentReminders()).toEqual({ processed: 0 });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "notification-1" },
      data: { status: "CANCELLED" },
    });
  });

  it("does not send already paid charges", async () => {
    mocks.findUnique.mockResolvedValue({ ...charge, status: "PAID" });
    await dispatchDuePaymentReminders();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("never sends a reminder claimed by another worker", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await dispatchDuePaymentReminders();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("flags uncertain provider outcomes for review", async () => {
    mocks.send.mockRejectedValue(new Error("timeout"));
    await dispatchDuePaymentReminders();
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "notification-1" },
      data: { status: "REVIEW_REQUIRED" },
    });
  });
});

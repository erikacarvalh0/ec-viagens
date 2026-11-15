import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  createEvent: vi.fn(),
  updateCharge: vi.fn(),
  findCurrent: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { charge: { findFirst: mocks.findFirst }, $transaction: mocks.transaction },
}));

import { reconcileAsaasEvent } from "./webhook";

const payment = {
  id: "pay-123",
  externalReference: "charge-a",
  paymentDate: "2026-11-15",
};

describe("Asaas webhook reconciliation", () => {
  beforeEach(() => {
    mocks.findFirst.mockResolvedValue({
      id: "charge-a",
      asaasPaymentId: "pay-123",
      status: "PENDING",
      paidAt: null,
    });
    mocks.findCurrent.mockImplementation(async () => mocks.findFirst());
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        paymentEvent: { create: mocks.createEvent },
        charge: {
          update: mocks.updateCharge,
          findUniqueOrThrow: mocks.findCurrent,
        },
      }),
    );
  });

  it("marks confirmed payments as paid and records the event", async () => {
    await reconcileAsaasEvent({
      id: "evt-1",
      event: "PAYMENT_CONFIRMED",
      payment,
    });

    expect(mocks.createEvent).toHaveBeenCalledWith({
      data: expect.objectContaining({
        externalEventId: "evt-1",
        chargeId: "charge-a",
      }),
    });
    expect(mocks.updateCharge).toHaveBeenCalledWith({
      where: { id: "charge-a" },
      data: expect.objectContaining({ status: "PAID" }),
    });
  });

  it("ignores unsupported events", async () => {
    const result = await reconcileAsaasEvent({
      id: "evt-2",
      event: "PAYMENT_CREATED",
      payment,
    });

    expect(result).toBe("ignored");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a mismatched payment reference", async () => {
    await expect(
      reconcileAsaasEvent({
        id: "evt-3",
        event: "PAYMENT_RECEIVED",
        payment: { ...payment, id: "different" },
      }),
    ).rejects.toThrow("Payment reference mismatch");

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not downgrade an already paid charge to overdue", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "charge-a",
      asaasPaymentId: "pay-123",
      status: "PAID",
      paidAt: new Date(),
    });

    await reconcileAsaasEvent({
      id: "evt-4",
      event: "PAYMENT_OVERDUE",
      payment,
    });

    expect(mocks.updateCharge).not.toHaveBeenCalled();
  });

  it("treats duplicate event IDs as already processed", async () => {
    mocks.createEvent.mockRejectedValue({ code: "P2002" });

    const result = await reconcileAsaasEvent({
      id: "evt-5",
      event: "PAYMENT_RECEIVED",
      payment,
    });

    expect(result).toBe("duplicate");
    expect(mocks.updateCharge).not.toHaveBeenCalled();
  });
});

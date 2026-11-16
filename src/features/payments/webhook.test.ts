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
  value: 100.1,
  externalReference: "charge-a",
  paymentDate: "2026-11-15",
};

describe("Asaas webhook reconciliation", () => {
  beforeEach(() => {
    mocks.createEvent.mockReset().mockResolvedValue({});
    mocks.findFirst.mockResolvedValue({
      id: "charge-a",
      asaasPaymentId: "pay-123",
      amountCents: 10010,
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

  it("preserves the original paidAt across later receipt events", async () => {
    const original = new Date("2026-11-14");
    mocks.findCurrent.mockResolvedValue({
      id: "charge-a", asaasPaymentId: "pay-123", amountCents: 10010,
      status: "PAID", paidAt: original,
    });
    expect(await reconcileAsaasEvent({
      id: "evt-late-receipt", event: "PAYMENT_RECEIVED", payment,
    })).toBe("processed");
    expect(mocks.updateCharge).toHaveBeenCalledWith({
      where: { id: "charge-a" },
      data: expect.objectContaining({ status: "PAID", paidAt: original }),
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
      amountCents: 10010,
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

  it.each([99, 100.101, undefined, Number.MAX_SAFE_INTEGER, 1e308])(
    "records a divergent amount (%s) without changing the balance",
    async (value) => {
      const result = await reconcileAsaasEvent({
        id: "evt-mismatch",
        event: "PAYMENT_RECEIVED",
        payment: { ...payment, value },
      });

      expect(result).toBe("divergent");
      expect(mocks.createEvent).toHaveBeenCalledWith({
        data: expect.objectContaining({
          externalEventId: "evt-mismatch",
          eventType: "PAYMENT_AMOUNT_MISMATCH",
          payload: expect.objectContaining({ localAmountCents: 10010 }),
        }),
      });
      expect(mocks.updateCharge).not.toHaveBeenCalled();
    },
  );

  it("compares against the current transactional amount", async () => {
    mocks.findCurrent.mockResolvedValueOnce({
      id: "charge-a", asaasPaymentId: "pay-123", amountCents: 12000,
      status: "PENDING", paidAt: null,
    });

    expect(await reconcileAsaasEvent({
      id: "evt-concurrent", event: "PAYMENT_RECEIVED", payment,
    })).toBe("divergent");
    expect(mocks.updateCharge).not.toHaveBeenCalled();
  });

  it("deduplicates discrepancies and allows a new corrected event", async () => {
    mocks.createEvent.mockResolvedValueOnce({})
      .mockRejectedValueOnce({ code: "P2002" })
      .mockResolvedValueOnce({});
    const event = {
      id: "evt-mismatch",
      event: "PAYMENT_RECEIVED",
      payment: { ...payment, value: 90 },
    };

    expect(await reconcileAsaasEvent(event)).toBe("divergent");
    expect(await reconcileAsaasEvent(event)).toBe("duplicate");
    expect(mocks.updateCharge).not.toHaveBeenCalled();
    expect(await reconcileAsaasEvent({
      ...event, id: "evt-corrected", payment,
    })).toBe("processed");
    expect(mocks.updateCharge).toHaveBeenCalledTimes(1);
  });

});

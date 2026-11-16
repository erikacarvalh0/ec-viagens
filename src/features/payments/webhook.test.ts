import type { ChargeStatus } from "@prisma/client";
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

const events = [
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_RESTORED",
];

// null means the event is recorded without changing the charge.
const transitions: { status: ChargeStatus; next: (ChargeStatus | null)[] }[] = [
  { status: "PENDING", next: ["PAID", "PAID", "OVERDUE", "CANCELLED", "REFUNDED", "PENDING"] },
  { status: "OVERDUE", next: ["PAID", "PAID", "OVERDUE", "CANCELLED", "REFUNDED", "PENDING"] },
  { status: "PAID", next: ["PAID", "PAID", null, "CANCELLED", "REFUNDED", null] },
  { status: "CANCELLED", next: [null, null, null, null, "REFUNDED", null] },
  { status: "REFUNDED", next: [null, null, null, null, "REFUNDED", null] },
];

describe("Asaas webhook reconciliation", () => {
  beforeEach(() => {
    mocks.createEvent.mockReset();
    mocks.updateCharge.mockReset();
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

  it.each(transitions.flatMap(({ status, next }) =>
    events.map((event, index) => ({ status, event, next: next[index] })),
  ))("reconciles $status + $event as $next with an audit record", async ({ status, event, next }) => {
    const paidAt = status === "PAID" ? new Date("2026-11-14") : null;
    mocks.findCurrent.mockResolvedValue({
      id: "charge-a",
      asaasPaymentId: "pay-123",
      status,
      paidAt,
    });
    const payload = { id: "evt-transition", event, payment };

    expect(await reconcileAsaasEvent(payload)).toBe("processed");
    expect(mocks.createEvent).toHaveBeenCalledWith({
      data: {
        chargeId: "charge-a",
        externalEventId: payload.id,
        eventType: event,
        payload,
      },
    });
    if (next === null) {
      expect(mocks.updateCharge).not.toHaveBeenCalled();
    } else {
      expect(mocks.updateCharge).toHaveBeenCalledWith({
        where: { id: "charge-a" },
        data: {
          status: next,
          paidAt: next === "PAID" ? paidAt ?? new Date(payment.paymentDate) : null,
        },
      });
    }
  });

  it("preserves the payment date across distinct confirmations and a late receipt", async () => {
    const charge = {
      id: "charge-a",
      asaasPaymentId: "pay-123",
      status: "PENDING",
      paidAt: null as Date | null,
    };
    mocks.findCurrent.mockImplementation(async () => charge);
    mocks.updateCharge.mockImplementation(async ({ data }) => Object.assign(charge, data));

    for (const [index, event] of ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].entries()) {
      await reconcileAsaasEvent({
        id: `evt-paid-${index}`,
        event,
        payment: { ...payment, paymentDate: `2026-11-${14 + index}` },
      });
    }

    expect(charge.status).toBe("PAID");
    expect(charge.paidAt).toEqual(new Date("2026-11-14"));
    expect(mocks.createEvent).toHaveBeenCalledTimes(2);
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

  it.each(["PAYMENT_RECEIVED", "PAYMENT_DELETED", "PAYMENT_REFUNDED"])("treats duplicate %s event IDs as already processed", async (event) => {
    mocks.createEvent.mockRejectedValue({ code: "P2002" });

    const result = await reconcileAsaasEvent({
      id: "evt-5",
      event,
      payment,
    });

    expect(result).toBe("duplicate");
    expect(mocks.updateCharge).not.toHaveBeenCalled();
  });
});

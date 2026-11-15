import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTripAdmin: vi.fn(),
  findPlan: vi.fn(),
  findMember: vi.fn(),
  createCharge: vi.fn(),
  updateCharge: vi.fn(),
  createCustomer: vi.fn(),
  createPayment: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/members/permissions", () => ({
  requireTripAdmin: mocks.requireTripAdmin,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    paymentPlan: { findFirst: mocks.findPlan },
    tripMember: { findFirst: mocks.findMember },
    charge: { create: mocks.createCharge, update: mocks.updateCharge },
  },
}));
vi.mock("./asaas", () => ({
  createAsaasCustomer: mocks.createCustomer,
  createAsaasPayment: mocks.createPayment,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { issueCharge } from "./charges";

function form() {
  const data = new FormData();
  data.set("planId", "plan-a");
  data.set("memberId", "member-a");
  data.set("dueAt", "2027-03-10");
  return data;
}

describe("charge issuing", () => {
  beforeEach(() => {
    mocks.requireTripAdmin.mockResolvedValue({ id: "admin" });
    mocks.findPlan.mockResolvedValue({
      id: "plan-a",
      tripId: "trip-a",
      name: "Parcela",
      amountCents: 12550,
    });
    mocks.findMember.mockResolvedValue({
      id: "member-a",
      user: { id: "user-a", name: "Ana", email: "ana@example.com" },
    });
    mocks.createCharge.mockResolvedValue({ id: "charge-a" });
    mocks.createCustomer.mockResolvedValue("cus_123");
    mocks.createPayment.mockResolvedValue({
      id: "pay_123",
      invoiceUrl: "https://sandbox.asaas.com/i/abc",
    });
  });

  it("creates a charge with an Asaas payment link", async () => {
    const result = await issueCharge("trip-a", { error: "" }, form());

    expect(result.error).toBe("");
    expect(mocks.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_123",
        value: 125.5,
        dueDate: "2027-03-10",
        externalReference: "charge-a",
      }),
    );
    expect(mocks.updateCharge).toHaveBeenCalledWith({
      where: { id: "charge-a" },
      data: {
        asaasPaymentId: "pay_123",
        paymentUrl: "https://sandbox.asaas.com/i/abc",
      },
    });
  });

  it("rejects non-administrators before calling Asaas", async () => {
    mocks.requireTripAdmin.mockRejectedValue(new Error("Forbidden"));

    const result = await issueCharge("trip-a", { error: "" }, form());

    expect(result.error).not.toBe("");
    expect(mocks.createCustomer).not.toHaveBeenCalled();
  });

  it("rejects members from another trip", async () => {
    mocks.findMember.mockResolvedValue(null);

    const result = await issueCharge("trip-a", { error: "" }, form());

    expect(result.error).not.toBe("");
    expect(mocks.createCustomer).not.toHaveBeenCalled();
  });

  it("rejects invalid dates before database writes", async () => {
    const data = form();
    data.set("dueAt", "not-a-date");

    const result = await issueCharge("trip-a", { error: "" }, data);

    expect(result.error).not.toBe("");
    expect(mocks.createCharge).not.toHaveBeenCalled();
  });
});

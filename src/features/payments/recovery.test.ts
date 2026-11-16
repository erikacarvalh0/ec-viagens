import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  findFirst: vi.fn(),
  findPayment: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/features/members/permissions", () => ({
  requireTripAdmin: mocks.admin,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { charge: { findFirst: mocks.findFirst, update: mocks.update, updateMany: mocks.updateMany } },
}));
vi.mock("./asaas", () => ({
  findAsaasPaymentByReference: mocks.findPayment,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { recoverCharge } from "./recovery";

describe("recovering a charge after an Asaas request failure", () => {
  beforeEach(() => {
    mocks.admin.mockResolvedValue({ id: "admin" });
    mocks.findFirst.mockResolvedValue({
      id: "charge-a",
      status: "PENDING",
      asaasPaymentId: null,
      paymentUrl: null,
    });
    mocks.findPayment.mockResolvedValue({
      id: "pay-a",
      externalReference: "charge-a",
      invoiceUrl: "https://sandbox.asaas.com/i/abc",
      status: "PENDING",
    });
    mocks.update.mockResolvedValue({ id: "charge-a" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("recovers an existing payment without creating another one", async () => {
    const result = await recoverCharge("trip-a", "charge-a");

    expect(result.error).toBe("");
    expect(mocks.findPayment).toHaveBeenCalledWith("charge-a");
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "charge-a", status: "PENDING", asaasPaymentId: null },
      data: {
        asaasPaymentId: "pay-a",
        paymentUrl: "https://sandbox.asaas.com/i/abc",
        status: "PENDING",
      },
    });
  });

  it("does not overwrite a charge linked by a concurrent webhook", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    const result = await recoverCharge("trip-a", "charge-a");
    expect(result.success).toBeUndefined();
    expect(result.error).toContain("outra operação");
  });

  it("rejects a provider payment with a mismatched reference", async () => {
    mocks.findPayment.mockResolvedValue({
      id: "pay-other",
      externalReference: "another-charge",
      invoiceUrl: "https://sandbox.asaas.com/i/other",
      status: "PENDING",
    });
    const result = await recoverCharge("trip-a", "charge-a");
    expect(result.error).toContain("referência");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("prevents access by non-admins", async () => {
    mocks.admin.mockRejectedValue(new Error("Forbidden"));

    const result = await recoverCharge("trip-a", "charge-a");

    expect(result.error).not.toBe("");
    expect(mocks.findPayment).not.toHaveBeenCalled();
  });

  it("does not recover charges from another trip", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const result = await recoverCharge("trip-a", "charge-a");

    expect(result.error).not.toBe("");
    expect(mocks.findPayment).not.toHaveBeenCalled();
  });

  it("does not issue new payments when Asaas has no matching reference", async () => {
    mocks.findPayment.mockResolvedValue(null);

    const result = await recoverCharge("trip-a", "charge-a");

    expect(result.error).not.toBe("");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("does not overwrite already linked charges", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "charge-a",
      asaasPaymentId: "existing",
      status: "PAID",
    });

    const result = await recoverCharge("trip-a", "charge-a");

    expect(result.error).not.toBe("");
    expect(mocks.findPayment).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTripAdmin: vi.fn(),
  requireTripMember: vi.fn(),
  create: vi.fn(),
  findFirst: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/members/permissions", () => ({
  requireTripAdmin: mocks.requireTripAdmin,
  requireTripMember: mocks.requireTripMember,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    paymentPlan: {
      create: mocks.create,
      findFirst: mocks.findFirst,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { createPaymentPlan } from "./actions";

function form(amount = "125.50") {
  const data = new FormData();
  data.set("name", "Parcela mensal");
  data.set("amount", amount);
  data.set("dueDay", "10");
  return data;
}

describe("payment plan actions", () => {
  beforeEach(() => {
    mocks.requireTripAdmin.mockResolvedValue({ id: "admin" });
    mocks.create.mockResolvedValue({ id: "plan-a" });
  });

  it("allows an admin to create a trip-scoped payment plan", async () => {
    const result = await createPaymentPlan("trip-a", { error: "" }, form());

    expect(result.error).toBe("");
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        tripId: "trip-a",
        name: "Parcela mensal",
        amountCents: 12550,
        dueDay: 10,
      },
    });
  });

  it("rejects non-admins", async () => {
    mocks.requireTripAdmin.mockRejectedValue(new Error("Forbidden"));

    const result = await createPaymentPlan("trip-a", { error: "" }, form());

    expect(result.error).not.toBe("");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects invalid values without database writes", async () => {
    const result = await createPaymentPlan("trip-a", { error: "" }, form("0"));

    expect(result.error).not.toBe("");
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

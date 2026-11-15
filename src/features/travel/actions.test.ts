import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTripMember: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  transaction: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/members/permissions", () => ({
  requireTripMember: mocks.requireTripMember,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { saveTravelDetails } from "./actions";

function makeForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    city: "São Paulo",
    state: "SP",
    whatsapp: "11999999999",
    outboundAt: "2027-01-10",
    outboundPeriod: "MORNING",
    outboundOrigin: "São Paulo",
    returnAt: "2027-01-15",
    returnPeriod: "EVENING",
    returnOrigin: "Ibiúna",
    transportMode: "Carro",
    needsRide: "on",
    offersRide: "on",
    rideOutbound: "on",
  })) {
    form.set(key, value);
  }

  return form;
}

describe("travel details actions", () => {
  beforeEach(() => {
    mocks.requireTripMember.mockResolvedValue({
      id: "membership-a",
      userId: "user-a",
      role: "MEMBER",
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        user: { update: mocks.update },
        travelInfo: { upsert: mocks.upsert },
      }),
    );
  });

  it("stores a profile only for the authenticated trip member", async () => {
    const result = await saveTravelDetails("trip-a", { error: "" }, makeForm());

    expect(result.error).toBe("");
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { memberId: "membership-a" },
        create: expect.objectContaining({
          memberId: "membership-a",
          needsRide: true,
          offersRide: true,
          rideOutbound: true,
        }),
      }),
    );
  });

  it("rejects invalid travel dates without touching the database", async () => {
    const form = makeForm();
    form.set("returnAt", "2027-01-09");

    const result = await saveTravelDetails("trip-a", { error: "" }, form);

    expect(result.error).not.toBe("");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects access to another trip", async () => {
    mocks.requireTripMember.mockRejectedValue(new Error("Access denied"));

    const result = await saveTravelDetails("trip-b", { error: "" }, makeForm());

    expect(result.error).not.toBe("");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";

import { buildTripOverview } from "./overview";

const charges = [
  { amountCents: 10000, status: "PAID" as const },
  { amountCents: 20000, status: "PENDING" as const },
  { amountCents: 30000, status: "OVERDUE" as const },
  { amountCents: 40000, status: "CANCELLED" as const },
];

describe("trip overview", () => {
  it("summarizes payment statuses without counting cancelled charges", () => {
    expect(buildTripOverview({ memberCount: 5, photoCount: 9, charges })).toEqual({
      memberCount: 5,
      photoCount: 9,
      totalCents: 60000,
      paidCents: 10000,
      outstandingCents: 50000,
      overdueCount: 1,
    });
  });

  it("returns zero totals when no charges exist", () => {
    expect(buildTripOverview({ memberCount: 1, photoCount: 0, charges: [] })).toEqual({
      memberCount: 1,
      photoCount: 0,
      totalCents: 0,
      paidCents: 0,
      outstandingCents: 0,
      overdueCount: 0,
    });
  });

  it("excludes refunded charges", () => {
    const result = buildTripOverview({
      memberCount: 2,
      photoCount: 0,
      charges: [{ amountCents: 5000, status: "REFUNDED" }],
    });
    expect(result.totalCents).toBe(0);
  });
});

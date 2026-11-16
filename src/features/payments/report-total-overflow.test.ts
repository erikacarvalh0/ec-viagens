import { describe, expect, it } from "vitest";

import { buildFinancialReport } from "./report";

describe("financial report aggregate amount safety", () => {
  it.each(["m1", "m2"])("rejects overflow when the second member is %s", (memberId) => {
    expect(() => buildFinancialReport([
      { id: "1", memberId: "m1", amountCents: Number.MAX_SAFE_INTEGER, status: "PAID" },
      { id: "2", memberId, amountCents: 1, status: "PENDING" },
    ])).toThrow("Invalid report total.");
  });

  it("accepts totals at the safe integer boundary", () => {
    const report = buildFinancialReport([
      { id: "1", memberId: "m1", amountCents: Number.MAX_SAFE_INTEGER - 1, status: "PAID" },
      { id: "2", memberId: "m1", amountCents: 1, status: "OVERDUE" },
    ]);

    expect(report.expectedCents).toBe(Number.MAX_SAFE_INTEGER);
    expect(report.byMember.m1.expectedCents).toBe(Number.MAX_SAFE_INTEGER);
    expect(report.outstandingCents).toBe(1);
  });

  it.each(["CANCELLED", "REFUNDED"] as const)("excludes %s charges from the overflow check", (status) => {
    const report = buildFinancialReport([
      { id: "1", memberId: "m1", amountCents: Number.MAX_SAFE_INTEGER, status: "PAID" },
      { id: "2", memberId: "m1", amountCents: 1, status },
    ]);

    expect(report.expectedCents).toBe(Number.MAX_SAFE_INTEGER);
  });
});

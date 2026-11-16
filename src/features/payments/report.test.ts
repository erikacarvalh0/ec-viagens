import { describe, expect, it } from "vitest";

import { buildFinancialReport } from "./report";

const charges = [
  { id: "a", memberId: "m1", amountCents: 10000, status: "PAID" as const },
  { id: "b", memberId: "m1", amountCents: 2500, status: "PENDING" as const },
  { id: "c", memberId: "m2", amountCents: 5000, status: "OVERDUE" as const },
  { id: "d", memberId: "m2", amountCents: 1500, status: "CANCELLED" as const },
  { id: "e", memberId: "m2", amountCents: 3000, status: "REFUNDED" as const },
];

describe("trip financial report", () => {
  it("excludes cancelled and refunded charges from expected revenue", () => {
    const report = buildFinancialReport(charges);

    expect(report.expectedCents).toBe(17500);
    expect(report.paidCents).toBe(10000);
    expect(report.pendingCents).toBe(2500);
    expect(report.overdueCents).toBe(5000);
    expect(report.outstandingCents).toBe(7500);
  });

  it("summarizes balances per member", () => {
    const report = buildFinancialReport(charges);

    expect(report.byMember.m1).toEqual({
      expectedCents: 12500,
      paidCents: 10000,
      outstandingCents: 2500,
    });
    expect(report.byMember.m2).toEqual({
      expectedCents: 5000,
      paidCents: 0,
      outstandingCents: 5000,
    });
  });

  it("handles empty trips", () => {
    const report = buildFinancialReport([]);
    expect(report.expectedCents).toBe(0);
    expect(report.outstandingCents).toBe(0);
    expect(report.byMember).toEqual({});
  });

  it.each(["__proto__", "constructor", "toString"])(
    "summarizes balances for member ID %s without inherited properties",
    (memberId) => {
      const report = buildFinancialReport([
        { id: "a", memberId, amountCents: 10000, status: "PAID" },
        { id: "b", memberId, amountCents: 2500, status: "OVERDUE" },
        { id: "c", memberId: "m1", amountCents: 500, status: "PENDING" },
      ]);

      expect(Object.keys(report.byMember)).toEqual([memberId, "m1"]);
      expect(report.byMember[memberId]).toEqual({
        expectedCents: 12500,
        paidCents: 10000,
        outstandingCents: 2500,
      });
      expect(report.byMember.m1).toEqual({
        expectedCents: 500,
        paidCents: 0,
        outstandingCents: 500,
      });
      expect(report.expectedCents).toBe(13000);
      expect(buildFinancialReport([]).byMember[memberId]).toBeUndefined();
    },
  );
});

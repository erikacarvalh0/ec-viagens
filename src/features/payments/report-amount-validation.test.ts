import { describe, expect, it } from "vitest";
import { buildFinancialReport } from "./report";
describe("financial report amount safety", () => {
  it("rejects negative charge amounts", () => {
    expect(() => buildFinancialReport([{ id: "1", memberId: "m1", amountCents: -100, status: "PAID" }])).toThrow("Invalid charge amount.");
  });
  it("rejects non-integer charge amounts", () => {
    expect(() => buildFinancialReport([{ id: "1", memberId: "m1", amountCents: 10.5, status: "PENDING" }])).toThrow("Invalid charge amount.");
  });
  it("rejects amounts exceeding safe integer range", () => {
    expect(() => buildFinancialReport([{ id: "1", memberId: "m1", amountCents: Number.MAX_SAFE_INTEGER + 1, status: "PAID" }])).toThrow("Invalid charge amount.");
  });
  it("accepts zero-valued charges", () => {
    expect(buildFinancialReport([{ id: "1", memberId: "m1", amountCents: 0, status: "PAID" }]).paidCents).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { financialReportCsv } from "./export";
describe("CSV aggregate amount safety", () => {
 it("rejects total amounts that exceed safe integer range", () => {
  const row = {name:"Ana",expectedCents:Number.MAX_SAFE_INTEGER,paidCents:0,outstandingCents:0};
  expect(() => financialReportCsv([row,row])).toThrow("Invalid export amount.");
 });
 it("allows valid small totals", () => {
  const row = {name:"Ana",expectedCents:100,paidCents:50,outstandingCents:50};
  expect(financialReportCsv([row,row])).toContain("TOTAL;2,00;1,00;1,00");
 });
});

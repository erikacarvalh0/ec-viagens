import { describe, expect, it } from "vitest";
import { financialReportCsv } from "./export";
const row = (value:number) => [{name:"Ana",expectedCents:value,paidCents:0,outstandingCents:value}];
describe("CSV export amount validation", () => {
 it("rejects invalid fractional cents", () => { expect(() => financialReportCsv(row(1.5))).toThrow("Invalid export amount."); });
 it("rejects unsafe integer amounts", () => { expect(() => financialReportCsv(row(Number.MAX_SAFE_INTEGER+1))).toThrow("Invalid export amount."); });
 it("rejects negative values", () => { expect(() => financialReportCsv(row(-1))).toThrow("Invalid export amount."); });
 it("allows zero", () => { expect(financialReportCsv(row(0))).toContain("0,00"); });
});

import { describe, expect, it } from "vitest";
import { financialReportCsv } from "./export";
describe("financial CSV summary", () => {
  it("includes totals for all exported participants", () => {
    const csv = financialReportCsv([
      { name: "Ana", expectedCents: 1200, paidCents: 200, outstandingCents: 1000 },
      { name: "Bia", expectedCents: 300, paidCents: 300, outstandingCents: 0 },
    ]);
    expect(csv).toContain("TOTAL;15,00;5,00;10,00");
  });
  it("exports zero totals for an empty report", () => {
    expect(financialReportCsv([])).toContain("TOTAL;0,00;0,00;0,00");
  });
});

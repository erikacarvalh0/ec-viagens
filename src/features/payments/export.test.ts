import { describe, expect, it } from "vitest";
import { financialReportCsv } from "./export";
describe("financial CSV export", () => {
  it("escapes formulas and CSV delimiters in participant names", () => {
    const csv = financialReportCsv([{ name: '=IMPORT("x")', expectedCents: 1250, paidCents: 500, outstandingCents: 750 }]);
    expect(csv).toContain('"\'=IMPORT(""x"")"');
    expect(csv).toContain("12,50;5,00;7,50");
  });
  it("includes a UTF-8 BOM and header", () => {
    expect(financialReportCsv([])).toBe("\uFEFFParticipante;Previsto (BRL);Pago (BRL);A receber (BRL)\r\n");
  });
});

type MemberExport = {
  name: string;
  expectedCents: number;
  paidCents: number;
  outstandingCents: number;
};

function cell(value: string): string {
  // Spreadsheet apps interpret cells beginning with =, +, -, or @ as formulas.
  const safe = /^[\s]*[=+@\-\t\r]/.test(value) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}

function amount(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error("Invalid export amount.");
  }
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function financialReportCsv(members: MemberExport[]): string {
  const rows = ["Participante;Previsto (BRL);Pago (BRL);A receber (BRL)"];
  for (const member of members) {
    rows.push([cell(member.name), amount(member.expectedCents), amount(member.paidCents), amount(member.outstandingCents)].join(";"));
  }
  const totals = members.reduce(
    (sum, member) => ({
      expectedCents: sum.expectedCents + member.expectedCents,
      paidCents: sum.paidCents + member.paidCents,
      outstandingCents: sum.outstandingCents + member.outstandingCents,
    }),
    { expectedCents: 0, paidCents: 0, outstandingCents: 0 },
  );
  if (![totals.expectedCents, totals.paidCents, totals.outstandingCents].every((value) => Number.isSafeInteger(value) && value >= 0)) {
    throw new Error("Invalid export amount.");
  }
  rows.push(["TOTAL", amount(totals.expectedCents), amount(totals.paidCents), amount(totals.outstandingCents)].join(";"));
  return "\uFEFF" + rows.join("\r\n") + "\r\n";
}

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
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function financialReportCsv(members: MemberExport[]): string {
  const rows = ["Participante;Previsto (BRL);Pago (BRL);A receber (BRL)"];
  for (const member of members) {
    rows.push([cell(member.name), amount(member.expectedCents), amount(member.paidCents), amount(member.outstandingCents)].join(";"));
  }
  return "\uFEFF" + rows.join("\r\n") + "\r\n";
}

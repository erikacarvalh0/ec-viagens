type ReportCharge = {
  id: string;
  memberId: string;
  amountCents: number;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";
};

type MemberBalance = {
  expectedCents: number;
  paidCents: number;
  outstandingCents: number;
};

export function buildFinancialReport(charges: ReportCharge[]) {
  const report: {
    expectedCents: number;
    paidCents: number;
    pendingCents: number;
    overdueCents: number;
    outstandingCents: number;
    byMember: Record<string, MemberBalance>;
  } = {
    expectedCents: 0,
    paidCents: 0,
    pendingCents: 0,
    overdueCents: 0,
    outstandingCents: 0,
    byMember: {},
  };

  for (const charge of charges) {
    if (charge.status === "CANCELLED" || charge.status === "REFUNDED") {
      continue;
    }

    const balance = report.byMember[charge.memberId] ?? {
      expectedCents: 0,
      paidCents: 0,
      outstandingCents: 0,
    };
    report.byMember[charge.memberId] = balance;
    report.expectedCents += charge.amountCents;
    balance.expectedCents += charge.amountCents;

    if (charge.status === "PAID") {
      report.paidCents += charge.amountCents;
      balance.paidCents += charge.amountCents;
    } else {
      report.outstandingCents += charge.amountCents;
      balance.outstandingCents += charge.amountCents;

      if (charge.status === "OVERDUE") {
        report.overdueCents += charge.amountCents;
      } else {
        report.pendingCents += charge.amountCents;
      }
    }
  }

  return report;
}

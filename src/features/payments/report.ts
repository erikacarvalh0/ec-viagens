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
    byMember: Object.create(null),
  };

  for (const charge of charges) {
    if (!Number.isSafeInteger(charge.amountCents) || charge.amountCents < 0) {
      throw new Error("Invalid charge amount.");
    }
    if (charge.status === "CANCELLED" || charge.status === "REFUNDED") {
      continue;
    }

    // All other totals are nonnegative subsets of the expected revenue.
    if (!Number.isSafeInteger(report.expectedCents + charge.amountCents)) {
      throw new Error("Invalid report total.");
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

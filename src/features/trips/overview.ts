type OverviewCharge = { amountCents: number; status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED" };

export function buildTripOverview({ memberCount, photoCount, charges }: {
  memberCount: number;
  photoCount: number;
  charges: OverviewCharge[];
}) {
  const summary = { memberCount, photoCount, totalCents: 0, paidCents: 0, outstandingCents: 0, overdueCount: 0 };
  for (const charge of charges) {
    if (charge.status === "CANCELLED" || charge.status === "REFUNDED") continue;
    summary.totalCents += charge.amountCents;
    if (charge.status === "PAID") summary.paidCents += charge.amountCents;
    else summary.outstandingCents += charge.amountCents;
    if (charge.status === "OVERDUE") summary.overdueCount++;
  }
  return summary;
}

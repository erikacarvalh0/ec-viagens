import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/design-system";
import { buildFinancialReport } from "@/features/payments/report";
import { financialReportCsv } from "@/features/payments/export";
import { formatBRL } from "@/features/payments/schema";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

type PageProps = { params: Promise<{ tripId: string }> };

export default async function TripFinancialReportPage({ params }: PageProps) {
  const { tripId } = await params;
  const userId = await requireUserId();

  const membership = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
    include: { trip: true },
  });

  if (!membership || membership.role !== "ADMIN") {
    notFound();
  }

  const [charges, members] = await Promise.all([
    prisma.charge.findMany({
      where: { plan: { tripId } },
      select: { id: true, memberId: true, amountCents: true, status: true },
    }),
    prisma.tripMember.findMany({
      where: { tripId },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const report = buildFinancialReport(charges);
  const csv = financialReportCsv(members.map((member) => ({
    name: member.user.name,
    ...(report.byMember[member.id] ?? { expectedCents: 0, paidCents: 0, outstandingCents: 0 }),
  })));

  return (
    <main className="members-page">
      <Link href={`/trips/${tripId}/payments`}>← Voltar aos pagamentos</Link>
      <p className="eyebrow">RELATÓRIO FINANCEIRO</p>
      <h1>{membership.trip.name}</h1>
      <p>Resumo das cobranças registradas nesta viagem.</p>

      <section className="payment-plans" aria-label="Resumo financeiro">
        {[
          { label: "Total previsto", amount: report.expectedCents },
          { label: "Recebido", amount: report.paidCents },
          { label: "Pendente", amount: report.pendingCents },
          { label: "Vencido", amount: report.overdueCents },
          { label: "A receber", amount: report.outstandingCents },
        ].map((item) => (
          <Card key={item.label} padding="lg">
            <h2>{item.label}</h2>
            <strong>{formatBRL(item.amount)}</strong>
          </Card>
        ))}
      </section>

      <a download={`relatorio-financeiro-${tripId}.csv`} href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}>
        Exportar relatório CSV
      </a>
      <h2>Situação por participante</h2>
      <section className="payment-plans">
        {members.map((member) => {
          const balance = report.byMember[member.id] ?? {
            expectedCents: 0,
            paidCents: 0,
            outstandingCents: 0,
          };

          return (
            <Card key={member.id} padding="lg">
              <h3>{member.user.name}</h3>
              <p>Previsto: {formatBRL(balance.expectedCents)}</p>
              <p>Pago: {formatBRL(balance.paidCents)}</p>
              <p>A receber: {formatBRL(balance.outstandingCents)}</p>
            </Card>
          );
        })}
      </section>
      <p>
        Valores cancelados ou reembolsados não entram no total previsto.
        Este relatório reflete os registros locais atualizados pelos webhooks.
      </p>
    </main>
  );
}

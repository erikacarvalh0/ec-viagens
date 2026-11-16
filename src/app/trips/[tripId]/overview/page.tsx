import Link from "next/link";

import { Card } from "@/design-system";
import { requireTripMember } from "@/features/members/permissions";
import { formatBRL } from "@/features/payments/schema";
import { buildTripOverview } from "@/features/trips/overview";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ tripId: string }> };

export default async function TripOverviewPage({ params }: PageProps) {
  const { tripId } = await params;
  const membership = await requireTripMember(tripId);
  const isAdmin = membership.role === "ADMIN";
  const [memberCount, photoCount, charges] = await Promise.all([
    prisma.tripMember.count({ where: { tripId } }),
    prisma.photo.count({ where: { tripId } }),
    prisma.charge.findMany({
      where: { plan: { tripId }, ...(!isAdmin ? { memberId: membership.id } : {}) },
      select: { amountCents: true, status: true },
    }),
  ]);
  const summary = buildTripOverview({ memberCount, photoCount, charges });
  return (
    <main className="members-page">
      <Link href="/dashboard">← Voltar às viagens</Link>
      <p className="eyebrow">VISÃO GERAL</p>
      <h1>{membership.trip.name}</h1>
      <p>{isAdmin ? "Resumo da viagem" : "Resumo da viagem e dos seus pagamentos"}</p>
      <section className="payment-plans" aria-label="Indicadores da viagem">
        <Card padding="lg">
          <h2>Participantes</h2>
          <strong>{summary.memberCount}</strong>
          <p><Link href={`/trips/${tripId}/members`}>Ver participantes</Link></p>
        </Card>
        <Card padding="lg">
          <h2>Fotos</h2>
          <strong>{summary.photoCount}</strong>
          <p><Link href={`/trips/${tripId}/photos`}>Abrir galeria</Link></p>
        </Card>
        <Card padding="lg">
          <h2>{isAdmin ? "Valor total previsto" : "Total das suas cobranças"}</h2>
          <strong>{formatBRL(summary.totalCents)}</strong>
          <p>Pago: {formatBRL(summary.paidCents)}</p>
          <p>Em aberto: {formatBRL(summary.outstandingCents)}</p>
          <p>Cobranças vencidas: {summary.overdueCount}</p>
          <p><Link href={`/trips/${tripId}/payments`}>Ver pagamentos</Link></p>
        </Card>
      </section>
      <nav aria-label="Áreas da viagem">
        <p><Link href={`/trips/${tripId}/travel`}>Transporte e caronas</Link></p>
        {isAdmin && <p><Link href={`/trips/${tripId}/payments/report`}>Relatório financeiro</Link></p>}
      </nav>
    </main>
  );
}

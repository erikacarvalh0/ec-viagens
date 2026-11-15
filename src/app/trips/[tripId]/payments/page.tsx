import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/design-system";
import { ChargeForm } from "@/features/payments/ChargeForm";
import { PaymentPlanForm } from "@/features/payments/PaymentPlanForm";
import { formatBRL } from "@/features/payments/schema";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

type PageProps = { params: Promise<{ tripId: string }> };

export default async function TripPaymentsPage({ params }: PageProps) {
  const { tripId } = await params;
  const userId = await requireUserId();

  const membership = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
    include: { trip: true },
  });

  if (!membership) {
    notFound();
  }

  const plans = await prisma.paymentPlan.findMany({
    where: { tripId },
    orderBy: { name: "asc" },
    include: {
      charges: {
        where: membership.role === "ADMIN"
          ? undefined
          : { memberId: membership.id },
        select: { id: true, status: true, amountCents: true, paymentUrl: true, dueAt: true, member: { select: { user: { select: { name: true } } } } },
      },
    },
  });

  const participants = membership.role === "ADMIN"
    ? await prisma.tripMember.findMany({
        where: { tripId },
        select: { id: true, user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      })
    : [];

  return (
    <main className="members-page">
      <Link href="/dashboard">← Voltar às viagens</Link>
      <p className="eyebrow">FINANCEIRO</p>
      <h1>{membership.trip.name}</h1>
      <p>Planos de pagamento da viagem</p>

      {membership.role === "ADMIN" && (
        <p><Link href={`/trips/${tripId}/payments/report`}>Ver relatório financeiro →</Link></p>
      )}

      {membership.role === "ADMIN" && <PaymentPlanForm tripId={tripId} />}

      {membership.role === "ADMIN" && (
        <ChargeForm
          tripId={tripId}
          plans={plans.map((plan) => ({ id: plan.id, name: plan.name }))}
          members={participants.map((member) => ({ id: member.id, name: member.user.name }))}
        />
      )}

      <section className="payment-plans">
        {plans.map((plan) => (
          <Card key={plan.id} padding="lg">
            <h2>{plan.name}</h2>
            <strong>{formatBRL(plan.amountCents)}</strong>
            <p>
              {plan.dueDay
                ? `Vencimento previsto: dia ${plan.dueDay}`
                : "Vencimento a definir"}
            </p>
            {membership.role === "ADMIN" && (
              <p>{plan.charges.length} cobranças cadastradas</p>
            )}
            {plan.charges.map((charge) => (
              <div key={charge.id}>
                <p>
                  {membership.role === "ADMIN" && `${charge.member.user.name} — `}
                  {formatBRL(charge.amountCents)} — {charge.status}
                  {" — "}
                  {charge.dueAt.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                </p>
                {charge.paymentUrl && (
                  <a href={charge.paymentUrl} target="_blank" rel="noopener noreferrer">
                    Abrir link de pagamento
                  </a>
                )}
              </div>
            ))}
            {membership.role !== "ADMIN" && (
              <p>
                {plan.charges.length
                  ? `${plan.charges.filter((charge) => charge.status === "PAID").length} de ${plan.charges.length} cobranças pagas`
                  : "Nenhuma cobrança atribuída a você."}
              </p>
            )}
          </Card>
        ))}
        {!plans.length && (
          <Card padding="md">
            <p>Nenhum plano de pagamento cadastrado ainda.</p>
          </Card>
        )}
      </section>
    </main>
  );
}

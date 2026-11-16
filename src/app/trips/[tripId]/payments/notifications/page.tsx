import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/design-system";
import { ReviewButton } from "@/features/notifications/ReviewButton";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

type PageProps = { params: Promise<{ tripId: string }> };

const labels: Record<string, string> = {
  PENDING: "Agendado",
  PROCESSING: "Em processamento",
  SENT: "Aceito pela Meta",
  DELIVERED: "Entregue",
  READ: "Lido",
  CANCELLED: "Cancelado",
  REVIEW_REQUIRED: "Requer revisão",
  REVIEWED: "Revisado",
};

export default async function TripNotificationsPage({ params }: PageProps) {
  const { tripId } = await params;
  const userId = await requireUserId();
  const membership = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
    include: { trip: true },
  });

  if (!membership || membership.role !== "ADMIN") {
    notFound();
  }

  const charges = await prisma.charge.findMany({
    where: { plan: { tripId } },
    select: {
      id: true,
      member: { select: { user: { select: { name: true } } } },
    },
  });
  const names = new Map(charges.map((charge) => [charge.id, charge.member.user.name]));

  const notifications = charges.length
    ? await prisma.notification.findMany({
        where: {
          kind: "PAYMENT_REMINDER",
          referenceId: { in: charges.map((charge) => charge.id) },
        },
        orderBy: { scheduledFor: "desc" },
        take: 100,
      })
    : [];

  return (
    <main className="members-page">
      <Link href={`/trips/${tripId}/payments`}>← Voltar aos pagamentos</Link>
      <p className="eyebrow">WHATSAPP</p>
      <h1>Lembretes de {membership.trip.name}</h1>
      <p>
        Acompanhamento dos últimos 100 lembretes. “Aceito pela Meta”
        não significa que a mensagem foi entregue.
      </p>

      <section className="payment-plans">
        {notifications.map((notification) => (
          <Card key={notification.id} padding="lg">
            <h2>{names.get(notification.referenceId) ?? "Participante"}</h2>
            <p>Status: {labels[notification.status] ?? notification.status}</p>
            <p>
              Agendado para: {notification.scheduledFor.toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}
            </p>
            {notification.sentAt && (
              <p>
                Aceito em: {notification.sentAt.toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })}
              </p>
            )}
            {notification.status === "REVIEW_REQUIRED" && (
              <>
                <p>Confira a mensagem na Meta antes de concluir a revisão.</p>
                <ReviewButton tripId={tripId} notificationId={notification.id} />
              </>
            )}
          </Card>
        ))}
        {!notifications.length && (
          <Card padding="md">
            <p>Nenhum lembrete encontrado para esta viagem.</p>
          </Card>
        )}
      </section>
    </main>
  );
}

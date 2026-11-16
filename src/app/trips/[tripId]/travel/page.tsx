import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/design-system";
import { getCoordinationGroups } from "@/features/travel/coordination";
import { TravelForm } from "@/features/travel/TravelForm";
import { RideOfferList } from "@/features/travel/RideOfferList";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

type PageProps = { params: Promise<{ tripId: string }> };

function dateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function TravelPage({ params }: PageProps) {
  const { tripId } = await params;
  const userId = await requireUserId();
  const current = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
    include: { user: true, travel: true, trip: true },
  });

  if (!current) {
    notFound();
  }

  const members = await prisma.tripMember.findMany({
    where: { tripId },
    include: { user: true, travel: true },
  });

  const groups = getCoordinationGroups(
    members.map((member) => ({
      id: member.id,
      name: member.user.name,
      travel: member.travel,
    })),
    current.id,
  );

  const profile = {
    city: current.user.city ?? "",
    state: current.user.state ?? "",
    whatsapp: current.user.whatsapp ?? "",
    outboundAt: dateInput(current.travel?.outboundAt),
    outboundPeriod: current.travel?.outboundPeriod ?? "",
    outboundOrigin: current.travel?.outboundOrigin ?? "",
    returnAt: dateInput(current.travel?.returnAt),
    returnPeriod: current.travel?.returnPeriod ?? "",
    returnOrigin: current.travel?.returnOrigin ?? "",
    transportMode: current.travel?.transportMode ?? "",
    needsRide: current.travel?.needsRide ?? false,
    interestedVan: current.travel?.interestedVan ?? false,
    shareUber: current.travel?.shareUber ?? false,
    offersRide: current.travel?.offersRide ?? false,
    rideOutbound: current.travel?.rideOutbound ?? false,
    rideReturn: current.travel?.rideReturn ?? false,
  };

  const sections = [
    { title: "Precisam de carona", people: groups.rideSeekers },

    { title: "Compartilhar Uber", people: groups.uberSharing },
    { title: "Interessadas em van", people: groups.vanInterested },
  ];

  return (
    <main className="members-page">
      <Link href={`/trips/${tripId}/members`}>← Participantes</Link>
      <p className="eyebrow">TRANSPORTE</p>
      <h1>{current.trip.name}</h1>
      <TravelForm isAdmin={current.role === "ADMIN"} profile={profile} tripId={tripId} />

      <section className="travel-groups">
        <RideOfferList members={groups.rideOffers.map(({ id, name, travel }) => ({ id, name, travel: travel ? { rideOutbound: travel.rideOutbound, rideReturn: travel.rideReturn } : null }))} />
        {sections.map((section) => (
          <Card key={section.title} padding="md">
            <h2>{section.title}</h2>
            {section.people.length ? (
              <ul>
                {section.people.map((person) => (
                  <li key={person.id}>{person.name}</li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma participante disponível neste grupo.</p>
            )}
          </Card>
        ))}
      </section>

      {current.role === "ADMIN" && (
        <Card padding="md">
          <h2>Resumo para administradoras</h2>
          <ul>
            {members.map((member) => (
              <li key={member.id}>
                {member.user.name}: {member.travel?.transportMode ?? "Transporte não informado"}
                {" — "}
                {member.travel?.needsRide ? "Precisa de carona" : "Sem pedido de carona"}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}

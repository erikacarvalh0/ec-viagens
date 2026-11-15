import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Dashboard } from "@/features/trips/Dashboard";
import type { Trip } from "@/features/trips/trip";

function toDateInput(value: Date | null): string {
  return value?.toISOString().slice(0, 10) ?? "";
}

export default async function DashboardPage() {
  const userId = await requireUserId();
  const memberships = await prisma.tripMember.findMany({
    where: { userId },
    include: { trip: true },
    orderBy: { trip: { createdAt: "desc" } },
  });

  const trips: Trip[] = memberships.map(({ trip }) => ({
    id: trip.id,
    name: trip.name,
    startsAt: toDateInput(trip.startsAt),
    endsAt: toDateInput(trip.endsAt),
    locationName: trip.locationName ?? "",
    mapUrl: trip.mapUrl ?? "",
    createdAt: trip.createdAt.toISOString(),
  }));

  return (
    <>
      <nav aria-label="Preferências de conta">
        <Link href="/settings/notifications">Preferências de notificações</Link>
      </nav>
      <Dashboard initialTrips={trips} />
    </>
  );
}

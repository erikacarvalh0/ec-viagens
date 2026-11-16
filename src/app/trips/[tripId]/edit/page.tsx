import Link from "next/link";

import { requireTripAdmin } from "@/features/members/permissions";
import { EditTripForm } from "@/features/trips/EditTripForm";
import { DeleteTripForm } from "@/features/trips/DeleteTripForm";

type PageProps = { params: Promise<{ tripId: string }> };

function toDateInput(date: Date | null) {
  return date?.toISOString().slice(0, 10) ?? "";
}

export default async function EditTripPage({ params }: PageProps) {
  const { tripId } = await params;
  const membership = await requireTripAdmin(tripId);
  const trip = membership.trip;
  return (
    <main className="members-page">
      <Link href={`/trips/${tripId}/overview`}>← Voltar à viagem</Link>
      <p className="eyebrow">ADMINISTRAÇÃO</p>
      <h1>Editar {trip.name}</h1>
      <EditTripForm
        tripId={tripId}
        initial={{
          name: trip.name,
          startsAt: toDateInput(trip.startsAt),
          endsAt: toDateInput(trip.endsAt),
          locationName: trip.locationName ?? "",
          mapUrl: trip.mapUrl ?? "",
        }}
      />
      <DeleteTripForm tripId={tripId} />
    </main>
  );
}

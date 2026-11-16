import Link from "next/link";

import { Card } from "@/design-system";
import { requireTripMember } from "@/features/members/permissions";
import { PhotoUploadForm } from "@/features/photos/PhotoUploadForm";
import { prisma } from "@/lib/prisma";

export default async function TripPhotosPage({
  params,
}: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const membership = await requireTripMember(tripId);
  const photos = await prisma.photo.findMany({
    where: { tripId },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { id: "desc" },
    take: 100,
  });

  return (
    <main className="members-page">
      <Link href="/dashboard">← Voltar às viagens</Link>
      <p className="eyebrow">GALERIA</p>
      <h1>Fotos de {membership.trip.name}</h1>
      <p>As fotos são privadas e acessíveis somente às participantes desta viagem.</p>
      <PhotoUploadForm tripId={tripId} />
      <section className="payment-plans">
        {photos.map((photo) => (
          <Card key={photo.id} padding="md">
            {/* The image URL is authenticated and private, not an external CDN. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/trips/${tripId}/photos/${photo.id}`}
              alt={photo.caption || "Foto da viagem"}
              loading="lazy"
              style={{ maxWidth: "100%", height: "auto" }}
            />
            {photo.caption && <p>{photo.caption}</p>}
            <p>Enviada por {photo.uploadedBy.name}</p>
          </Card>
        ))}
        {!photos.length && <p>Nenhuma foto adicionada ainda.</p>}
      </section>
    </main>
  );
}

import Link from "next/link";

import { Card } from "@/design-system";
import { requireTripMember } from "@/features/members/permissions";
import { PhotoUploadForm } from "@/features/photos/PhotoUploadForm";
import { DeletePhotoButton } from "@/features/photos/DeletePhotoButton";
import { PHOTO_PAGE_SIZE, getNextPhotoCursor, photoPageSchema } from "@/features/photos/pagination";
import { prisma } from "@/lib/prisma";

export default async function TripPhotosPage({
  params,
  searchParams,
}: { params: Promise<{ tripId: string }>; searchParams: Promise<{ cursor?: string }> }) {
  const { tripId } = await params;
  const membership = await requireTripMember(tripId);
  const parsed = photoPageSchema.safeParse(await searchParams);
  const cursor = parsed.success ? parsed.data.cursor : undefined;
  const photos = await prisma.photo.findMany({
    where: { tripId, ...(cursor ? { id: { lt: cursor } } : {}) },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { id: "desc" },
    take: PHOTO_PAGE_SIZE + 1,
  });

  const nextCursor = getNextPhotoCursor(photos);
  const visiblePhotos = photos.slice(0, PHOTO_PAGE_SIZE);

  return (
    <main className="members-page">
      <Link href="/dashboard">← Voltar às viagens</Link>
      <p className="eyebrow">GALERIA</p>
      <h1>Fotos de {membership.trip.name}</h1>
      <p>As fotos são privadas e acessíveis somente às participantes desta viagem.</p>
      <PhotoUploadForm tripId={tripId} />
      <section className="payment-plans">
        {visiblePhotos.map((photo) => (
          <Card key={photo.id} padding="md">
            {/* The image URL is authenticated and private, not an external CDN. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/trips/${tripId}/photos/${photo.id}?size=thumb`}
              alt={photo.caption || "Foto da viagem"}
              loading="lazy"
              width={360}
              height={360}
              style={{ maxWidth: "100%", height: "auto" }}
            />
            <p><a href={`/api/trips/${tripId}/photos/${photo.id}`} target="_blank" rel="noopener noreferrer">Ver foto maior</a></p>
            {photo.caption && <p>{photo.caption}</p>}
            <p>Enviada por {photo.uploadedBy.name}</p>
            {(membership.role === "ADMIN" || photo.uploadedById === membership.userId) && (
              <DeletePhotoButton tripId={tripId} photoId={photo.id} />
            )}
          </Card>
        ))}
        {!photos.length && <p>Nenhuma foto adicionada ainda.</p>}
        {nextCursor && (
          <Link href={`/trips/${tripId}/photos?cursor=${encodeURIComponent(nextCursor)}`}>
            Ver fotos anteriores →
          </Link>
        )}
        {cursor && <Link href={`/trips/${tripId}/photos`}>Voltar às fotos recentes</Link>}
      </section>
    </main>
  );
}

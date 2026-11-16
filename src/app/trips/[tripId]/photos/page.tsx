import Link from "next/link";

import { Card } from "@/design-system";
import { requireTripMember } from "@/features/members/permissions";
import { PhotoUploadForm } from "@/features/photos/PhotoUploadForm";
import { DeletePhotoButton } from "@/features/photos/DeletePhotoButton";
import { EditCaptionForm } from "@/features/photos/EditCaptionForm";
import { PHOTO_PAGE_SIZE, getNextPhotoCursor, photoPageSchema } from "@/features/photos/pagination";
import { buildPhotoFilter, photoGalleryHref, photoGalleryQuerySchema } from "@/features/photos/filters";
import { prisma } from "@/lib/prisma";

export default async function TripPhotosPage({
  params,
  searchParams,
}: { params: Promise<{ tripId: string }>; searchParams: Promise<{ cursor?: string; uploaderId?: string; search?: string }> }) {
  const { tripId } = await params;
  const membership = await requireTripMember(tripId);
  const query = await searchParams;
  const parsed = photoPageSchema.safeParse(query);
  const cursor = parsed.success ? parsed.data.cursor : undefined;
  const filtersResult = photoGalleryQuerySchema.safeParse(query);
  const filters = filtersResult.success ? filtersResult.data : {};
  const uploaders = await prisma.user.findMany({
    where: { memberships: { some: { tripId } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const allowedUploader = filters.uploaderId && uploaders.some((user) => user.id === filters.uploaderId)
    ? filters.uploaderId : undefined;
  const safeFilters = { ...filters, uploaderId: allowedUploader };
  const photos = await prisma.photo.findMany({
    where: { ...buildPhotoFilter(tripId, safeFilters), ...(cursor ? { id: { lt: cursor } } : {}) },
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
      <form method="get" action={`/trips/${tripId}/photos`}>
        <label htmlFor="photo-search">Buscar na legenda</label>
        <input id="photo-search" name="search" maxLength={100} defaultValue={safeFilters.search || ""} />
        <label htmlFor="photo-uploader">Enviada por</label>
        <select id="photo-uploader" name="uploaderId" defaultValue={safeFilters.uploaderId || ""}>
          <option value="">Todas as participantes</option>
          {uploaders.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
        <button type="submit">Filtrar fotos</button>
        <Link href={`/trips/${tripId}/photos`}>Limpar filtros</Link>
      </form>
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
            <p><a href={`/api/trips/${tripId}/photos/${photo.id}?download=1`}>Baixar foto</a></p>
            {photo.caption && <p>{photo.caption}</p>}
            <p>Enviada por {photo.uploadedBy.name}</p>
            {(membership.role === "ADMIN" || photo.uploadedById === membership.userId) && (
              <>
                <EditCaptionForm
                  tripId={tripId}
                  photoId={photo.id}
                  initialCaption={photo.caption || ""}
                />
                <DeletePhotoButton tripId={tripId} photoId={photo.id} />
              </>
            )}
          </Card>
        ))}
        {!photos.length && <p>Nenhuma foto adicionada ainda.</p>}
        {nextCursor && (
          <Link href={photoGalleryHref(tripId, safeFilters, nextCursor)}>
            Ver fotos anteriores →
          </Link>
        )}
        {cursor && <Link href={photoGalleryHref(tripId, safeFilters)}>Voltar às fotos recentes</Link>}
      </section>
    </main>
  );
}

import { z } from "zod";

export const photoGalleryQuerySchema = z.object({
  uploaderId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/).optional(),
  search: z.string().max(100).optional(),
  captioned: z.enum(["yes"]).optional(),
});

export type PhotoGalleryFilter = z.infer<typeof photoGalleryQuerySchema>;

export function buildPhotoFilter(tripId: string, filters: PhotoGalleryFilter) {
  const search = filters.search?.trim();
  return {
    tripId,
    ...(filters.uploaderId ? { uploadedById: filters.uploaderId } : {}),
    ...(search ? { caption: { contains: search, mode: "insensitive" as const } } : filters.captioned === "yes" ? { caption: { not: null } } : {}),
  };
}

export function photoGalleryHref(
  tripId: string,
  filters: PhotoGalleryFilter,
  cursor?: string,
) {
  const params = new URLSearchParams();
  if (filters.uploaderId) params.set("uploaderId", filters.uploaderId);
  if (filters.captioned) params.set("captioned", filters.captioned);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  return `/trips/${encodeURIComponent(tripId)}/photos${query ? `?${query}` : ""}`;
}

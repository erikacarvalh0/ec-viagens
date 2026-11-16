import { z } from "zod";

export const PHOTO_PAGE_SIZE = 24;

export const photoPageSchema = z.object({
  cursor: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/).optional(),
});

export function getNextPhotoCursor<T extends { id: string }>(
  photos: readonly T[],
  pageSize = PHOTO_PAGE_SIZE,
) {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error("Invalid photo page size.");
  }
  return photos.length > pageSize ? photos[pageSize - 1].id : null;
}

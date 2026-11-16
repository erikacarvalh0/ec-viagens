import { z } from "zod";

export const PHOTO_PAGE_SIZE = 24;

export const photoPageSchema = z.object({
  cursor: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/).optional(),
});

export function getNextPhotoCursor<T extends { id: string }>(
  photos: T[],
  pageSize = PHOTO_PAGE_SIZE,
) {
  return photos.length > pageSize ? photos[pageSize - 1].id : null;
}

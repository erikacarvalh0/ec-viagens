import { describe, expect, it } from "vitest";

import { buildPhotoFilter, photoGalleryQuerySchema } from "./filters";

describe("trip photo gallery filters", () => {
  it("filters by a trip uploader and optional caption text", () => {
    expect(buildPhotoFilter("trip-1", { uploaderId: "user-1", search: "  Praia  " })).toEqual({
      tripId: "trip-1",
      uploadedById: "user-1",
      caption: { contains: "Praia", mode: "insensitive" },
    });
  });

  it("does not accept arbitrary or excessively long search text", () => {
    expect(photoGalleryQuerySchema.safeParse({ search: "a".repeat(101) }).success).toBe(false);
  });

  it("rejects invalid uploader identifiers", () => {
    expect(photoGalleryQuerySchema.safeParse({ uploaderId: "../other" }).success).toBe(false);
  });

  it("builds an unfiltered trip-scoped query", () => {
    expect(buildPhotoFilter("trip-1", {})).toEqual({ tripId: "trip-1" });
  });

  it("ignores blank caption searches", () => {
    expect(buildPhotoFilter("trip-1", { search: "  " })).toEqual({ tripId: "trip-1" });
  });
});

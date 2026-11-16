import { describe, expect, it } from "vitest";
import { buildPhotoFilter, photoGalleryHref, photoGalleryQuerySchema } from "./filters";
describe("gallery caption presence filter", () => {
  it("filters photos that have a caption", () => {
    expect(buildPhotoFilter("trip-1", { captioned: "yes" })).toEqual({ tripId: "trip-1", caption: { not: null } });
  });
  it("preserves caption filter when paging", () => {
    expect(photoGalleryHref("trip-1", { captioned: "yes" }, "abc")).toContain("captioned=yes");
  });
  it("rejects unexpected filter values", () => {
    expect(photoGalleryQuerySchema.safeParse({ captioned: "nope" }).success).toBe(false);
  });
});

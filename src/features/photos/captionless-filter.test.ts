import { describe, expect, it } from "vitest";
import { buildPhotoFilter, photoGalleryQuerySchema, photoGalleryHref } from "./filters";
describe("photos without captions", () => {
  it("selects only photos without captions", () => {
    expect(buildPhotoFilter("trip-1", { captioned: "no" })).toEqual({ tripId: "trip-1", caption: null });
  });
  it("accepts the query parameter and retains it in pagination links", () => {
    expect(photoGalleryQuerySchema.parse({ captioned: "no" }).captioned).toBe("no");
    expect(photoGalleryHref("trip-1", { captioned: "no" }, "cursor-1")).toContain("captioned=no");
  });
  it("does not remove trip scope or uploader filtering", () => {
    expect(buildPhotoFilter("trip-1", { captioned: "no", uploaderId: "user-1" })).toEqual({ tripId: "trip-1", uploadedById: "user-1", caption: null });
  });
});

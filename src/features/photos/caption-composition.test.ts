import { describe, expect, it } from "vitest";
import { buildPhotoFilter } from "./filters";
describe("gallery caption filter composition", () => {
  it("combines caption presence with text search", () => {
    expect(buildPhotoFilter("trip-1", { captioned: "yes", search: "Praia" })).toEqual({
      tripId: "trip-1",
      caption: { contains: "Praia", mode: "insensitive", not: null },
    });
  });
  it("preserves uploader scope", () => {
    expect(buildPhotoFilter("trip-1", { captioned: "yes", uploaderId: "user-1" })).toEqual({
      tripId: "trip-1", uploadedById: "user-1", caption: { not: null },
    });
  });
});

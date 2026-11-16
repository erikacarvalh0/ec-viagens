import { describe, expect, it } from "vitest";
import { buildPhotoFilter } from "./filters";
describe("captionless photo search", () => {
 it("does not match caption text when only captionless photos are requested", () => {
  expect(buildPhotoFilter("trip-1", { captioned: "no", search: "beach" })).toEqual({tripId:"trip-1",caption:null});
 });
 it("preserves uploader scope with contradictory filters", () => {
  expect(buildPhotoFilter("trip-1", { captioned: "no", search: "beach", uploaderId:"u1" })).toEqual({tripId:"trip-1",uploadedById:"u1",caption:null});
 });
});

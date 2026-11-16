import { describe, expect, it } from "vitest";
import { getNextPhotoCursor } from "./pagination";

describe("photo pagination boundary safety", () => {
 it("rejects zero, negative and fractional page sizes", () => {
  for (const size of [0,-1,1.5,Number.NaN,Number.POSITIVE_INFINITY]) {
   expect(() => getNextPhotoCursor([{id:"photo1"},{id:"photo2"}],size)).toThrow("Invalid photo page size.");
  }
 });
 it("rejects pages larger than the supported maximum", () => {
  expect(() => getNextPhotoCursor([{id:"photo1"}],101)).toThrow("Invalid photo page size.");
 });
 it("does not mutate the page and uses the final visible id", () => {
  const photos = Object.freeze([{id:"photo1"},{id:"photo2"},{id:"photo3"}]);
  expect(getNextPhotoCursor(photos,2)).toBe("photo2");
  expect(photos).toHaveLength(3);
 });
});

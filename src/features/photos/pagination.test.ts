import { describe, expect, it } from "vitest";

import { photoPageSchema, getNextPhotoCursor } from "./pagination";

describe("photo gallery pagination", () => {
  it("rejects invalid cursors", () => {
    expect(photoPageSchema.safeParse({ cursor: "bad/cursor" }).success).toBe(false);
  });

  it("uses the last visible photo as next cursor", () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: `photo${i}` }));
    expect(getNextPhotoCursor(items, 24)).toBe("photo23");
  });

  it("has no cursor for the final page", () => {
    expect(getNextPhotoCursor([{ id: "photo1" }], 24)).toBeNull();
  });
});

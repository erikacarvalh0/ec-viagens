import { describe, expect, it } from "vitest";

import { tripDraftSchema } from "./trip";

const draft = {
  name: "Encontrão 2027",
  startsAt: "2027-01-10",
  endsAt: "2027-01-15",
  locationName: "Ibiúna",
  mapUrl: "",
};

describe("trip validation", () => {
  it("accepts a valid trip", () => {
    expect(tripDraftSchema.safeParse(draft).success).toBe(true);
  });

  it("requires a meaningful trip name", () => {
    expect(tripDraftSchema.safeParse({ ...draft, name: "a" }).success).toBe(false);
  });

  it("rejects a return date before departure", () => {
    expect(
      tripDraftSchema.safeParse({ ...draft, endsAt: "2027-01-09" }).success,
    ).toBe(false);
  });

  it("rejects insecure map links", () => {
    expect(
      tripDraftSchema.safeParse({
        ...draft,
        mapUrl: "http://example.com/map",
      }).success,
    ).toBe(false);
  });
});

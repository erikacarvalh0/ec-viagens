import { describe, expect, it } from "vitest";
import { tripDraftSchema } from "./trip";
const draft = { name: "Viagem", startsAt: "2027-02-30", endsAt: "", locationName: "", mapUrl: "" };
describe("trip date validation", () => {
  it("rejects impossible calendar dates", () => {
    expect(tripDraftSchema.safeParse(draft).success).toBe(false);
  });
  it("accepts valid leap days", () => {
    expect(tripDraftSchema.safeParse({ ...draft, startsAt: "2028-02-29" }).success).toBe(true);
  });
  it("rejects malformed dates", () => {
    expect(tripDraftSchema.safeParse({ ...draft, startsAt: "tomorrow" }).success).toBe(false);
  });

  it.each(["0001-01-01", "0004-02-29", "0099-12-31"])("accepts the calendar date %s without remapping its year", (date) => {
    for (const field of ["startsAt", "endsAt"]) {
      expect(tripDraftSchema.safeParse({ ...draft, startsAt: "", [field]: date }).success).toBe(true);
    }
  });

  it.each(["0000-01-01", "0001-02-29", "0099-04-31"])("rejects the invalid calendar date %s", (date) => {
    for (const field of ["startsAt", "endsAt"]) {
      expect(tripDraftSchema.safeParse({ ...draft, startsAt: "", [field]: date }).success).toBe(false);
    }
  });
});

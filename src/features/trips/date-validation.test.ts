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
});

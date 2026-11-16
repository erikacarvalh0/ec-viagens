import { describe, expect, it } from "vitest";
import { searchTrips } from "./search";
import type { Trip } from "./trip";
const trip = { id: "1", name: "Férias", locationName: "", startsAt: "", endsAt: "", mapUrl: "", createdAt: "2026-01-01" } as Trip;
describe("trip search with missing locations", () => {
  it("searches by name when a trip has no location", () => {
    expect(searchTrips([{ ...trip, locationName: undefined } as unknown as Trip], "ferias")).toHaveLength(1);
  });
  it("does not match missing locations", () => {
    expect(searchTrips([{ ...trip, locationName: null } as unknown as Trip], "praia")).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { searchTrips } from "./search";
import type { Trip } from "./trip";
const trip = (name: string, locationName: string): Trip => ({
  id: name, name, locationName, startsAt: "", endsAt: "", mapUrl: "", createdAt: "",
});
describe("trip search", () => {
  const trips = [trip("Praia de Verão", "Ubatuba"), trip("Montanhas", "Campos do Jordão")];
  it("matches trip names ignoring accents and case", () => {
    expect(searchTrips(trips, "VERAO").map(t => t.id)).toEqual(["Praia de Verão"]);
  });
  it("matches destinations", () => {
    expect(searchTrips(trips, "campos").map(t => t.id)).toEqual(["Montanhas"]);
  });
  it("returns all trips for blank queries without changing the original list", () => {
    expect(searchTrips(trips, "  ")).toEqual(trips);
    expect(trips).toHaveLength(2);
  });
});

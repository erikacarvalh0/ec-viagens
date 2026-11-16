import { describe, expect, it } from "vitest";
import { sortTrips } from "./sort";
import type { Trip } from "./trip";
const trip = (id: string, startsAt: string): Trip => ({ id, name: id, startsAt, endsAt: "", locationName: "", mapUrl: "", createdAt: "" });
describe("trip sorting", () => {
  const trips = [trip("late", "2027-12-01"), trip("undated", ""), trip("early", "2027-01-01")];
  it("sorts upcoming trips by earliest start date", () => {
    expect(sortTrips(trips, "date-asc").map(x => x.id)).toEqual(["early", "late", "undated"]);
  });
  it("sorts by latest start date with undated trips last", () => {
    expect(sortTrips(trips, "date-desc").map(x => x.id)).toEqual(["late", "early", "undated"]);
  });
  it("does not mutate the original trips", () => {
    sortTrips(trips, "date-asc");
    expect(trips[0].id).toBe("late");
  });
});

import { describe, expect, it } from "vitest";
import { filterRideMembers } from "./ride-filters";
const people = [
  { id: "a", name: "Ana", travel: { rideOutbound: true, rideReturn: false } },
  { id: "b", name: "Bia", travel: { rideOutbound: false, rideReturn: true } },
  { id: "c", name: "Cris", travel: null },
];
describe("ride direction filtering", () => {
  it("returns only outbound drivers", () => {
    expect(filterRideMembers(people, "outbound").map(x => x.id)).toEqual(["a"]);
  });
  it("returns only return drivers", () => {
    expect(filterRideMembers(people, "return").map(x => x.id)).toEqual(["b"]);
  });
  it("shows all members by default", () => {
    expect(filterRideMembers(people, "all")).toEqual(people);
  });
});

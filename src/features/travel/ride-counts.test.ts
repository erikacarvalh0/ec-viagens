import { describe, expect, it } from "vitest";
import { countRideDirections } from "./ride-counts";
describe("ride offer counts", () => {
  it("counts outbound and return offers independently", () => {
    expect(countRideDirections([
      { travel: { rideOutbound: true, rideReturn: true } },
      { travel: { rideOutbound: true, rideReturn: false } },
      { travel: null },
    ])).toEqual({ outbound: 2, return: 1 });
  });
  it("returns zero for an empty group", () => {
    expect(countRideDirections([])).toEqual({ outbound: 0, return: 0 });
  });
});

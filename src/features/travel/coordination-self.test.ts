import { describe, expect, it } from "vitest";

import { getCoordinationGroups } from "./coordination";

const travel = (fields: Partial<{
  needsRide: boolean;
  offersRide: boolean;
  rideOutbound: boolean;
  rideReturn: boolean;
  shareUber: boolean;
  interestedVan: boolean;
}>) => ({
  needsRide: false,
  offersRide: false,
  rideOutbound: false,
  rideReturn: false,
  shareUber: false,
  interestedVan: false,
  ...fields,
});

describe("ride coordination self-filtering", () => {
  it("does not recommend a participant's own ride as an offer", () => {
    const members = [
      { id: "me", name: "Me", travel: travel({ needsRide: true, offersRide: true, rideOutbound: true }) },
      { id: "other", name: "Other", travel: travel({ offersRide: true, rideOutbound: true }) },
    ];
    const groups = getCoordinationGroups(members, "me");
    expect(groups.rideOffers.map((member) => member.id)).toEqual(["other"]);
    expect(groups.outboundRideOffers.map((member) => member.id)).toEqual(["other"]);
    expect(groups.rideSeekers).toEqual([]);
  });

  it("does not leak carpool matches for a participant with no travel preferences", () => {
    const groups = getCoordinationGroups([
      { id: "me", name: "Me", travel: null },
      { id: "other", name: "Other", travel: travel({ offersRide: true, needsRide: true }) },
    ], "me");
    expect(groups.rideOffers).toEqual([]);
    expect(groups.rideSeekers).toEqual([]);
  });
  it("hides van interest from members who have not opted in", () => {
    const groups = getCoordinationGroups([
      { id: "me", name: "Me", travel: travel({ interestedVan: false }) },
      { id: "other", name: "Other", travel: travel({ interestedVan: true }) },
    ], "me");
    expect(groups.vanInterested).toEqual([]);
  });

  it("shows van coordination only to opted-in participants", () => {
    const groups = getCoordinationGroups([
      { id: "me", name: "Me", travel: travel({ interestedVan: true }) },
      { id: "other", name: "Other", travel: travel({ interestedVan: true }) },
      { id: "third", name: "Third", travel: travel({ interestedVan: false }) },
    ], "me");
    expect(groups.vanInterested.map((member) => member.id)).toEqual(["me", "other"]);
  });
});

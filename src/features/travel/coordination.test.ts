import { describe, expect, it } from "vitest";

import { getCoordinationGroups } from "./coordination";

const members = [
  {
    id: "ana",
    name: "Ana",
    travel: {
      needsRide: true,
      offersRide: false,
      rideOutbound: false,
      rideReturn: false,
      shareUber: true,
      interestedVan: false,
    },
  },
  {
    id: "bia",
    name: "Bia",
    travel: {
      needsRide: false,
      offersRide: true,
      rideOutbound: true,
      rideReturn: false,
      shareUber: false,
      interestedVan: true,
    },
  },
  {
    id: "clara",
    name: "Clara",
    travel: null,
  },
];

describe("ride coordination", () => {
  it("shows ride seekers to members offering rides", () => {
    const groups = getCoordinationGroups(members, "bia");

    expect(groups.rideSeekers.map((member) => member.id)).toEqual(["ana"]);
  });

  it("shows van interested members in their own group", () => {
    const groups = getCoordinationGroups(members, "bia");

    expect(groups.vanInterested.map((member) => member.id)).toEqual(["bia"]);
  });

  it("does not expose ride seekers to unrelated participants", () => {
    const groups = getCoordinationGroups(members, "clara");

    expect(groups.rideSeekers).toEqual([]);
  });

  it("shows Uber sharing participants to each other", () => {
    const groups = getCoordinationGroups(members, "ana");

    expect(groups.uberSharing.map((member) => member.id)).toEqual(["ana"]);
  });
  it("does not expose Uber sharing members to participants who did not opt in", () => {
    const groups = getCoordinationGroups(members, "bia");
    expect(groups.uberSharing).toEqual([]);
  });

  it("does not expose ride offers when the current member is not seeking a ride", () => {
    const groups = getCoordinationGroups(members, "clara");
    expect(groups.rideOffers).toEqual([]);
    expect(groups.outboundRideOffers).toEqual([]);
    expect(groups.returnRideOffers).toEqual([]);
  });

  it("does not expose coordination groups to a missing member", () => {
    const groups = getCoordinationGroups(members, "not-in-trip");
    expect(groups.rideSeekers).toEqual([]);
    expect(groups.rideOffers).toEqual([]);
    expect(groups.outboundRideOffers).toEqual([]);
    expect(groups.returnRideOffers).toEqual([]);
    expect(groups.uberSharing).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { getCoordinationGroups } from "./coordination";
const travel = (fields: Partial<{needsRide:boolean;offersRide:boolean;rideOutbound:boolean;rideReturn:boolean;shareUber:boolean;interestedVan:boolean}>) => ({
 needsRide:false, offersRide:false, rideOutbound:false, rideReturn:false, shareUber:false, interestedVan:false, ...fields,
});
const members = [
 {id:"driver",name:"Driver",travel:travel({offersRide:true,rideOutbound:true})},
 {id:"rider",name:"Rider",travel:travel({needsRide:true})},
 {id:"return",name:"Return",travel:travel({offersRide:true,rideReturn:true})},
];
describe("direction-specific ride coordination", () => {
 it("shows outbound ride offers to ride seekers", () => {
  expect(getCoordinationGroups(members,"rider").outboundRideOffers.map(x=>x.id)).toEqual(["driver"]);
 });
 it("shows return ride offers separately", () => {
  expect(getCoordinationGroups(members,"rider").returnRideOffers.map(x=>x.id)).toEqual(["return"]);
 });
 it("does not expose offers to non-seekers", () => {
  expect(getCoordinationGroups(members,"driver").outboundRideOffers).toEqual([]);
 });
});

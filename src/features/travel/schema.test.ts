import { describe, expect, it } from "vitest";

import { travelDetailsSchema } from "./schema";

const valid = {
  city: "São Paulo",
  state: "SP",
  whatsapp: "11999999999",
  outboundAt: "2027-01-10",
  outboundPeriod: "MORNING",
  outboundOrigin: "São Paulo",
  returnAt: "2027-01-15",
  returnPeriod: "AFTERNOON",
  returnOrigin: "Ibiúna",
  transportMode: "Carro",
  needsRide: false,
  interestedVan: false,
  shareUber: false,
  offersRide: false,
  rideOutbound: false,
  rideReturn: false,
};

describe("travel details validation", () => {
  it("accepts a complete travel profile", () => {
    expect(travelDetailsSchema.safeParse(valid).success).toBe(true);
  });

  it("requires travel details for regular members", () => {
    expect(
      travelDetailsSchema.safeParse({ ...valid, city: "" }).success,
    ).toBe(false);
  });

  it("rejects an invalid return date", () => {
    expect(
      travelDetailsSchema.safeParse({
        ...valid,
        returnAt: "2027-01-09",
      }).success,
    ).toBe(false);
  });

  it("keeps ride and van interests independent", () => {
    const result = travelDetailsSchema.parse({
      ...valid,
      needsRide: true,
      interestedVan: true,
      shareUber: true,
      offersRide: true,
      rideOutbound: true,
      rideReturn: false,
    });

    expect(result.needsRide).toBe(true);
    expect(result.interestedVan).toBe(true);
    expect(result.shareUber).toBe(true);
    expect(result.offersRide).toBe(true);
    expect(result.rideOutbound).toBe(true);
  });

  it("requires a direction when offering rides", () => {
    expect(
      travelDetailsSchema.safeParse({
        ...valid,
        offersRide: true,
      }).success,
    ).toBe(false);
  });

  it("allows admins to leave travel details empty", () => {
    expect(
      travelDetailsSchema.safeParse({
        ...valid,
        city: "",
        state: "",
        whatsapp: "",
        outboundAt: "",
        returnAt: "",
      }, { role: "ADMIN" }).success,
    ).toBe(true);
  });
});

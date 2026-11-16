import { describe, expect, it } from "vitest";

import { adminTravelDetailsSchema, travelDetailsSchema } from "./schema";

const details = {
  city: "São Paulo",
  state: "SP",
  whatsapp: "11999999999",
  outboundAt: "2028-02-29",
  outboundPeriod: "MORNING" as const,
  outboundOrigin: "São Paulo",
  returnAt: "2028-03-01",
  returnPeriod: "EVENING" as const,
  returnOrigin: "Campinas",
  transportMode: "CAR",
  needsRide: false,
  interestedVan: false,
  shareUber: false,
  offersRide: false,
  rideOutbound: false,
  rideReturn: false,
};

describe("travel calendar dates", () => {
  it("accepts real leap days for members and admins", () => {
    expect(travelDetailsSchema.safeParse(details).success).toBe(true);
    expect(adminTravelDetailsSchema.safeParse(details).success).toBe(true);
  });

  it("rejects impossible dates in both forms", () => {
    for (const schema of [travelDetailsSchema, adminTravelDetailsSchema]) {
      expect(schema.safeParse({ ...details, outboundAt: "2027-02-29" }).success).toBe(false);
      expect(schema.safeParse({ ...details, returnAt: "2028-13-01" }).success).toBe(false);
    }
  });

  it("rejects malformed calendar strings", () => {
    expect(travelDetailsSchema.safeParse({ ...details, returnAt: "tomorrow" }).success).toBe(false);
  });
});

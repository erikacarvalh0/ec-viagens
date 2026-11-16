import { describe, expect, it } from "vitest";

import { adminTravelDetailsSchema, travelDetailsSchema } from "./schema";

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
  describe.each([
    ["member", travelDetailsSchema],
    ["admin", adminTravelDetailsSchema],
  ] as const)("%s WhatsApp validation", (_, schema) => {
    it.each(["invalid", "123456789", "12345678901234"])(
      "rejects malformed number %s",
      (whatsapp) => {
        const result = schema.safeParse({ ...valid, whatsapp });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toContainEqual(expect.objectContaining({
            path: ["whatsapp"],
            message: "Informe um WhatsApp com DDD.",
          }));
        }
      },
    );

    it.each(["1133334444", "11999999999", "+55 (11) 99999-9999"])(
      "accepts number %s",
      (whatsapp) => {
        expect(schema.safeParse({ ...valid, whatsapp }).success).toBe(true);
      },
    );
  });

  it.each(["", "   "])("keeps blank WhatsApp optional only for admins: %j", (whatsapp) => {
    expect(adminTravelDetailsSchema.safeParse({ ...valid, whatsapp }).success).toBe(true);
    expect(travelDetailsSchema.safeParse({ ...valid, whatsapp }).success).toBe(false);
  });

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
      adminTravelDetailsSchema.safeParse({
        ...valid,
        city: "",
        state: "",
        whatsapp: "",
        outboundAt: "",
        returnAt: "",
      }).success,
    ).toBe(true);
  });
});

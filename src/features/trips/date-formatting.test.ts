import { afterEach, describe, expect, it } from "vitest";

import { formatTripDates, type Trip } from "./trip";

const originalTimeZone = process.env.TZ;
const trip: Trip = {
  id: "trip-1",
  name: "Viagem",
  startsAt: "2011-12-30",
  endsAt: "2011-12-31",
  locationName: "",
  mapUrl: "",
  createdAt: "2011-01-01T00:00:00Z",
};

afterEach(() => {
  if (originalTimeZone === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTimeZone;
  }
});

describe("trip date formatting", () => {
  it.each(["UTC", "America/Sao_Paulo", "Pacific/Apia"])(
    "preserves calendar dates in %s, including locally skipped days",
    (timeZone) => {
      process.env.TZ = timeZone;

      expect(formatTripDates(trip)).toBe("30 de dez. de 2011 – 31 de dez. de 2011");
      expect(formatTripDates({ ...trip, endsAt: "" })).toBe("30 de dez. de 2011");
      expect(formatTripDates({ ...trip, startsAt: "", endsAt: "2011-12-30" })).toBe("30 de dez. de 2011");
    },
  );

  it("labels trips without dates", () => {
    expect(formatTripDates({ ...trip, startsAt: "", endsAt: "" })).toBe("Datas a definir");
  });
});

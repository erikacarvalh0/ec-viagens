import { describe, expect, it } from "vitest";

import { filterTripsByArchive, tripHistoryCopy } from "./history";
import type { Trip } from "./trip";

const trip = (id: string, archivedAt: string | null): Trip => ({
  id, name: id, startsAt: "", endsAt: "", locationName: "", mapUrl: "",
  createdAt: "2026-01-01T00:00:00.000Z", archivedAt,
});

describe("member trip history", () => {
  const trips = [trip("active", null), trip("old", "2026-02-01T00:00:00.000Z")];

  it("shows archived trips to members in the history view", () => {
    expect(filterTripsByArchive(trips, true).map(({ id }) => id)).toEqual(["old"]);
  });

  it("keeps active trips separate without mutating memberships", () => {
    expect(filterTripsByArchive(trips, false).map(({ id }) => id)).toEqual(["active"]);
    expect(trips).toHaveLength(2);
  });

  it("shows an appropriate empty-state without inviting creation in history", () => {
    expect(tripHistoryCopy(true).emptyTitle).toBe("Nenhuma viagem no histórico");
    expect(tripHistoryCopy(true).allowCreation).toBe(false);
    expect(tripHistoryCopy(false).allowCreation).toBe(true);
  });
});

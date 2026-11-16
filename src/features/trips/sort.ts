import type { Trip } from "./trip";

export type TripSort = "date-asc" | "date-desc";

export function sortTrips(trips: Trip[], order: TripSort): Trip[] {
  return [...trips].sort((a, b) => {
    if (!a.startsAt) return b.startsAt ? 1 : 0;
    if (!b.startsAt) return -1;
    const comparison = a.startsAt.localeCompare(b.startsAt);
    return order === "date-asc" ? comparison : -comparison;
  });
}

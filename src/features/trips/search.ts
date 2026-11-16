import type { Trip } from "./trip";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function searchTrips(trips: Trip[], query: string): Trip[] {
  const search = normalize(query.trim());
  if (!search) return trips;
  return trips.filter((trip) =>
    normalize(trip.name).includes(search) || normalize(trip.locationName ?? "").includes(search),
  );
}

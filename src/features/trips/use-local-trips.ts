"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

import {
  storedTripSchema,
  type Trip,
  type TripDraft,
} from "./trip";

const STORAGE_KEY = "ec-viagens:demo-trips:v1";

export function useLocalTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = z.array(storedTripSchema).safeParse(JSON.parse(stored));

        if (parsed.success) {
          setTrips(parsed.data);
        }
      }
    } catch {
      // Invalid or unavailable browser storage must not block navigation.
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    } catch {
      // The preview remains usable when browser storage is disabled.
    }
  }, [trips, hydrated]);

  function createTrip(draft: TripDraft): Trip {
    const trip: Trip = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    setTrips((previous) => [trip, ...previous]);

    return trip;
  }

  return {
    trips,
    hydrated,
    createTrip,
  };
}

"use client";

import { useState } from "react";
import { Card } from "@/design-system";
import { filterRideMembers, type RideDirection, type RideOffer } from "./ride-filters";

export function RideOfferList({ members }: { members: RideOffer[] }) {
  const [direction, setDirection] = useState<RideDirection>("all");
  const visible = filterRideMembers(members, direction);
  return (
    <Card padding="md">
      <h2>Oferecem carona</h2>
      <label htmlFor="ride-direction">Trecho</label>
      <select id="ride-direction" value={direction} onChange={(event) => setDirection(event.target.value as RideDirection)}>
        <option value="all">Todos os trechos</option>
        <option value="outbound">Ida</option>
        <option value="return">Volta</option>
      </select>
      {visible.length ? (
        <ul>{visible.map((person) => <li key={person.id}>{person.name}</li>)}</ul>
      ) : <p>Nenhuma participante oferece carona neste trecho.</p>}
    </Card>
  );
}

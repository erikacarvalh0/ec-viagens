"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/design-system";

import { saveTripChanges } from "./editing";
import { tripDraftSchema, type TripDraft } from "./trip";

export function EditTripForm({ tripId, initial }: { tripId: string; initial: TripDraft }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [values, setValues] = useState(initial);

  function update(key: keyof TripDraft, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      const parsed = tripDraftSchema.safeParse(values);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
        return;
      }
      setError("");
      startTransition(async () => {
        try {
          await saveTripChanges(tripId, parsed.data);
          setMessage("Viagem atualizada.");
          router.refresh();
        } catch {
          setError("Não foi possível atualizar a viagem.");
        }
      });
    }}>
      <label htmlFor="edit-trip-name">Nome da viagem *</label>
      <input id="edit-trip-name" value={values.name} maxLength={100} required
        onChange={(event) => update("name", event.target.value)} disabled={pending} />
      <label htmlFor="edit-trip-start">Data de ida</label>
      <input id="edit-trip-start" type="date" value={values.startsAt}
        onChange={(event) => update("startsAt", event.target.value)} disabled={pending} />
      <label htmlFor="edit-trip-end">Data de volta</label>
      <input id="edit-trip-end" type="date" value={values.endsAt}
        onChange={(event) => update("endsAt", event.target.value)} disabled={pending} />
      <label htmlFor="edit-trip-location">Local</label>
      <input id="edit-trip-location" value={values.locationName} maxLength={120}
        onChange={(event) => update("locationName", event.target.value)} disabled={pending} />
      <label htmlFor="edit-trip-map">Link do mapa (HTTPS)</label>
      <input id="edit-trip-map" type="url" value={values.mapUrl}
        onChange={(event) => update("mapUrl", event.target.value)} disabled={pending} />
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar alterações"}</Button>
    </form>
  );
}

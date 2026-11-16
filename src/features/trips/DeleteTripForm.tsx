"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/design-system";

import { deleteEmptyTrip } from "./deletion";

export function DeleteTripForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <section aria-labelledby="delete-trip-heading">
      <h2 id="delete-trip-heading">Excluir viagem</h2>
      <p>Esta ação é permanente. Só é possível excluir viagens sem fotos e sem cobranças financeiras.</p>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (confirmation !== "EXCLUIR") return;
        if (!window.confirm("Excluir esta viagem permanentemente?")) return;
        setError("");
        startTransition(async () => {
          try {
            await deleteEmptyTrip(tripId, confirmation);
            router.push("/dashboard");
            router.refresh();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Não foi possível excluir a viagem.");
          }
        });
      }}>
        <label htmlFor="delete-trip-confirmation">Digite EXCLUIR para confirmar</label>
        <input
          id="delete-trip-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          disabled={pending}
        />
        {error && <p role="alert">{error}</p>}
        <Button type="submit" disabled={pending || confirmation !== "EXCLUIR"}>
          {pending ? "Excluindo..." : "Excluir viagem permanentemente"}
        </Button>
      </form>
    </section>
  );
}

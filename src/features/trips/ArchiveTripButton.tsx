"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/design-system";

import { setTripArchived } from "./archiving";

export function ArchiveTripButton({ tripId, archived }: { tripId: string; archived: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          if (!archived && !window.confirm("Arquivar esta viagem? Os dados continuarão disponíveis.")) return;
          setError("");
          startTransition(async () => {
            try {
              await setTripArchived(tripId, !archived);
              router.refresh();
            } catch {
              setError("Não foi possível alterar o arquivamento.");
            }
          });
        }}
      >
        {pending ? "Salvando..." : archived ? "Restaurar viagem" : "Arquivar viagem"}
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

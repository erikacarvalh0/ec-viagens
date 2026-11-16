"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/design-system";

export function PhotoUploadForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      startTransition(async () => {
        try {
          const response = await fetch(`/api/trips/${tripId}/photos`, {
            method: "POST",
            body: form,
          });
          if (!response.ok) throw new Error("Falha no upload.");
          setMessage("Foto adicionada.");
          router.refresh();
        } catch {
          setMessage("Não foi possível enviar a foto.");
        }
      });
    }}>
      <label>
        Foto (JPEG ou PNG, até 5 MB)
        <input type="file" name="photo" accept="image/jpeg,image/png" required />
      </label>
      <label>
        Legenda (opcional)
        <input type="text" name="caption" maxLength={200} />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Adicionar foto"}
      </Button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}

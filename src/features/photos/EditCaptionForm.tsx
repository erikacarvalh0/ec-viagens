"use client";

import { useState, useTransition } from "react";

import { Button } from "@/design-system";

import { updatePhotoCaption } from "./captions";

export function EditCaptionForm({
  tripId,
  photoId,
  initialCaption,
}: {
  tripId: string;
  photoId: string;
  initialCaption: string;
}) {
  const [caption, setCaption] = useState(initialCaption);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div>
      {!editing ? (
        <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
          Editar legenda
        </Button>
      ) : (
        <form onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await updatePhotoCaption(tripId, photoId, caption);
            setMessage(result.error || "Legenda atualizada.");
            if (result.success) setEditing(false);
          });
        }}>
          <label>
            Legenda
            <input
              type="text"
              value={caption}
              maxLength={200}
              onChange={(event) => setCaption(event.target.value)}
            />
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar legenda"}
          </Button>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => {
            setCaption(initialCaption);
            setEditing(false);
            setMessage("");
          }}>
            Cancelar
          </Button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";

import { Button } from "@/design-system";

import { deleteTripPhoto } from "./deletion";

export function DeletePhotoButton({
  tripId,
  photoId,
}: {
  tripId: string;
  photoId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Excluir esta foto permanentemente?")) return;
          startTransition(async () => {
            const result = await deleteTripPhoto(tripId, photoId);
            setMessage(result.error || "Foto excluída.");
          });
        }}
      >
        {pending ? "Excluindo..." : "Excluir foto"}
      </Button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";

import { Button } from "@/design-system";

import { resolveNotificationReview } from "./operations";

export function ReviewButton({
  tripId,
  notificationId,
}: {
  tripId: string;
  notificationId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        disabled={pending}
        onClick={() => startTransition(async () => {
          const result = await resolveNotificationReview(tripId, notificationId);
          setMessage(result.error || "Revisão concluída sem reenviar a mensagem.");
        })}
      >
        {pending ? "Concluindo..." : "Marcar como revisado"}
      </Button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

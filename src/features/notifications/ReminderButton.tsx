"use client";

import { useState, useTransition } from "react";

import { Button } from "@/design-system";

import { schedulePaymentReminder } from "./reminders";

export function ReminderButton({
  tripId,
  chargeId,
}: {
  tripId: string;
  chargeId: string;
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
          startTransition(async () => {
            const result = await schedulePaymentReminder(tripId, chargeId);
            setMessage(result.error || "Lembrete agendado. O envio ainda não está habilitado.");
          });
        }}
      >
        {pending ? "Agendando..." : "Agendar lembrete"}
      </Button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

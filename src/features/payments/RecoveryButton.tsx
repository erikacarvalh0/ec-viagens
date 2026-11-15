"use client";

import { useState, useTransition } from "react";

import { Button } from "@/design-system";

import { recoverCharge } from "./recovery";

export function RecoveryButton({
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
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await recoverCharge(tripId, chargeId);
            setMessage(result.error || "Cobrança recuperada com sucesso.");
          });
        }}
        type="button"
        variant="ghost"
      >
        {pending ? "Consultando..." : "Verificar no Asaas"}
      </Button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

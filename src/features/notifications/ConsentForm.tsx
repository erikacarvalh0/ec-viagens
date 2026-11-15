"use client";

import { useState, useTransition } from "react";

import { Button } from "@/design-system";

import { updateReminderConsent } from "./consent";

export function ConsentForm({ initialConsent }: { initialConsent: boolean }) {
  const [consent, setConsent] = useState(initialConsent);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      startTransition(async () => {
        const result = await updateReminderConsent(consent);
        setMessage(result.error || "Preferência atualizada.");
      });
    }}>
      <label>
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        Autorizo receber lembretes de pagamento desta aplicação pelo WhatsApp.
      </label>
      <p>Você pode retirar a autorização a qualquer momento. Não enviamos mensagens nesta etapa.</p>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar preferência"}
      </Button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}

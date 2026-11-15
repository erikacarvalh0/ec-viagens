"use client";

import { useActionState } from "react";

import { Button } from "@/design-system";

import { redeemInvitation } from "./actions";

export function AcceptInvitation({ token }: { token: string }) {
  const action = redeemInvitation.bind(null, token);
  const [state, formAction, pending] = useActionState(action, { error: "" });

  return (
    <form action={formAction}>
      <Button disabled={pending} type="submit">
        {pending ? "Entrando..." : "Aceitar convite"}
      </Button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}

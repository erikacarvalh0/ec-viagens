"use client";

import { useActionState } from "react";
import { Button } from "@/design-system";
import { confirmVerification, sendVerification } from "./email-verification-actions";

export function EmailVerificationForm({ token }: { token?: string }) {
  const [state, action, pending] = useActionState(
    token ? confirmVerification : sendVerification,
    { message: "", success: false },
  );
  return (
    <form action={action} className="auth-form">
      {token && <input type="hidden" name="token" value={token} />}
      {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
      {!state.success && <Button type="submit" disabled={pending}>{pending ? "Aguarde..." : token ? "Confirmar e-mail" : "Enviar link de confirmação"}</Button>}
    </form>
  );
}

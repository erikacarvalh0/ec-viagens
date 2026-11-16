"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@/design-system";
import { confirmPasswordReset } from "./password-reset-actions";

export function PasswordResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(confirmPasswordReset, {
    error: "",
    success: false,
  });

  return (
    <Card className="auth-card" padding="lg">
      <p className="eyebrow">EC-VIAGENS</p>
      <h1>Redefinir senha</h1>
      {state.success ? (
        <p role="status">Senha atualizada. <Link href="/login">Entrar na sua conta</Link></p>
      ) : (
        <>
          <p>Escolha uma nova senha com pelo menos 12 caracteres.</p>
          <form action={action} className="auth-form">
            <input type="hidden" name="token" value={token} />
            <label htmlFor="reset-password">Nova senha</label>
            <Input id="reset-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
            <label htmlFor="reset-confirm-password">Confirme a senha</label>
            <Input id="reset-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
            {state.error && <p role="alert">{state.error}</p>}
            <Button type="submit" disabled={pending}>{pending ? "Aguarde..." : "Atualizar senha"}</Button>
          </form>
        </>
      )}
      <p><Link href="/login">Voltar para o login</Link></p>
    </Card>
  );
}

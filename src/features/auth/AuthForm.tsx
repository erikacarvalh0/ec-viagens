"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button, Card, Input } from "@/design-system";

import { login, register } from "./actions";
import { authCallbackPath, authPageHref } from "./redirects";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const safeCallbackUrl = authCallbackPath(callbackUrl);
  const isRegistration = mode === "register";
  const [state, action, pending] = useActionState(
    isRegistration ? register : login,
    { error: "" },
  );

  return (
    <Card className="auth-card" padding="lg">
      <p className="eyebrow">EC-VIAGENS</p>
      <h1>{isRegistration ? "Crie sua conta ♡" : "Bem-vinda de volta ♡"}</h1>
      <p>Organize as próximas viagens com suas amigas.</p>

      <form action={action} className="auth-form">
        {isRegistration && (
          <>
            <label htmlFor="auth-name">Nome</label>
            <Input autoComplete="name" id="auth-name" name="name" required />
          </>
        )}

        <label htmlFor="auth-email">E-mail</label>
        <Input
          autoComplete="email"
          id="auth-email"
          name="email"
          required
          type="email"
        />

        <label htmlFor="auth-password">Senha</label>
        <Input
          autoComplete={isRegistration ? "new-password" : "current-password"}
          id="auth-password"
          minLength={isRegistration ? 12 : 1}
          name="password"
          required
          type="password"
        />

        <input name="callbackUrl" type="hidden" value={safeCallbackUrl} />

        {state.error && <p role="alert">{state.error}</p>}

        <Button disabled={pending} type="submit">
          {pending ? "Aguarde..." : isRegistration ? "Cadastrar" : "Entrar"}
        </Button>
      </form>

      <p>
        {isRegistration ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
        <Link href={authPageHref(isRegistration ? "/login" : "/register", callbackUrl)}>
          {isRegistration ? "Entrar" : "Cadastrar"}
        </Link>
      </p>
    </Card>
  );
}

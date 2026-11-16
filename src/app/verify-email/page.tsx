import Link from "next/link";
import { EmailVerificationForm } from "@/features/auth/EmailVerificationForm";

export default async function VerifyEmailPage({ searchParams }: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="auth-page">
      <h1>Confirmar e-mail</h1>
      <p>Entre na conta cadastrada antes de confirmar seu e-mail.</p>
      <Link href="/login">Entrar</Link>
      <EmailVerificationForm token={typeof token === "string" ? token : undefined} />
      <Link href="/settings/profile">Voltar ao perfil ou solicitar outro link</Link>
    </main>
  );
}

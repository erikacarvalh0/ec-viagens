import { PasswordResetForm } from "@/features/auth/PasswordResetForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="auth-page">
      {typeof token === "string" && /^[a-f0-9]{64}$/.test(token) ? (
        <PasswordResetForm token={token} />
      ) : (
        <p>Link de recuperação inválido. Solicite um novo link.</p>
      )}
    </main>
  );
}

import { AuthForm } from "@/features/auth/AuthForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <AuthForm mode="login" />
    </main>
  );
}

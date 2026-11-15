import { AuthForm } from "@/features/auth/AuthForm";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <AuthForm mode="register" />
    </main>
  );
}

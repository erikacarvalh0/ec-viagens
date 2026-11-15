import { Suspense } from "react";

import { AuthForm } from "@/features/auth/AuthForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<p>Carregando formulário...</p>}>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}

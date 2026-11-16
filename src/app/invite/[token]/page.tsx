import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/design-system";
import { AcceptInvitation } from "@/features/members/AcceptInvitation";
import { getInvitation } from "@/features/members/invitations";
import { auth } from "@/lib/auth";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitationPage({ params }: PageProps) {
  const { token } = await params;
  const invitation = await getInvitation(token);

  if (
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.expiresAt <= new Date()
  ) {
    notFound();
  }

  const session = await auth();

  return (
    <main className="auth-page">
      <Card className="auth-card" padding="lg">
        <p className="eyebrow">CONVITE ESPECIAL</p>
        <h1>Você foi convidada ♡</h1>
        <p>Participe da viagem {invitation.trip.name}.</p>

        {session?.user?.id ? (
          <AcceptInvitation token={token} />
        ) : (
          <p>
            <Link href={`/login?callbackUrl=${encodeURIComponent(
              `/invite/${token}`,
            )}`}>
              Entre na sua conta
            </Link>{" "}
            para aceitar o convite. Ainda não tem uma conta?{" "}
            <Link href={`/register?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}>Cadastre-se</Link>.
          </p>
        )}
      </Card>
    </main>
  );
}

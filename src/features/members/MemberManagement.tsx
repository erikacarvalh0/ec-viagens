"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button, Card } from "@/design-system";

import {
  generateInvitation,
  updateMemberRole,
} from "./actions";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
};

type MemberManagementProps = {
  tripId: string;
  tripName: string;
  isAdmin: boolean;
  members: Member[];
};

function RoleControl({
  tripId,
  member,
}: {
  tripId: string;
  member: Member;
}) {
  const nextRole = member.role === "ADMIN" ? "MEMBER" : "ADMIN";
  const action = updateMemberRole.bind(null, tripId, member.id, nextRole);
  const [state, formAction, pending] = useActionState(action, { error: "" });

  return (
    <form action={formAction} className="member-role-form">
      <Button disabled={pending} size="sm" type="submit" variant="secondary">
        {pending
          ? "Salvando..."
          : member.role === "ADMIN"
            ? "Remover admin"
            : "Tornar admin"}
      </Button>
      {state.error && <small role="alert">{state.error}</small>}
    </form>
  );
}

function InvitationControl({ tripId }: { tripId: string }) {
  const action = generateInvitation.bind(null, tripId);
  const [state, formAction, pending] = useActionState(action, { error: "" });

  return (
    <Card className="member-invitation" padding="md">
      <h2>Convidar participante</h2>
      <p>
        Gere um link individual e compartilhe pelo WhatsApp. Cada link é
        válido por sete dias e pode ser utilizado uma única vez.
      </p>

      <form action={formAction}>
        <Button disabled={pending} type="submit">
          {pending ? "Gerando..." : "Gerar link de convite"}
        </Button>
      </form>

      {state.invitationUrl && (
        <div className="member-invitation__link">
          <a href={state.invitationUrl}>{state.invitationUrl}</a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Você foi convidada para uma viagem! ${state.invitationUrl}`,
            )}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            Compartilhar no WhatsApp
          </a>
        </div>
      )}

      {state.error && <p role="alert">{state.error}</p>}
    </Card>
  );
}

export function MemberManagement({
  tripId,
  tripName,
  isAdmin,
  members,
}: MemberManagementProps) {
  return (
    <main className="members-page">
      <a href="/dashboard">← Voltar às viagens</a>
      <p className="eyebrow">PARTICIPANTES</p>
      <h1>{tripName}</h1>
      <p>
        {members.length} {members.length === 1 ? "participante" : "participantes"}
      </p>

      <Link href={`/trips/${tripId}/travel`}>Informações de viagem e caronas</Link>

      {isAdmin && <InvitationControl tripId={tripId} />}

      <Card padding="lg">
        <h2>Grupo da viagem</h2>
        <ul className="member-list">
          {members.map((member) => (
            <li key={member.id}>
              <div>
                <strong>{member.name}</strong>
                <small>{member.email}</small>
                <span>{member.role === "ADMIN" ? "Administradora" : "Membra"}</span>
              </div>
              {isAdmin && <RoleControl member={member} tripId={tripId} />}
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}

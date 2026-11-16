"use client";

import { useState, useTransition } from "react";

import { Button, Card } from "@/design-system";

import { revokeInvitation } from "./invitation-management";

type Invitation = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
};

export function InvitationList({ tripId, invitations }: { tripId: string; invitations: Invitation[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const now = Date.now();
  return (
    <Card padding="lg">
      <h2>Convites gerados</h2>
      <p>Os links são individuais e não podem ser recuperados após a geração.</p>
      {invitations.length === 0 ? <p>Nenhum convite gerado ainda.</p> : (
        <ul>
          {invitations.map((invitation) => {
            const expired = invitation.status === "PENDING" && new Date(invitation.expiresAt).getTime() <= now;
            const status = expired ? "Expirado" : ({
              PENDING: "Pendente", ACCEPTED: "Aceito", EXPIRED: "Expirado", REVOKED: "Revogado",
            } as const)[invitation.status];
            return (
              <li key={invitation.id}>
                <span>{status} · Criado em {new Date(invitation.createdAt).toLocaleDateString("pt-BR")}</span>
                {invitation.status === "PENDING" && !expired && (
                  <Button type="button" variant="secondary" disabled={pending}
                    onClick={() => {
                      setError("");
                      setPendingId(invitation.id);
                      startTransition(async () => {
                        try {
                          await revokeInvitation(tripId, invitation.id);
                          window.location.reload();
                        } catch {
                          setError("Não foi possível revogar o convite.");
                        } finally {
                          setPendingId(null);
                        }
                      });
                    }}>
                    {pendingId === invitation.id ? "Revogando..." : "Revogar convite"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {error && <p role="alert">{error}</p>}
    </Card>
  );
}

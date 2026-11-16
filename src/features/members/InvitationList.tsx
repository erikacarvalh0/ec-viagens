"use client";

import { useState, useTransition } from "react";

import { Button, Card } from "@/design-system";

import { revokeInvitation } from "./invitation-management";
import { renewExpiredInvitation } from "./invitation-renewal-action";

type Invitation = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
};

export function InvitationList({ tripId, invitations }: { tripId: string; invitations: Invitation[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [renewedUrl, setRenewedUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const now = Date.now();
  return (
    <Card padding="lg">
      <h2>Convites gerados</h2>
      <p>Os links são individuais e não podem ser recuperados após a geração.</p>
      {renewedUrl && (
        <div className="member-invitation__link">
          <p>Seu novo link foi gerado. Copie e compartilhe agora: ele não poderá ser recuperado depois.</p>
          <a href={renewedUrl}>{renewedUrl}</a>
          <a href={`https://wa.me/?text=${encodeURIComponent(`Você foi convidada para uma viagem! ${renewedUrl}`)}`} target="_blank" rel="noopener noreferrer">Compartilhar no WhatsApp</a>
        </div>
      )}
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
                {expired && (
                  <Button type="button" variant="secondary" disabled={pending}
                    onClick={() => {
                      setError("");
                      setPendingId(invitation.id);
                      startTransition(async () => {
                        try {
                          const result = await renewExpiredInvitation(tripId, invitation.id);
                          if (result.error) setError(result.error);
                          else if (result.invitationUrl) setRenewedUrl(result.invitationUrl);
                        } catch {
                          setError("Não foi possível renovar o convite.");
                        } finally {
                          setPendingId(null);
                        }
                      });
                    }}>
                    {pendingId === invitation.id ? "Renovando..." : "Gerar novo link"}
                  </Button>
                )}
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

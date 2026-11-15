"use client";

import { useActionState } from "react";

import { Button, Card, Input, Select } from "@/design-system";

import { issueCharge } from "./charges";

export function ChargeForm({
  tripId,
  plans,
  members,
}: {
  tripId: string;
  plans: Array<{ id: string; name: string }>;
  members: Array<{ id: string; name: string }>;
}) {
  const action = issueCharge.bind(null, tripId);
  const [state, formAction, pending] = useActionState(action, { error: "" });

  return (
    <Card padding="lg">
      <h2>Emitir cobrança</h2>
      <p>Gere um link individual de pagamento no Asaas.</p>
      <form action={formAction} className="payment-plan-form">
        <label>
          Plano de pagamento
          <Select name="planId" required defaultValue="">
            <option value="">Selecione o plano</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </Select>
        </label>
        <label>
          Participante
          <Select name="memberId" required defaultValue="">
            <option value="">Selecione a participante</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </Select>
        </label>
        <label>
          Data de vencimento
          <Input name="dueAt" required type="date" />
        </label>
        {state.error && <p role="alert">{state.error}</p>}
        {state.success && <p role="status">Cobrança emitida com sucesso!</p>}
        <Button disabled={pending || !plans.length || !members.length} type="submit">
          {pending ? "Emitindo..." : "Gerar cobrança no Asaas"}
        </Button>
      </form>
    </Card>
  );
}

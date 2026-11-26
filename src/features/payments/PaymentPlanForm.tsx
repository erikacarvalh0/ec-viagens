"use client";

import { useActionState } from "react";

import { Card, Input, Select } from "@/design-system";
import { EcdsButton as Button } from "@/design-system/ecds-v1";

import { createPaymentPlan } from "./actions";

export function PaymentPlanForm({ tripId }: { tripId: string }) {
  const action = createPaymentPlan.bind(null, tripId);
  const [state, formAction, pending] = useActionState(action, { error: "" });

  return (
    <Card padding="lg">
      <h2>Novo plano de pagamento</h2>
      <p>Defina o valor e, opcionalmente, o dia de vencimento das parcelas.</p>
      <form action={formAction} className="payment-plan-form">
        <label>
          Nome do plano
          <Input
            maxLength={100}
            minLength={3}
            name="name"
            placeholder="Ex.: Parcela mensal"
            required
          />
        </label>
        <label>
          Valor (R$)
          <Input
            min="0.01"
            name="amount"
            placeholder="Ex.: 125.50"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label>
          Dia de vencimento
          <Select defaultValue="" name="dueDay">
            <option value="">Sem vencimento recorrente</option>
            {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={day}>
                Dia {day}
              </option>
            ))}
          </Select>
        </label>
        {state.error && <p role="alert">{state.error}</p>}
        {state.success && <p role="status">Plano criado com sucesso!</p>}
        <Button disabled={pending} type="submit">
          {pending ? "Criando..." : "Criar plano"}
        </Button>
      </form>
    </Card>
  );
}

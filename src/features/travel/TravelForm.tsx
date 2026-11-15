"use client";

import { useActionState } from "react";

import { Button, Card, Input, Select } from "@/design-system";

import { saveTravelDetails } from "./actions";

type TravelProfile = {
  city: string;
  state: string;
  whatsapp: string;
  outboundAt: string;
  outboundPeriod: string;
  outboundOrigin: string;
  returnAt: string;
  returnPeriod: string;
  returnOrigin: string;
  transportMode: string;
  needsRide: boolean;
  interestedVan: boolean;
  shareUber: boolean;
  offersRide: boolean;
  rideOutbound: boolean;
  rideReturn: boolean;
};

const fields = [
  { name: "city", label: "Cidade", type: "text" },
  { name: "state", label: "Estado (UF)", type: "text" },
  { name: "whatsapp", label: "WhatsApp com DDD", type: "tel" },
  { name: "outboundAt", label: "Data de ida", type: "date" },
  { name: "outboundOrigin", label: "Origem da ida", type: "text" },
  { name: "returnAt", label: "Data de volta", type: "date" },
  { name: "returnOrigin", label: "Origem da volta", type: "text" },
  { name: "transportMode", label: "Meio de transporte", type: "text" },
] as const;

const choices = [
  { name: "needsRide", label: "Preciso de carona" },
  { name: "interestedVan", label: "Tenho interesse em van" },
  { name: "shareUber", label: "Quero compartilhar Uber" },
  { name: "offersRide", label: "Ofereço carona" },
  { name: "rideOutbound", label: "Ofereço carona na ida" },
  { name: "rideReturn", label: "Ofereço carona na volta" },
] as const;

export function TravelForm({
  tripId,
  isAdmin,
  profile,
}: {
  tripId: string;
  isAdmin: boolean;
  profile: TravelProfile;
}) {
  const action = saveTravelDetails.bind(null, tripId);
  const [state, formAction, pending] = useActionState(action, { error: "" });

  return (
    <Card padding="lg">
      <h2>Minhas informações de viagem</h2>
      {isAdmin && <p>Como administradora, seus dados de viagem são opcionais.</p>}
      <form action={formAction} className="travel-form">
        {fields.map((field) => (
          <label key={field.name}>
            {field.label}
            <Input
              defaultValue={profile[field.name]}
              maxLength={field.name === "state" ? 2 : undefined}
              name={field.name}
              required={!isAdmin}
              type={field.type}
            />
          </label>
        ))}

        {(["outbound", "return"] as const).map((direction) => (
          <label key={direction}>
            {direction === "outbound" ? "Período de ida" : "Período de volta"}
            <Select
              defaultValue={profile[`${direction}Period`]}
              name={`${direction}Period`}
              required={!isAdmin}
            >
              <option value="">Selecione</option>
              <option value="MORNING">Manhã</option>
              <option value="AFTERNOON">Tarde</option>
              <option value="EVENING">Noite</option>
            </Select>
          </label>
        ))}

        <fieldset>
          <legend>Transporte e caronas</legend>
          {choices.map((choice) => (
            <label key={choice.name}>
              <input
                defaultChecked={profile[choice.name]}
                name={choice.name}
                type="checkbox"
              />
              {choice.label}
            </label>
          ))}
        </fieldset>

        {state.error && <p role="alert">{state.error}</p>}
        {state.success && <p role="status">Informações salvas!</p>}
        <Button disabled={pending} type="submit">
          {pending ? "Salvando..." : "Salvar informações"}
        </Button>
      </form>
    </Card>
  );
}

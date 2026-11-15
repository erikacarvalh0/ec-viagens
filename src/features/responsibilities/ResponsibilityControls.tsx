"use client";

import { useActionState } from "react";

import { Button, Input, Select } from "@/design-system";

import {
  assignResponsibility,
  removeResponsibility,
} from "./actions";
import {
  responsibilityLabels,
  type ResponsibilityInput,
} from "./schema";

type Title = ResponsibilityInput;

function RemoveTitle({
  tripId,
  memberId,
  title,
}: {
  tripId: string;
  memberId: string;
  title: Title["title"];
}) {
  const action = removeResponsibility.bind(null, tripId, memberId);
  const [state, formAction, pending] = useActionState(
    async (previous: { error: string }) => action(previous, title),
    { error: "" },
  );

  return (
    <form action={formAction}>
      <Button disabled={pending} size="sm" type="submit" variant="secondary">
        Remover {responsibilityLabels[title].toLowerCase()}
      </Button>
      {state.error && <small role="alert">{state.error}</small>}
    </form>
  );
}

export function ResponsibilityControls({
  tripId,
  memberId,
  titles,
}: {
  tripId: string;
  memberId: string;
  titles: Title[];
}) {
  const action = assignResponsibility.bind(null, tripId, memberId);
  const [state, formAction, pending] = useActionState(
    async (previous: { error: string }, formData: FormData) =>
      action(previous, {
        title: String(formData.get("title")) as Title["title"],
        description: String(formData.get("description") ?? ""),
      }),
    { error: "" },
  );

  return (
    <div className="responsibilities">
      <form action={formAction} className="responsibilities__form">
        <label>
          Atribuir função
          <Select defaultValue="VAN_COORDINATOR" name="title">
            <option value="VAN_COORDINATOR">Coordenadora da van</option>
            <option value="ORGANIZER">Organizadora</option>
          </Select>
        </label>
        <label>
          Responsabilidades
          <Input
            maxLength={500}
            name="description"
            placeholder="Ex.: organizar horários e pontos de encontro"
          />
        </label>
        <Button disabled={pending} size="sm" type="submit">
          {pending ? "Salvando..." : "Salvar função"}
        </Button>
        {state.error && <small role="alert">{state.error}</small>}
      </form>

      {titles.map((entry) => (
        <div className="responsibilities__assigned" key={entry.title}>
          <div>
            <strong>{responsibilityLabels[entry.title]}</strong>
            {entry.description && <p>{entry.description}</p>}
          </div>
          <RemoveTitle
            memberId={memberId}
            title={entry.title}
            tripId={tripId}
          />
        </div>
      ))}
    </div>
  );
}

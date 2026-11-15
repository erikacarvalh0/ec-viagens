"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { Button, Card, Input } from "@/design-system";

import { tripDraftSchema, type TripDraft } from "./trip";

type TripFormProps = {
  onClose: () => void;
  onCreate: (draft: TripDraft) => void;
};

export function TripForm({ onClose, onCreate }: TripFormProps) {
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const result = tripDraftSchema.safeParse({
      name: String(data.get("name") ?? ""),
      startsAt: String(data.get("startsAt") ?? ""),
      endsAt: String(data.get("endsAt") ?? ""),
      locationName: String(data.get("locationName") ?? ""),
      mapUrl: String(data.get("mapUrl") ?? ""),
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Verifique os campos.");

      return;
    }

    setError("");
    onCreate(result.data);
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <Card
        aria-labelledby="trip-form-title"
        aria-modal="true"
        className="trip-modal"
        padding="lg"
        role="dialog"
      >
        <div className="trip-modal__header">
          <div>
            <p className="eyebrow">UM NOVO CAPÍTULO</p>
            <h2 id="trip-form-title">Nova viagem ♡</h2>
          </div>

          <Button
            aria-label="Fechar formulário"
            onClick={onClose}
            size="sm"
            variant="ghost"
          >
            <X size={19} />
          </Button>
        </div>

        <p className="trip-modal__description">
          O nome é obrigatório. Você pode preencher os demais detalhes depois.
        </p>

        <form className="trip-form" onSubmit={handleSubmit}>
          <label htmlFor="trip-name">Nome da viagem *</label>
          <Input
            autoFocus
            id="trip-name"
            maxLength={100}
            minLength={3}
            name="name"
            placeholder="Ex.: Encontrão 2027"
            required
          />

          <div className="trip-form__dates">
            <div>
              <label htmlFor="trip-start">Data de ida</label>
              <Input id="trip-start" name="startsAt" type="date" />
            </div>

            <div>
              <label htmlFor="trip-end">Data de volta</label>
              <Input id="trip-end" name="endsAt" type="date" />
            </div>
          </div>

          <label htmlFor="trip-location">Local</label>
          <Input
            id="trip-location"
            maxLength={120}
            name="locationName"
            placeholder="Ex.: Sítio em Ibiúna, SP"
          />

          <label htmlFor="trip-map">Link do mapa</label>
          <Input
            id="trip-map"
            name="mapUrl"
            placeholder="https://maps.google.com/..."
            type="url"
          />

          {error && (
            <p className="trip-form__error" role="alert">
              {error}
            </p>
          )}

          <div className="trip-form__actions">
            <Button onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>

            <Button type="submit">Criar viagem</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

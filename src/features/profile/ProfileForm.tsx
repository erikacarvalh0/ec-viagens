"use client";

import { useState, useTransition } from "react";

import { Button } from "@/design-system";

import { updateProfile } from "./profile";
import { type ProfileDraft, profileSchema } from "./schema";

export function ProfileForm({ initial }: { initial: ProfileDraft }) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function setField(field: keyof ProfileDraft, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setSaved(false);
  }

  return (
    <form className="trip-form" onSubmit={(event) => {
      event.preventDefault();
      const parsed = profileSchema.safeParse(values);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Verifique os dados.");
        return;
      }
      setError("");
      startTransition(async () => {
        const result = await updateProfile(parsed.data);
        if (!result.success) setError(result.error);
        else setSaved(true);
      });
    }}>
      <label htmlFor="profile-name">Nome *</label>
      <input id="profile-name" value={values.name} maxLength={100} required disabled={pending}
        onChange={(event) => setField("name", event.target.value)} />
      <label htmlFor="profile-city">Cidade</label>
      <input id="profile-city" value={values.city} maxLength={100} disabled={pending}
        onChange={(event) => setField("city", event.target.value)} />
      <label htmlFor="profile-state">Estado</label>
      <input id="profile-state" value={values.state} maxLength={80} disabled={pending}
        onChange={(event) => setField("state", event.target.value)} />
      <label htmlFor="profile-whatsapp">WhatsApp (DDI + DDD + número)</label>
      <input id="profile-whatsapp" type="tel" inputMode="numeric" value={values.whatsapp}
        placeholder="5511999999999" disabled={pending}
        onChange={(event) => setField("whatsapp", event.target.value)} />
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">Perfil atualizado com sucesso.</p>}
      <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar perfil"}</Button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/design-system";

import { validateSelectedPhoto } from "./upload-client";

export function PhotoUploadForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  return (
    <form ref={formRef} onSubmit={(event) => {
      event.preventDefault();
      const error = validateSelectedPhoto(selectedFile);
      if (error) {
        setSelectionError(error);
        return;
      }
      const form = new FormData(event.currentTarget);
      startTransition(async () => {
        try {
          const response = await fetch(`/api/trips/${tripId}/photos`, {
            method: "POST",
            body: form,
          });
          if (!response.ok) throw new Error("Falha no upload.");
          setMessage("Foto adicionada.");
          setSelectedFile(null);
          setSelectionError("");
          formRef.current?.reset();
          router.refresh();
        } catch {
          setMessage("Não foi possível enviar a foto. Tente novamente.");
        }
      });
    }}>
      <label>
        Foto (JPEG ou PNG, até 5 MB)
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png"
          required
          disabled={pending}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0] ?? null;
            const error = validateSelectedPhoto(file);
            setSelectionError(error ?? "");
            setSelectedFile(error ? null : file);
            setMessage("");
          }}
        />
      </label>
      {previewUrl && (
        // The blob URL is local to the user's browser and never publicly exposed.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Pré-visualização da foto selecionada"
          width={240}
          style={{ maxWidth: "100%", height: "auto" }}
        />
      )}
      {selectionError && <p role="alert">{selectionError}</p>}
      <label>
        Legenda (opcional)
        <input type="text" name="caption" maxLength={200} disabled={pending} />
      </label>
      <Button type="submit" disabled={pending || !selectedFile || Boolean(selectionError)}>
        {pending ? "Enviando..." : "Adicionar foto"}
      </Button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}

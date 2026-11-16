export function whatsappTemplateLanguage(value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return "pt_BR";
  if (!/^[a-z]{2}_[A-Z]{2}$/.test(normalized)) {
    throw new Error("Invalid WhatsApp template language.");
  }
  return normalized;
}

export function whatsappTemplateName(value: string): string {
  if (!/^[a-z0-9_]{1,512}$/.test(value)) {
    throw new Error("Invalid WhatsApp template name.");
  }
  return value;
}

export function whatsappTemplateLanguage(value: string | undefined): string {
  if (value === undefined || value === "") return "pt_BR";
  if (!/^[a-z]{2}_[A-Z]{2}$/.test(value)) {
    throw new Error("Invalid WhatsApp template language.");
  }
  return value;
}

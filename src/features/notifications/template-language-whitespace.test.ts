import { describe, expect, it } from "vitest";
import { whatsappTemplateLanguage } from "./template-config";
describe("WhatsApp template language configuration", () => {
  it("accepts surrounding whitespace from environment configuration", () => {
    expect(whatsappTemplateLanguage("  pt_BR  ")).toBe("pt_BR");
  });
  it("uses the default for whitespace-only configuration", () => {
    expect(whatsappTemplateLanguage("  ")).toBe("pt_BR");
  });
  it("still rejects malformed language codes", () => {
    expect(() => whatsappTemplateLanguage("portuguese")).toThrow("Invalid WhatsApp template language.");
  });
});

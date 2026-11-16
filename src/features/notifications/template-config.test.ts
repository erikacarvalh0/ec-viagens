import { describe, expect, it } from "vitest";
import { whatsappTemplateLanguage } from "./template-config";
describe("WhatsApp template language", () => {
  it("defaults to Brazilian Portuguese", () => {
    expect(whatsappTemplateLanguage(undefined)).toBe("pt_BR");
  });
  it("accepts valid language and region codes", () => {
    expect(whatsappTemplateLanguage("en_US")).toBe("en_US");
  });
  it("rejects malformed language codes", () => {
    expect(() => whatsappTemplateLanguage("pt_BR/../")).toThrow("Invalid WhatsApp template language");
  });
});

import { describe, expect, it } from "vitest";
import { whatsappTemplateName } from "./template-config";
describe("WhatsApp template name", () => {
  it("accepts Meta template identifiers", () => {
    expect(whatsappTemplateName("payment_reminder_1")).toBe("payment_reminder_1");
  });
  it("rejects malformed identifiers", () => {
    expect(() => whatsappTemplateName("Payment Reminder!")).toThrow("Invalid WhatsApp template name");
  });
  it("rejects empty identifiers", () => {
    expect(() => whatsappTemplateName("")).toThrow("Invalid WhatsApp template name");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { sendPaymentReminderTemplate } from "./whatsapp";

describe("WhatsApp provider timeout", () => {
 afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
 it("sets a finite timeout on provider requests", async () => {
  vi.stubEnv("WHATSAPP_ACCESS_TOKEN","test-token");
  vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID","123456");
  vi.stubEnv("WHATSAPP_PAYMENT_TEMPLATE","payment_reminder");
  const fetchMock = vi.fn().mockResolvedValue({
   ok:true,
   json:async () => ({messages:[{id:"message-1"}]}),
  });
  vi.stubGlobal("fetch",fetchMock);
  await expect(sendPaymentReminderTemplate({
   to:"5511999999999",name:"Test User",paymentUrl:"https://example.com/pay",
  })).resolves.toBe("message-1");
  const options = fetchMock.mock.calls[0][1];
  expect(options.signal).toBeInstanceOf(AbortSignal);
 });
});

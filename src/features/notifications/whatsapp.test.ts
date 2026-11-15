import { afterEach, describe, expect, it, vi } from "vitest";

import { sendPaymentReminderTemplate } from "./whatsapp";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("WhatsApp Cloud API payment reminder template", () => {
  it("uses an approved template and returns the provider message ID", async () => {
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "secret");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "123");
    vi.stubEnv("WHATSAPP_PAYMENT_TEMPLATE", "payment_reminder");
    vi.stubEnv("WHATSAPP_GRAPH_VERSION", "v23.0");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.123" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendPaymentReminderTemplate({
      to: "5511999999999",
      name: "Ana",
      paymentUrl: "https://sandbox.asaas.com/i/abc",
    });

    expect(result).toBe("wamid.123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://graph.facebook.com/v23.0/123/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer secret",
        }),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.type).toBe("template");
    expect(body.template.name).toBe("payment_reminder");
    expect(body.template.components[0].parameters).toEqual([
      { type: "text", text: "Ana" },
      { type: "text", text: "https://sandbox.asaas.com/i/abc" },
    ]);
  });

  it("fails closed when configuration is missing", async () => {
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "");
    await expect(sendPaymentReminderTemplate({
      to: "5511999999999", name: "Ana", paymentUrl: "https://example.com",
    })).rejects.toThrow();
  });
});

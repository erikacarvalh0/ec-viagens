type ReminderTemplateInput = {
  to: string;
  name: string;
  paymentUrl: string;
};

export async function sendPaymentReminderTemplate(input: ReminderTemplateInput) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const template = process.env.WHATSAPP_PAYMENT_TEMPLATE;
  const version = process.env.WHATSAPP_GRAPH_VERSION ?? "v23.0";

  if (!token || !phoneId || !template) {
    throw new Error("WhatsApp Cloud API is not configured.");
  }

  if (!/^v\d+\.\d+$/.test(version) || !/^\d+$/.test(phoneId)) {
    throw new Error("Invalid WhatsApp API configuration.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${version}/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to,
        type: "template",
        template: {
          name: template,
          language: { code: "pt_BR" },
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: input.name },
              { type: "text", text: input.paymentUrl },
            ],
          }],
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`WhatsApp API request failed (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as {
    messages?: Array<{ id?: string }>;
  };
  const messageId = payload.messages?.[0]?.id;

  if (!messageId) {
    throw new Error("WhatsApp did not return a message ID.");
  }

  return messageId;
}

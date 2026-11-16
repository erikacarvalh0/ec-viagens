import { createHmac, timingSafeEqual } from "node:crypto";

import { reconcileWhatsAppStatuses } from "@/features/notifications/delivery";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!token) {
    return new Response("Webhook verification not configured.", { status: 503 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const provided = url.searchParams.get("hub.verify_token") ?? "";
  const challenge = url.searchParams.get("hub.challenge") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(token);

  if (
    mode !== "subscribe" ||
    !challenge ||
    a.length !== b.length ||
    !timingSafeEqual(a, b)
  ) {
    return new Response("Forbidden.", { status: 403 });
  }

  return new Response(challenge, { status: 200 });
}

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    return Response.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const provided = request.headers.get("x-hub-signature-256") ?? "";
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  try {
    const body: unknown = JSON.parse(rawBody);
    const updated = await reconcileWhatsAppStatuses(body);
    return Response.json({ updated });
  } catch {
    return Response.json({ error: "Unable to process callback." }, { status: 400 });
  }
}

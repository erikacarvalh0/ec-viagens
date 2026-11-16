import { createHmac, timingSafeEqual } from "node:crypto";

import { reconcileWhatsAppStatuses } from "@/features/notifications/delivery";

export const runtime = "nodejs";
const MAX_WEBHOOK_BYTES = 1024 * 1024;

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

  const advertisedSize = Number(request.headers.get("content-length"));
  if (Number.isFinite(advertisedSize) && advertisedSize > MAX_WEBHOOK_BYTES) {
    return Response.json({ error: "Payload too large." }, { status: 413 });
  }

  let rawBody: string;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing body.");
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let bytes = 0;
    let body = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_WEBHOOK_BYTES) {
        await reader.cancel();
        return Response.json({ error: "Payload too large." }, { status: 413 });
      }
      body += decoder.decode(value, { stream: true });
    }
    rawBody = body + decoder.decode();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
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

import { randomUUID, timingSafeEqual } from "node:crypto";

import { reconcileAsaasEvent } from "@/features/payments/webhook";

export const runtime = "nodejs";
const MAX_WEBHOOK_BYTES = 1024 * 1024;

function validToken(actual: string | null, expected: string) {
  if (!actual) {
    return false;
  }

  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

  if (!expectedToken) {
    return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  if (!validToken(request.headers.get("asaas-access-token"), expectedToken)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const advertisedSize = Number(request.headers.get("content-length"));
  if (Number.isFinite(advertisedSize) && advertisedSize > MAX_WEBHOOK_BYTES) {
    return Response.json({ error: "Payload too large." }, { status: 413 });
  }

  let payload: unknown;
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
    body += decoder.decode();
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    const result = await reconcileAsaasEvent(payload);
    return Response.json({ result });
  } catch (error) {
    // Invalid events should not be retried; transient DB errors should.
    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ error: "Invalid event." }, { status: 400 });
    }

    console.warn(JSON.stringify({ event: "payment_reconciliation_failed", requestId, status: 500, durationMs: Date.now() - startedAt }));
    return Response.json({ error: "Reconciliation failed." }, { status: 500, headers: { "X-Request-Id": requestId } });
  }
}

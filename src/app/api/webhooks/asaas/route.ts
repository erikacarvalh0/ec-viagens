import { timingSafeEqual } from "node:crypto";

import { reconcileAsaasEvent } from "@/features/payments/webhook";

export const runtime = "nodejs";

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
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

  if (!expectedToken) {
    return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  if (!validToken(request.headers.get("asaas-access-token"), expectedToken)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
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

    return Response.json({ error: "Reconciliation failed." }, { status: 500 });
  }
}

import { randomUUID, timingSafeEqual } from "node:crypto";

import { dispatchDuePaymentReminders } from "@/features/notifications/dispatch";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return Response.json({ error: "Cron is not configured." }, { status: 503 });
  }

  const provided = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await dispatchDuePaymentReminders();
    return Response.json(result);
  } catch {
    console.warn(JSON.stringify({ event: "reminder_processing_failed", requestId, status: 500, durationMs: Date.now() - startedAt }));
    return Response.json({ error: "Reminder processing failed." }, { status: 500, headers: { "X-Request-Id": requestId } });
  }
}

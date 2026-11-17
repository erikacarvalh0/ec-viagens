import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const headers = { "Cache-Control": "no-store", "X-Request-Id": requestId };
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers });
  } catch {
    console.warn(JSON.stringify({ event: "readiness_failed", requestId, status: 503, durationMs: Date.now() - startedAt }));
    return Response.json({ status: "unavailable" }, { status: 503, headers });
  }
}

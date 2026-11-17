import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: vi.fn() } }));

describe("production readiness", () => {
  it("reports readiness without caching", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);
    const result = await GET();
    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toEqual({ status: "ok" });
  });

  it("returns 503 without exposing database errors", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("sensitive connection details"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const result = await GET();
    expect(result.status).toBe(503);
    const event = JSON.parse(String(warn.mock.calls[0][0]));
    expect(event).toMatchObject({ event: "readiness_failed", requestId: result.headers.get("x-request-id"), status: 503 });
    expect(JSON.stringify(event)).not.toContain("sensitive connection details");
    warn.mockRestore();
    expect(await result.json()).toEqual({ status: "unavailable" });
  });
});

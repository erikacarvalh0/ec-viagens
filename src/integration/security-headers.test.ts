import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";

describe("application security response headers", () => {
 it("sets defensive headers on application routes", async () => {
  const config = await nextConfig.headers?.();
  expect(config).toBeDefined();
  const all = config?.find((item) => item.source === "/:path*");
  expect(all).toBeDefined();
  const headers = Object.fromEntries(all?.headers.map((item) => [item.key.toLowerCase(), item.value]) ?? []);
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["permissions-policy"]).toContain("microphone=()");
 });
});

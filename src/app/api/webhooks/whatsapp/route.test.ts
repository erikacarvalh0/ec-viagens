import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const mocks = vi.hoisted(() => ({ reconcile: vi.fn() }));
vi.mock("@/features/notifications/delivery", () => ({
  reconcileWhatsAppStatuses: mocks.reconcile,
}));

import { GET, POST } from "./route";

afterEach(() => vi.unstubAllEnvs());

describe("WhatsApp webhook", () => {
  it("verifies the Meta challenge", async () => {
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "expected");
    const response = await GET(new Request(
      "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=expected&hub.challenge=12345",
    ));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("12345");
  });

  it("rejects invalid verification tokens", async () => {
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "expected");
    const response = await GET(new Request(
      "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345",
    ));
    expect(response.status).toBe(403);
  });

  it("rejects unsigned callbacks", async () => {
    vi.stubEnv("WHATSAPP_APP_SECRET", "secret");
    const response = await POST(new Request("http://localhost/api/webhooks/whatsapp", {
      method: "POST",
      body: "{}",
    }));
    expect(response.status).toBe(401);
    expect(mocks.reconcile).not.toHaveBeenCalled();
  });

  it("accepts correctly signed delivery receipts", async () => {
    vi.stubEnv("WHATSAPP_APP_SECRET", "secret");
    mocks.reconcile.mockResolvedValue(1);
    const body = JSON.stringify({ entry: [] });
    const signature = createHmac("sha256", "secret").update(body).digest("hex");
    const response = await POST(new Request("http://localhost/api/webhooks/whatsapp", {
      method: "POST",
      body,
      headers: { "x-hub-signature-256": `sha256=${signature}` },
    }));
    expect(response.status).toBe(200);
    expect(mocks.reconcile).toHaveBeenCalledOnce();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ reconcile: vi.fn() }));

vi.mock("@/features/payments/webhook", () => ({
  reconcileAsaasEvent: mocks.reconcile,
}));

import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Asaas webhook endpoint", () => {
  it("rejects requests without a configured token", async () => {
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "");

    const response = await POST(new Request("http://localhost/api/webhooks/asaas", {
      method: "POST",
      body: "{}",
    }));

    expect(response.status).toBe(503);
  });

  it("rejects invalid access tokens", async () => {
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "expected");

    const response = await POST(new Request("http://localhost/api/webhooks/asaas", {
      method: "POST",
      headers: { "asaas-access-token": "incorrect" },
      body: "{}",
    }));

    expect(response.status).toBe(401);
    expect(mocks.reconcile).not.toHaveBeenCalled();
  });

  it("processes valid events", async () => {
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "expected");
    mocks.reconcile.mockResolvedValue("processed");

    const response = await POST(new Request("http://localhost/api/webhooks/asaas", {
      method: "POST",
      headers: { "asaas-access-token": "expected" },
      body: JSON.stringify({
        id: "evt-1",
        event: "PAYMENT_RECEIVED",
        payment: { id: "pay-1" },
      }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.reconcile).toHaveBeenCalledOnce();
  });
});

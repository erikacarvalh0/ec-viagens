import { afterEach, describe, expect, it, vi } from "vitest";

import { createAsaasCustomer, createAsaasPayment } from "./asaas";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Asaas API client", () => {
  it("requires an API key", async () => {
    vi.stubEnv("ASAAS_API_KEY", "");

    await expect(
      createAsaasCustomer({ name: "Ana", email: "ana@example.com" }),
    ).rejects.toThrow("ASAAS_API_KEY");
  });

  it("uses a customer request with JSON and access token", async () => {
    vi.stubEnv("ASAAS_API_KEY", "test-key");
    vi.stubEnv("ASAAS_ENVIRONMENT", "sandbox");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "cus_123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const id = await createAsaasCustomer({
      name: "Ana",
      email: "ana@example.com",
    });

    expect(id).toBe("cus_123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api-sandbox.asaas.com/v3/customers",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ access_token: "test-key" }),
      }),
    );
  });

  it("uses externalReference to reconcile payments", async () => {
    vi.stubEnv("ASAAS_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "pay_123", invoiceUrl: "https://example.com/pay" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await createAsaasPayment({
      customer: "cus_123",
      value: 125.5,
      dueDate: "2027-03-10",
      externalReference: "charge-a",
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        billingType: "UNDEFINED",
        externalReference: "charge-a",
      }),
    );
  });
});

type CustomerInput = {
  name: string;
  email: string;
};

type PaymentInput = {
  customer: string;
  value: number;
  dueDate: string;
  externalReference: string;
};

type PaymentResponse = { id: string; invoiceUrl: string };

async function asaasPost<T>(path: string, body: object): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY is not configured.");
  }

  const host = process.env.ASAAS_ENVIRONMENT === "production"
    ? "https://api.asaas.com"
    : "https://api-sandbox.asaas.com";

  let response: Response;
  try {
    response = await fetch(`${host}/v3/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("Asaas API request failed.");
  }

  if (!response.ok) {
    throw new Error(`Asaas API request failed (HTTP ${response.status}).`);
  }

  return (await response.json()) as T;
}

export async function createAsaasCustomer(customer: CustomerInput) {
  const result = await asaasPost<{ id: string }>("customers", customer);

  if (!result.id) {
    throw new Error("Asaas did not return a customer ID.");
  }

  return result.id;
}

export async function createAsaasPayment(input: PaymentInput) {
  const result = await asaasPost<PaymentResponse>("payments", {
    ...input,
    billingType: "UNDEFINED",
  });

  if (!result.id || !result.invoiceUrl) {
    throw new Error("Asaas did not return a valid payment link.");
  }

  return result;
}

type AsaasPaymentLookup = {
  id: string;
  invoiceUrl?: string;
  status: string;
  externalReference?: string;
};

export async function findAsaasPaymentByReference(reference: string) {
  const apiKey = process.env.ASAAS_API_KEY;

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY is not configured.");
  }

  const host = process.env.ASAAS_ENVIRONMENT === "production"
    ? "https://api.asaas.com"
    : "https://api-sandbox.asaas.com";

  const query = new URLSearchParams({ externalReference: reference });
  let response: Response;
  try {
    response = await fetch(`${host}/v3/payments?${query}`, {
    headers: { access_token: apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("Asaas payment lookup failed.");
  }

  if (!response.ok) {
    throw new Error(`Asaas payment lookup failed (HTTP ${response.status}).`);
  }

  const result = (await response.json()) as { data?: AsaasPaymentLookup[] };
  const matches = (result.data ?? []).filter(
    (payment) => payment.externalReference === reference,
  );

  if (matches.length > 1) {
    throw new Error("Multiple Asaas payments found for the same reference.");
  }

  return matches[0] ?? null;
}

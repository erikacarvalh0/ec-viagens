const PROVIDER_URL = "https://api.resend.com/emails";

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;
  const baseUrl = process.env.APP_BASE_URL;
  if (!apiKey || !from || !baseUrl) throw new Error("Email delivery is not configured.");
  const origin = new URL(baseUrl);
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash) {
    throw new Error("Invalid application base URL.");
  }
  const link = new URL("/verify-email", origin);
  link.searchParams.set("token", token);
  try {
    const response = await fetch(PROVIDER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [email], subject: "Confirme seu e-mail no EC Viagens",
        text: `Entre na conta cadastrada e confirme seu e-mail em até 1 hora: ${link.toString()}`,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("Delivery failed.");
  } catch {
    throw new Error("Email delivery failed.");
  }
}

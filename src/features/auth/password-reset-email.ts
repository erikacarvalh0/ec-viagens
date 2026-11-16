const PROVIDER_URL = "https://api.resend.com/emails";

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;
  const baseUrl = process.env.APP_BASE_URL;
  if (!apiKey || !from || !baseUrl) {
    throw new Error("Password reset email delivery is not configured.");
  }
  let origin: URL;
  try {
    origin = new URL(baseUrl);
  } catch {
    throw new Error("Invalid application base URL.");
  }
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash) {
    throw new Error("Invalid application base URL.");
  }
  const link = new URL("/reset-password", origin);
  link.searchParams.set("token", token);
  let response: Response;
  try {
    response = await fetch(PROVIDER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Redefina sua senha no EC Viagens",
      text: `Você solicitou uma nova senha no EC Viagens. Use este link em até 1 hora: ${link.toString()}\nSe não foi você, ignore esta mensagem.`,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("Password reset email delivery failed.");
  }
  if (!response.ok) {
    throw new Error("Password reset email delivery failed.");
  }
}

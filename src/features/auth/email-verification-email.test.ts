import { afterEach, describe, expect, it, vi } from "vitest";
import { sendVerificationEmail } from "./email-verification-email";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("verification email delivery", () => {
  function configure() {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("PASSWORD_RESET_FROM_EMAIL", "sender@example.com");
    vi.stubEnv("APP_BASE_URL", "https://example.com");
  }
  it("sends a confirmation link with bounded delivery time", async () => {
    configure();
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetcher);
    await sendVerificationEmail("ana@example.com", "a".repeat(64));
    const options = fetcher.mock.calls[0][1];
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(options.body)).toMatchObject({ to: ["ana@example.com"], text: expect.stringContaining(`https://example.com/verify-email?token=${"a".repeat(64)}`) });
  });
  it.each(["provider", "network"])("reports %s failures", async (failure) => {
    configure();
    vi.stubGlobal("fetch", failure === "provider" ? vi.fn().mockResolvedValue({ ok: false }) : vi.fn().mockRejectedValue(new Error("timeout")));
    await expect(sendVerificationEmail("ana@example.com", "a".repeat(64))).rejects.toThrow("Email delivery failed.");
  });
  it("rejects insecure origins before sending", async () => {
    configure();
    vi.stubEnv("APP_BASE_URL", "http://example.com");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(sendVerificationEmail("ana@example.com", "a".repeat(64))).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});

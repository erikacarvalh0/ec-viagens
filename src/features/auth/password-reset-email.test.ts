import { afterEach, describe, expect, it, vi } from "vitest";
import { sendPasswordResetEmail } from "./password-reset-email";

describe("sendPasswordResetEmail", () => {
 afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
 it("refuses to deliver without provider configuration", async () => {
  vi.stubEnv("RESEND_API_KEY","");
  vi.stubEnv("PASSWORD_RESET_FROM_EMAIL","");
  vi.stubEnv("APP_BASE_URL","");
  await expect(sendPasswordResetEmail("user@example.com","a".repeat(64))).rejects.toThrow("Password reset email delivery is not configured.");
 });
 it("sends a reset link through the configured provider", async () => {
  vi.stubEnv("RESEND_API_KEY","test-key");
  vi.stubEnv("PASSWORD_RESET_FROM_EMAIL","EC Viagens <no-reply@example.com>");
  vi.stubEnv("APP_BASE_URL","https://ec.example.com");
  const fetchMock = vi.fn().mockResolvedValue({ok:true});
  vi.stubGlobal("fetch",fetchMock);
  await sendPasswordResetEmail("user@example.com","a".repeat(64));
  expect(fetchMock).toHaveBeenCalledOnce();
  const [url,options] = fetchMock.mock.calls[0];
  expect(url).toBe("https://api.resend.com/emails");
  expect(options.headers.Authorization).toBe("Bearer test-key");
  const body = JSON.parse(options.body);
  expect(body.to).toEqual(["user@example.com"]);
  expect(body.text).toContain("https://ec.example.com/reset-password?token=");
  expect(body.text).toContain("a".repeat(64));
 });
 it("rejects unsafe base URLs and provider failures", async () => {
  vi.stubEnv("RESEND_API_KEY","test-key");
  vi.stubEnv("PASSWORD_RESET_FROM_EMAIL","no-reply@example.com");
  vi.stubEnv("APP_BASE_URL","http://untrusted.example.com");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch",fetchMock);
  await expect(sendPasswordResetEmail("user@example.com","a".repeat(64))).rejects.toThrow("Invalid application base URL.");
  expect(fetchMock).not.toHaveBeenCalled();
  vi.stubEnv("APP_BASE_URL","https://ec.example.com");
  fetchMock.mockResolvedValue({ok:false,status:429});
  await expect(sendPasswordResetEmail("user@example.com","a".repeat(64))).rejects.toThrow("Password reset email delivery failed.");
 });
});

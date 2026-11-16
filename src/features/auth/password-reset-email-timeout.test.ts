import { afterEach, describe, expect, it, vi } from "vitest";
import { sendPasswordResetEmail } from "./password-reset-email";

describe("password reset email timeout", () => {
 afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
 it("bounds provider requests with an abort signal", async () => {
  vi.stubEnv("RESEND_API_KEY","test-key");
  vi.stubEnv("PASSWORD_RESET_FROM_EMAIL","no-reply@example.com");
  vi.stubEnv("APP_BASE_URL","https://ec.example.com");
  const fetchMock = vi.fn().mockResolvedValue({ok:true});
  vi.stubGlobal("fetch",fetchMock);
  await sendPasswordResetEmail("user@example.com","a".repeat(64));
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
 });
 it("reports provider timeouts without exposing reset tokens", async () => {
  vi.stubEnv("RESEND_API_KEY","test-key");
  vi.stubEnv("PASSWORD_RESET_FROM_EMAIL","no-reply@example.com");
  vi.stubEnv("APP_BASE_URL","https://ec.example.com");
  vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("network timeout")));
  await expect(sendPasswordResetEmail("user@example.com","a".repeat(64))).rejects.toThrow("Password reset email delivery failed.");
 });
});

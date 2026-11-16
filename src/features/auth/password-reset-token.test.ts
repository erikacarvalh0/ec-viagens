import { describe, expect, it } from "vitest";
import { createPasswordResetToken, hashPasswordResetToken } from "./password-reset-token";
describe("password reset tokens", () => {
  it("generates distinct cryptographically random tokens", () => {
    const first = createPasswordResetToken();
    const second = createPasswordResetToken();
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toBe(second);
  });
  it("returns a deterministic hash without exposing the raw token", () => {
    const token = createPasswordResetToken();
    expect(hashPasswordResetToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashPasswordResetToken(token)).not.toBe(token);
    expect(hashPasswordResetToken(token)).toBe(hashPasswordResetToken(token));
  });
});

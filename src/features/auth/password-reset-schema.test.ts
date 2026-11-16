import { describe, expect, it } from "vitest";
import { passwordResetRequestSchema, passwordResetConfirmationSchema } from "./password-reset-schema";
describe("password reset input validation", () => {
  it("normalizes the email before requesting a reset", () => {
    expect(passwordResetRequestSchema.parse({ email: " ANA@EXAMPLE.COM " }).email).toBe("ana@example.com");
  });
  it("rejects malformed reset tokens", () => {
    expect(passwordResetConfirmationSchema.safeParse({ token: "bad", password: "new-password-123" }).success).toBe(false);
  });
  it("rejects weak replacement passwords", () => {
    expect(passwordResetConfirmationSchema.safeParse({ token: "a".repeat(64), password: "short" }).success).toBe(false);
  });
  it("accepts valid reset input", () => {
    expect(passwordResetConfirmationSchema.safeParse({ token: "a".repeat(64), password: "secure-password-123" }).success).toBe(true);
  });
});

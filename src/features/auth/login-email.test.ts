import { describe, expect, it } from "vitest";
import { loginSchema } from "./schemas";
describe("login email normalization", () => {
  it("normalizes spaces and case like registration", () => {
    expect(loginSchema.parse({ email: " ANA@EXAMPLE.COM ", password: "secret" }).email).toBe("ana@example.com");
  });
  it("does not modify the password", () => {
    expect(loginSchema.parse({ email: "a@example.com", password: "  pass  " }).password).toBe("  pass  ");
  });
});

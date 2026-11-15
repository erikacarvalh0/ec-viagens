import { describe, expect, it } from "vitest";

import { loginSchema, registrationSchema } from "./schemas";

describe("authentication validation", () => {
  it("normalizes registration emails", () => {
    const result = registrationSchema.parse({
      name: "Ana",
      email: " ANA@EXAMPLE.COM ",
      password: "secure-password-123",
    });

    expect(result.email).toBe("ana@example.com");
  });

  it("rejects short registration passwords", () => {
    expect(
      registrationSchema.safeParse({
        name: "Ana",
        email: "ana@example.com",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid login emails", () => {
    expect(
      loginSchema.safeParse({
        email: "not-an-email",
        password: "password",
      }).success,
    ).toBe(false);
  });
});

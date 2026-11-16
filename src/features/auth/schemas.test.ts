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

  it.each([1, 128])("accepts login passwords of %i characters", (length) => {
    expect(
      loginSchema.safeParse({
        email: "ana@example.com",
        password: "a".repeat(length),
      }).success,
    ).toBe(true);
  });

  it.each([0, 129])("rejects login passwords of %i characters", (length) => {
    expect(
      loginSchema.safeParse({
        email: "ana@example.com",
        password: "a".repeat(length),
      }).success,
    ).toBe(false);
  });
});

describe.each([
  ["login", loginSchema],
  ["registration", registrationSchema],
])("%s email length", (_name, schema) => {
  // Keep each domain label within 63 characters while varying total length.
  const domain = `${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(57)}.com`;

  it("accepts 254 characters after trimming and normalizes case", () => {
    const email = `${"A".repeat(64)}@${domain}`;
    expect(email).toHaveLength(254);

    const result = schema.parse({
      name: "Ana",
      email: ` ${email} `,
      password: "secure-password-123",
    });

    expect(result.email).toBe(email.toLowerCase());
  });

  it("rejects an otherwise valid email of 255 characters", () => {
    const email = `${"a".repeat(64)}@${domain}x`;
    expect(email).toHaveLength(255);

    expect(schema.safeParse({
      name: "Ana",
      email,
      password: "secure-password-123",
    }).success).toBe(false);
  });
});

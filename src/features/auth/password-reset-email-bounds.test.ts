import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.lookup } },
}));

import { requestPasswordReset } from "./password-reset-request";
import { passwordResetRequestSchema } from "./password-reset-schema";

describe("password reset address limits", () => {
  it("rejects email addresses longer than the database-safe maximum", () => {
    const email = `${"a".repeat(245)}@example.com`;
    expect(passwordResetRequestSchema.safeParse({ email }).success).toBe(false);
  });

  it("does not query accounts or send mail for oversized input", async () => {
    const deliver = vi.fn();
    await expect(requestPasswordReset({
      email: `${"a".repeat(245)}@example.com`,
    }, deliver)).rejects.toThrow();
    expect(mocks.lookup).not.toHaveBeenCalled();
    expect(deliver).not.toHaveBeenCalled();
  });

  it("continues to normalize valid email addresses", () => {
    expect(passwordResetRequestSchema.parse({
      email: " PERSON@EXAMPLE.COM ",
    }).email).toBe("person@example.com");
  });
});

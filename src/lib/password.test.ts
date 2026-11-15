import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("creates salted hashes instead of storing plaintext", async () => {
    const first = await hashPassword("a-long-test-password");
    const second = await hashPassword("a-long-test-password");

    expect(first).not.toContain("a-long-test-password");
    expect(first).not.toBe(second);
    expect(await verifyPassword("a-long-test-password", first)).toBe(true);
  });

  it("rejects incorrect passwords and malformed hashes", async () => {
    const hash = await hashPassword("correct-password");

    expect(await verifyPassword("incorrect-password", hash)).toBe(false);
    expect(await verifyPassword("correct-password", "broken")).toBe(false);
  });
});

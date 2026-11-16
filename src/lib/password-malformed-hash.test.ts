import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hash validation", () => {
  const salt = "a".repeat(32);
  const key = "b".repeat(128);

  it.each([
    ["empty hash", ""],
    ["missing separator", `${salt}${key}`],
    ["missing salt", `:${key}`],
    ["missing key", `${salt}:`],
    ["short salt", `${salt.slice(1)}:${key}`],
    ["long salt", `${salt}a:${key}`],
    ["short key", `${salt}:${key.slice(1)}`],
    ["long key", `${salt}:${key}b`],
  ])("rejects %s without throwing", async (_description, storedHash) => {
    await expect(verifyPassword("test", storedHash)).resolves.toBe(false);
  });

  it.each([":", ":extra"])("rejects a valid hash with suffix %s", async (suffix) => {
    const password = "strong-password-123";
    const hash = await hashPassword(password);

    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword(password, `${hash}${suffix}`)).resolves.toBe(false);
  });

  it("rejects malformed hex hashes without throwing", async () => {
    await expect(verifyPassword("test", "a".repeat(32) + ":" + "z".repeat(128))).resolves.toBe(false);
  });
  it("rejects malformed salts without throwing", async () => {
    await expect(verifyPassword("test", "invalid-salt:" + "a".repeat(128))).resolves.toBe(false);
  });
  it("continues to verify valid hashes", async () => {
    const hash = await hashPassword("strong-password-123");
    await expect(verifyPassword("strong-password-123", hash)).resolves.toBe(true);
  });
});

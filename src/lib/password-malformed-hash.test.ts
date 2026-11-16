import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";
describe("password hash validation", () => {
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

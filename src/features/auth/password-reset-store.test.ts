import { describe, expect, it, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn(), updateMany: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { passwordResetToken: { create: mocks.create }, $transaction: mocks.transaction } }));
import { storePasswordResetToken, consumePasswordResetToken } from "./password-reset-store";
describe("password reset token persistence", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("stores only a hash with a one-hour expiration", async () => {
    mocks.create.mockResolvedValue({});
    const raw = await storePasswordResetToken("user-1");
    expect(raw).toMatch(/^[a-f0-9]{64}$/);
    const data = mocks.create.mock.calls[0][0].data;
    expect(data.userId).toBe("user-1");
    expect(data.tokenHash).not.toBe(raw);
    expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(data.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 3600000);
  });
  it("claims a valid token only once in a transaction", async () => {
    mocks.transaction.mockImplementation(async (fn) => fn({ passwordResetToken: {
      findUnique: vi.fn().mockResolvedValue({ id: "reset-1", userId: "user-1", expiresAt: new Date(Date.now() + 60000), usedAt: null }),
      updateMany: mocks.updateMany,
    }}));
    mocks.updateMany.mockResolvedValue({ count: 1 });
    await expect(consumePasswordResetToken("a".repeat(64))).resolves.toBe("user-1");
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ usedAt: null }), data: { usedAt: expect.any(Date) } }));
  });
  it("rejects expired tokens", async () => {
    mocks.transaction.mockImplementation(async (fn) => fn({ passwordResetToken: {
      findUnique: vi.fn().mockResolvedValue({ id: "reset-1", userId: "user-1", expiresAt: new Date(Date.now() - 60000), usedAt: null }),
      updateMany: mocks.updateMany,
    }}));
    await expect(consumePasswordResetToken("a".repeat(64))).rejects.toThrow("Invalid or expired reset token.");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});

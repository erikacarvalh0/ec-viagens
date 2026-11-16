import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: { findUniqueOrThrow: vi.fn(), updateMany: vi.fn() },
  token: { findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  transaction: vi.fn(), send: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("./email-verification-email", () => ({ sendVerificationEmail: mocks.send }));
import { completeEmailVerification, requestEmailVerification } from "./email-verification";

const token = "a".repeat(64);
const now = new Date("2026-11-16T12:00:00Z");

describe("email verification", () => {
  afterEach(() => vi.useRealTimers());
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    mocks.transaction.mockImplementation(async (fn) => fn({ user: mocks.user, emailVerificationToken: mocks.token }));
    mocks.user.findUniqueOrThrow.mockResolvedValue({ email: "ana@example.com", emailVerifiedAt: null });
    mocks.user.updateMany.mockResolvedValue({ count: 1 });
    mocks.token.findUnique.mockResolvedValue({ id: "t1", userId: "u1", email: "ana@example.com", usedAt: null, expiresAt: new Date(now.getTime() + 1) });
    mocks.token.updateMany.mockResolvedValue({ count: 1 });
  });
  it("sends to the stored address and persists only a hash for exactly one hour", async () => {
    await requestEmailVerification("u1");
    const raw = mocks.send.mock.calls[0][1];
    expect(mocks.send).toHaveBeenCalledWith("ana@example.com", expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(mocks.token.create).toHaveBeenCalledWith({ data: {
      userId: "u1", email: "ana@example.com", tokenHash: expect.any(String), expiresAt: new Date(now.getTime() + 3600000),
    } });
    expect(mocks.token.create.mock.calls[0][0].data.tokenHash).not.toBe(raw);
  });
  it("does not resend for verified users", async () => {
    mocks.user.findUniqueOrThrow.mockResolvedValue({ emailVerifiedAt: now });
    await requestEmailVerification("u1");
    expect(mocks.token.create).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("enforces the resend cooldown", async () => {
    mocks.token.findFirst.mockResolvedValue({ id: "recent" });
    await expect(requestEmailVerification("u1")).rejects.toThrow();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("reports delivery failure without changing previous links", async () => {
    mocks.send.mockRejectedValue(new Error("offline"));
    await expect(requestEmailVerification("u1")).rejects.toThrow("offline");
    expect(mocks.token.updateMany).not.toHaveBeenCalled();
  });
  it("claims a token and verifies its original email in the same transaction", async () => {
    await completeEmailVerification("u1", token);
    expect(mocks.token.updateMany).toHaveBeenCalledWith({
      where: { id: "t1", userId: "u1", usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now },
    });
    expect(mocks.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u1", email: "ana@example.com", emailVerifiedAt: null }, data: { emailVerifiedAt: now },
    });
  });
  it.each([
    null,
    { userId: "other", expiresAt: new Date(now.getTime() + 1) },
    { userId: "u1", usedAt: now, expiresAt: new Date(now.getTime() + 1) },
    { userId: "u1", expiresAt: now },
    { userId: "u1", expiresAt: new Date(now.getTime() - 1) },
  ])("rejects missing, foreign, used and expired tokens: %j", async (stored) => {
    mocks.token.findUnique.mockResolvedValue(stored);
    await expect(completeEmailVerification("u1", token)).rejects.toThrow();
    expect(mocks.token.updateMany).not.toHaveBeenCalled();
    expect(mocks.user.updateMany).not.toHaveBeenCalled();
  });
  it("rejects malformed tokens before touching the database", async () => {
    await expect(completeEmailVerification("u1", "bad")).rejects.toThrow();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects a concurrent claim before updating the account", async () => {
    mocks.token.updateMany.mockResolvedValue({ count: 0 });
    await expect(completeEmailVerification("u1", token)).rejects.toThrow();
    expect(mocks.user.updateMany).not.toHaveBeenCalled();
  });
  it("rolls back when the account email has changed or is already verified", async () => {
    mocks.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(completeEmailVerification("u1", token)).rejects.toThrow("Email already verified or changed.");
  });
});

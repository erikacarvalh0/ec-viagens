import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
 findUnique: vi.fn(),
 store: vi.fn(),
 deliver: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock("./password-reset-store", () => ({ storePasswordResetToken: mocks.store }));
import { requestPasswordReset } from "./password-reset-request";

describe("requestPasswordReset", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  mocks.store.mockResolvedValue("a".repeat(64));
  mocks.deliver.mockResolvedValue(undefined);
 });
 it("normalizes email and delivers a token only for existing users", async () => {
  mocks.findUnique.mockResolvedValue({id:"user-1",email:"user@example.com"});
  await requestPasswordReset({email:" USER@EXAMPLE.COM "},mocks.deliver);
  expect(mocks.findUnique).toHaveBeenCalledWith({where:{email:"user@example.com"},select:{id:true,email:true}});
  expect(mocks.store).toHaveBeenCalledWith("user-1");
  expect(mocks.deliver).toHaveBeenCalledWith("user@example.com","a".repeat(64));
 });
 it("does not create or send tokens for unknown addresses", async () => {
  mocks.findUnique.mockResolvedValue(null);
  await expect(requestPasswordReset({email:"unknown@example.com"},mocks.deliver)).resolves.toBeUndefined();
  expect(mocks.store).not.toHaveBeenCalled();
  expect(mocks.deliver).not.toHaveBeenCalled();
 });
 it("rejects malformed addresses without database access", async () => {
  await expect(requestPasswordReset({email:"invalid"},mocks.deliver)).rejects.toThrow();
  expect(mocks.findUnique).not.toHaveBeenCalled();
 });
});

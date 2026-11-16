import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ transaction: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(), userUpdate: vi.fn(), hashPassword: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/lib/password", () => ({ hashPassword: mocks.hashPassword }));
import { completePasswordReset } from "./password-reset-complete";

describe("complete password reset", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  mocks.hashPassword.mockResolvedValue("new-hash");
  mocks.transaction.mockImplementation(async (fn) => fn({ passwordResetToken: { findUnique: mocks.findUnique, updateMany: mocks.updateMany }, user: { update: mocks.userUpdate } }));
  mocks.findUnique.mockResolvedValue({id:"reset-1",userId:"user-1",usedAt:null,expiresAt:new Date(Date.now()+60000)});
  mocks.updateMany.mockResolvedValue({count:1});
 });
 it("updates the password and consumes the token atomically", async () => {
  await completePasswordReset({token:"a".repeat(64),password:"secure-password-123"});
  expect(mocks.userUpdate).toHaveBeenCalledWith({where:{id:"user-1"},data:{passwordHash:"new-hash"}});
  expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({usedAt:null}),data:{usedAt:expect.any(Date)}}));
  expect(mocks.transaction).toHaveBeenCalledTimes(1);
 });
 it("does not change the password for an expired token", async () => {
  mocks.findUnique.mockResolvedValue({id:"reset-1",userId:"user-1",usedAt:null,expiresAt:new Date(Date.now()-1000)});
  await expect(completePasswordReset({token:"a".repeat(64),password:"secure-password-123"})).rejects.toThrow("Invalid or expired reset token.");
  expect(mocks.userUpdate).not.toHaveBeenCalled();
 });
 it("rejects concurrent token reuse without changing the password", async () => {
  mocks.updateMany.mockResolvedValue({count:0});
  await expect(completePasswordReset({token:"a".repeat(64),password:"secure-password-123"})).rejects.toThrow("Invalid or expired reset token.");
  expect(mocks.userUpdate).not.toHaveBeenCalled();
 });
 it("rejects weak passwords before accessing the database", async () => {
  await expect(completePasswordReset({token:"a".repeat(64),password:"short"})).rejects.toThrow();
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
});

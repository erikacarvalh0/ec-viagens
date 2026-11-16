import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
 findUnique: vi.fn(),
 findFirst: vi.fn(),
 store: vi.fn(),
 deliver: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
 user: { findUnique: mocks.findUnique },
 passwordResetToken: { findFirst: mocks.findFirst },
} }));
vi.mock("./password-reset-store", () => ({ storePasswordResetToken: mocks.store }));
import { requestPasswordReset } from "./password-reset-request";

describe("password reset request cooldown", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  mocks.findUnique.mockResolvedValue({id:"user-1",email:"user@example.com"});
  mocks.store.mockResolvedValue("a".repeat(64));
  mocks.deliver.mockResolvedValue(undefined);
 });
 it("suppresses requests when a token was recently created", async () => {
  mocks.findFirst.mockResolvedValue({id:"recent-token"});
  await requestPasswordReset({email:"user@example.com"},mocks.deliver);
  expect(mocks.store).not.toHaveBeenCalled();
  expect(mocks.deliver).not.toHaveBeenCalled();
  expect(mocks.findFirst).toHaveBeenCalledWith({
   where:{userId:"user-1",createdAt:{gt:expect.any(Date)}},
   select:{id:true},
  });
 });
 it("allows requests after cooldown", async () => {
  mocks.findFirst.mockResolvedValue(null);
  await requestPasswordReset({email:"user@example.com"},mocks.deliver);
  expect(mocks.store).toHaveBeenCalledWith("user-1");
  expect(mocks.deliver).toHaveBeenCalledOnce();
 });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({request:vi.fn(),deliver:vi.fn()}));
vi.mock("./password-reset-request", () => ({requestPasswordReset:mocks.request}));
vi.mock("./password-reset-email", () => ({sendPasswordResetEmail:mocks.deliver}));
import { requestPasswordResetByEmail } from "./password-reset-orchestrator";

describe("password reset email orchestration", () => {
 beforeEach(() => {vi.clearAllMocks();mocks.request.mockResolvedValue(undefined);});
 it("connects the reset request service to the configured email adapter", async () => {
  await requestPasswordResetByEmail({email:"person@example.com"});
  expect(mocks.request).toHaveBeenCalledWith({email:"person@example.com"},mocks.deliver);
 });
 it("propagates provider errors for internal monitoring", async () => {
  mocks.request.mockRejectedValue(new Error("delivery failed"));
  await expect(requestPasswordResetByEmail({email:"person@example.com"})).rejects.toThrow("delivery failed");
 });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
const complete = vi.hoisted(() => vi.fn());
vi.mock("./password-reset-complete", () => ({ completePasswordReset: complete }));
import { confirmPasswordReset } from "./password-reset-actions";

describe("confirmPasswordReset", () => {
 beforeEach(() => complete.mockReset());
 it("rejects mismatched passwords before accessing storage", async () => {
  const data = new FormData();
  data.set("token", "a".repeat(64));
  data.set("password", "a-secure-password");
  data.set("confirmPassword", "another-secure-password");
  await expect(confirmPasswordReset({error:"",success:false},data)).resolves.toMatchObject({success:false});
  expect(complete).not.toHaveBeenCalled();
 });
 it("confirms valid matching passwords", async () => {
  const data = new FormData();
  data.set("token", "a".repeat(64));
  data.set("password", "a-secure-password");
  data.set("confirmPassword", "a-secure-password");
  complete.mockResolvedValue(undefined);
  await expect(confirmPasswordReset({error:"",success:false},data)).resolves.toEqual({error:"",success:true});
  expect(complete).toHaveBeenCalledWith({token:"a".repeat(64),password:"a-secure-password"});
 });
 it("does not expose token validation details", async () => {
  const data = new FormData();
  data.set("token","a".repeat(64));
  data.set("password","a-secure-password");
  data.set("confirmPassword","a-secure-password");
  complete.mockImplementationOnce(async () => { throw new Error("Invalid or expired reset token."); });
  const result = await confirmPasswordReset({error:"",success:false},data);
  expect(result.error).not.toContain("a".repeat(64));
  expect(result.success).toBe(false);
 });
});

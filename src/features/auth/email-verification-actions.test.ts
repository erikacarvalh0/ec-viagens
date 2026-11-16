import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), request: vi.fn(), complete: vi.fn() }));
vi.mock("@/lib/session", () => ({ requireUserId: mocks.requireUser }));
vi.mock("./email-verification", () => ({ requestEmailVerification: mocks.request, completeEmailVerification: mocks.complete }));
import { confirmVerification, sendVerification } from "./email-verification-actions";
const initial = { message: "", success: false };
describe("verification action authorization", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.requireUser.mockResolvedValue("session-user"); });
  it("uses the session identity for sending and confirmation", async () => {
    const form = new FormData();
    form.set("userId", "victim");
    form.set("email", "victim@example.com");
    form.set("token", "a".repeat(64));
    expect((await sendVerification(initial)).success).toBe(true);
    expect((await confirmVerification(initial, form)).success).toBe(true);
    expect(mocks.request).toHaveBeenCalledWith("session-user");
    expect(mocks.complete).toHaveBeenCalledWith("session-user", "a".repeat(64));
  });
  it("requires authentication for both actions", async () => {
    mocks.requireUser.mockRejectedValue(new Error("login redirect"));
    await expect(sendVerification(initial)).rejects.toThrow("login redirect");
    await expect(confirmVerification(initial, new FormData())).rejects.toThrow("login redirect");
    expect(mocks.request).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("returns safe errors for delivery and confirmation failures", async () => {
    mocks.request.mockRejectedValue(new Error("private"));
    mocks.complete.mockRejectedValue(new Error("private"));
    expect(await sendVerification(initial)).toEqual({ success: false, message: expect.not.stringContaining("private") });
    expect(await confirmVerification(initial, new FormData())).toEqual({ success: false, message: expect.not.stringContaining("private") });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 userId: vi.fn(), update: vi.fn(), updateMany: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/lib/session", () => ({requireUserId:mocks.userId}));
vi.mock("@/lib/prisma", () => ({prisma:{
 user:{update:mocks.update},notification:{updateMany:mocks.updateMany},
}}));
vi.mock("next/cache", () => ({revalidatePath:mocks.revalidate}));
import { updateReminderConsent } from "./consent";

describe("revoking WhatsApp reminder consent", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  mocks.userId.mockResolvedValue("user-1");
  mocks.update.mockResolvedValue({});
  mocks.updateMany.mockResolvedValue({count:2});
 });
 it("cancels queued reminders for the authenticated user's WhatsApp number", async () => {
  mocks.update.mockResolvedValue({whatsapp:"5511999999999"});
  const result = await updateReminderConsent(false);
  expect(result.success).toBe(true);
  expect(mocks.updateMany).toHaveBeenCalledWith({
   where:{kind:"PAYMENT_REMINDER",status:"PENDING",recipientWhatsapp:"5511999999999"},
   data:{status:"CANCELLED"},
  });
 });
 it("does not cancel unrelated reminders when opting in", async () => {
  await updateReminderConsent(true);
  expect(mocks.updateMany).not.toHaveBeenCalled();
 });
 it("does not run a broad cancellation when no WhatsApp number is present", async () => {
  mocks.update.mockResolvedValue({whatsapp:null});
  await updateReminderConsent(false);
  expect(mocks.updateMany).not.toHaveBeenCalled();
 });
});

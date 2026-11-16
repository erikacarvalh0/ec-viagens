import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userId: vi.fn(),
  update: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ requireUserId: mocks.userId }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { update: mocks.update } } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { updateProfile } from "./profile";

describe("member profile", () => {
  beforeEach(() => {
    mocks.userId.mockResolvedValue("user-1");
    mocks.update.mockResolvedValue({ id: "user-1" });
  });

  it("updates only the authenticated user's profile", async () => {
    await expect(updateProfile({ name: "Ana", city: "São Paulo", state: "SP", whatsapp: "5511999999999" }))
      .resolves.toEqual({ success: true, error: "" });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Ana", city: "São Paulo", state: "SP", whatsapp: "5511999999999" },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/settings/profile");
  });

  it("allows clearing optional fields", async () => {
    await updateProfile({ name: "Ana", city: "", state: "", whatsapp: "" });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Ana", city: null, state: null, whatsapp: null },
    });
  });

  it("rejects invalid WhatsApp numbers", async () => {
    const result = await updateProfile({ name: "Ana", city: "", state: "", whatsapp: "abc" });
    expect(result.error).toBeTruthy();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects missing names", async () => {
    const result = await updateProfile({ name: "", city: "", state: "", whatsapp: "" });
    expect(result.error).toBeTruthy();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated updates", async () => {
    mocks.userId.mockRejectedValue(new Error("Unauthorized"));
    const result = await updateProfile({ name: "Ana", city: "", state: "", whatsapp: "" });
    expect(result.error).toBeTruthy();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUserId: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  count: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireUserId: mocks.requireUserId,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripMember: { findUnique: mocks.findUnique },
    $transaction: mocks.transaction,
  },
}));

import {
  changeMemberRole,
  requireTripAdmin,
  requireTripMember,
} from "./permissions";

describe("trip permissions", () => {
  beforeEach(() => {
    mocks.requireUserId.mockResolvedValue("user-a");
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        tripMember: {
          findFirst: mocks.findFirst,
          findUnique: mocks.findUnique,
          count: mocks.count,
          update: mocks.update,
        },
      }),
    );
  });

  it("rejects a user without a trip membership", async () => {
    mocks.findUnique.mockResolvedValue(null);

    await expect(requireTripMember("trip-a")).rejects.toThrow(
      "Trip not found or access denied.",
    );
  });

  it("rejects a regular member trying to manage a trip", async () => {
    mocks.findUnique.mockResolvedValue({ id: "actor", role: "MEMBER" });

    await expect(requireTripAdmin("trip-a")).rejects.toThrow(
      "Administrator permissions required.",
    );
  });

  it("promotes a member when an administrator requests it", async () => {
    mocks.findUnique.mockResolvedValue({ id: "actor", role: "ADMIN" });
    mocks.findFirst.mockResolvedValue({ id: "target", role: "MEMBER" });

    await changeMemberRole("trip-a", "target", "ADMIN");

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "target" },
      data: { role: "ADMIN" },
    });
  });

  it("does not demote the last administrator", async () => {
    mocks.findUnique.mockResolvedValue({ id: "actor", role: "ADMIN" });
    mocks.findFirst.mockResolvedValue({ id: "target", role: "ADMIN" });
    mocks.count.mockResolvedValue(1);

    await expect(
      changeMemberRole("trip-a", "target", "MEMBER"),
    ).rejects.toThrow("A trip must have at least one administrator.");

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("allows demotion when another administrator remains", async () => {
    mocks.findUnique.mockResolvedValue({ id: "actor", role: "ADMIN" });
    mocks.findFirst.mockResolvedValue({ id: "target", role: "ADMIN" });
    mocks.count.mockResolvedValue(2);

    await changeMemberRole("trip-a", "target", "MEMBER");

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "target" },
      data: { role: "MEMBER" },
    });
  });

  it("rejects cross-trip member changes", async () => {
    mocks.findUnique.mockResolvedValue({ id: "actor", role: "ADMIN" });
    mocks.findFirst.mockResolvedValue(null);

    await expect(
      changeMemberRole("trip-a", "member-from-trip-b", "ADMIN"),
    ).rejects.toThrow("Member not found.");

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rechecks actor permissions before changing a role", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({ id: "actor", role: "ADMIN" })
      .mockResolvedValueOnce({ id: "actor", role: "MEMBER" });
    mocks.findFirst.mockResolvedValue({ id: "target", role: "MEMBER" });

    await expect(
      changeMemberRole("trip-a", "target", "ADMIN"),
    ).rejects.toThrow("Administrator permissions required.");

    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects idempotent requests after actor permissions are revoked", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({ id: "actor", role: "ADMIN" })
      .mockResolvedValueOnce({ id: "actor", role: "MEMBER" });
    mocks.findFirst.mockResolvedValue({ id: "target", role: "ADMIN" });
    await expect(changeMemberRole("trip-a", "target", "ADMIN")).rejects.toThrow("Administrator permissions required.");
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

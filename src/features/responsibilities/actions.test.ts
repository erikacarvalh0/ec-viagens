import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTripAdmin: vi.fn(),
  findFirst: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/members/permissions", () => ({
  requireTripAdmin: mocks.requireTripAdmin,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tripMember: { findFirst: mocks.findFirst },
    memberTitle: {
      upsert: mocks.upsert,
      deleteMany: mocks.deleteMany,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  assignResponsibility,
  removeResponsibility,
} from "./actions";

describe("trip-scoped responsibilities", () => {
  beforeEach(() => {
    mocks.requireTripAdmin.mockResolvedValue({ id: "admin" });
    mocks.findFirst.mockResolvedValue({ id: "member-a", tripId: "trip-a" });
  });

  it("allows an admin to assign an organizer title", async () => {
    const result = await assignResponsibility(
      "trip-a",
      "member-a",
      { error: "" },
      { title: "ORGANIZER", description: "Planeja a programação." },
    );

    expect(result.error).toBe("");
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: {
        memberId_title: { memberId: "member-a", title: "ORGANIZER" },
        member: { tripId: "trip-a" },
      },
      create: {
        memberId: "member-a",
        title: "ORGANIZER",
        description: "Planeja a programação.",
      },
      update: { description: "Planeja a programação." },
    });
  });

  it("rejects assignment when actor is not an admin", async () => {
    mocks.requireTripAdmin.mockRejectedValue(new Error("Forbidden"));

    const result = await assignResponsibility(
      "trip-a",
      "member-a",
      { error: "" },
      { title: "ORGANIZER", description: "" },
    );

    expect(result.error).not.toBe("");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("does not assign a title to a member of another trip", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const result = await assignResponsibility(
      "trip-a",
      "member-from-trip-b",
      { error: "" },
      { title: "VAN_COORDINATOR", description: "" },
    );

    expect(result.error).not.toBe("");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("does not remove a title when the actor is not an admin", async () => {
    mocks.requireTripAdmin.mockRejectedValueOnce(new Error("Forbidden"));
    const result = await removeResponsibility("trip-a", "member-a", { error: "" }, "ORGANIZER");
    expect(result.error).not.toBe("");
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("does not remove a title from another trip", async () => {
    mocks.findFirst.mockResolvedValueOnce(null);
    const result = await removeResponsibility("trip-a", "member-from-trip-b", { error: "" }, "ORGANIZER");
    expect(result.error).not.toBe("");
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("removes only the selected member title", async () => {
    const result = await removeResponsibility(
      "trip-a",
      "member-a",
      { error: "" },
      "ORGANIZER",
    );

    expect(result.error).toBe("");
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        memberId: "member-a",
        title: "ORGANIZER",
        member: { tripId: "trip-a" },
      },
    });
  });
});

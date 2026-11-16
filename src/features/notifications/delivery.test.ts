import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  updateMany: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { notification: {
    findFirst: mocks.findFirst,
    updateMany: mocks.updateMany,
  } },
}));

import { reconcileWhatsAppStatuses } from "./delivery";

const event = (status: string) => ({
  entry: [{
    changes: [{
      field: "messages",
      value: { statuses: [{ id: "wamid.1", status }] },
    }],
  }],
});

describe("WhatsApp delivery receipts", () => {
  beforeEach(() => {
    mocks.findFirst.mockResolvedValue({
      id: "notification-1",
      status: "SENT",
      providerMessageId: "wamid.1",
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("marks delivered messages", async () => {
    expect(await reconcileWhatsAppStatuses(event("delivered"))).toBe(1);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "notification-1", status: { in: ["SENT"] } },
      data: { status: "DELIVERED" },
    });
  });

  it("does not downgrade read messages to delivered", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "notification-1",
      status: "READ",
    });
    expect(await reconcileWhatsAppStatuses(event("delivered"))).toBe(0);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("marks read messages", async () => {
    expect(await reconcileWhatsAppStatuses(event("read"))).toBe(1);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "notification-1",
        status: { in: ["SENT", "DELIVERED"] },
      },
      data: { status: "READ" },
    });
  });

  it("ignores unknown message IDs", async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect(await reconcileWhatsAppStatuses(event("failed"))).toBe(0);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("marks provider failures for review", async () => {
    expect(await reconcileWhatsAppStatuses(event("failed"))).toBe(1);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "notification-1",
        status: { in: ["SENT"] },
      },
      data: { status: "REVIEW_REQUIRED" },
    });
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ dispatch: vi.fn() }));
vi.mock("@/features/notifications/dispatch", () => ({
  dispatchDuePaymentReminders: mocks.dispatch,
}));

import { GET } from "./route";

afterEach(() => vi.unstubAllEnvs());

describe("payment reminder cron", () => {
  it("rejects missing configuration", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const response = await GET(new Request("http://localhost/api/cron/payment-reminders"));
    expect(response.status).toBe(503);
  });

  it("rejects unauthorized calls", async () => {
    vi.stubEnv("CRON_SECRET", "expected");
    const response = await GET(new Request("http://localhost/api/cron/payment-reminders"));
    expect(response.status).toBe(401);
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });

  it("dispatches when authorized", async () => {
    vi.stubEnv("CRON_SECRET", "expected");
    mocks.dispatch.mockResolvedValue({ processed: 0 });
    const response = await GET(new Request("http://localhost/api/cron/payment-reminders", {
      headers: { Authorization: "Bearer expected" },
    }));
    expect(response.status).toBe(200);
    expect(mocks.dispatch).toHaveBeenCalledOnce();
  });
});

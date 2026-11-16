import { randomUUID } from "node:crypto";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { revalidatePath } from "next/cache";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ userId: "" }));
vi.mock("@/lib/session", () => ({
  requireUserId: async () => session.userId,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import TripPaymentsPage from "@/app/trips/[tripId]/payments/page";
import { POST } from "@/app/api/webhooks/asaas/route";
import { issueCharge } from "@/features/payments/charges";
import { prisma } from "@/lib/prisma";

describe.skipIf(process.env.RUN_POSTGRES_INTEGRATION !== "1")("payment lifecycle with a simulated Asaas provider", () => {
  const suffix = randomUUID();
  const paymentId = `pay_${suffix}`;
  const paymentUrl = `https://sandbox.asaas.com/i/${suffix}`;
  let tripId = "";
  let adminId = "";
  let participantId = "";
  let memberId = "";
  let planId = "";

  beforeAll(async () => {
    // The page and design-system JSX use Next's automatic JSX transform in production.
    vi.stubGlobal("React", React);
    vi.stubEnv("ASAAS_API_KEY", "integration-test-key");
    vi.stubEnv("ASAAS_ENVIRONMENT", "sandbox");
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "integration-test-token");
    const admin = await prisma.user.create({ data: {
      name: "Finance Admin", email: `admin-${suffix}@example.test`, passwordHash: "test-only",
    } });
    adminId = admin.id;
    const participant = await prisma.user.create({ data: {
      name: "Finance Participant", email: `participant-${suffix}@example.test`, passwordHash: "test-only",
    } });
    participantId = participant.id;
    const trip = await prisma.trip.create({ data: { name: "Finance integration" } });
    tripId = trip.id;
    await prisma.tripMember.create({ data: { tripId, userId: adminId, role: "ADMIN" } });
    const member = await prisma.tripMember.create({ data: { tripId, userId: participantId } });
    memberId = member.id;
    const plan = await prisma.paymentPlan.create({ data: { tripId, name: "Parcela integração", amountCents: 12550 } });
    planId = plan.id;
  });

  afterAll(async () => {
    try {
      // Remove plans (and their charges/events) before memberships.
      if (tripId) {
        await prisma.paymentPlan.deleteMany({ where: { tripId } });
        await prisma.trip.delete({ where: { id: tripId } });
      }
      await prisma.user.deleteMany({ where: { id: { in: [adminId, participantId].filter(Boolean) } } });
    } finally {
      await prisma.$disconnect();
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });

  it("issues a charge, records the authenticated callback once and renders the updated participant balance", async () => {
    const provider = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({ access_token: "integration-test-key" });
      const body = JSON.parse(String(init?.body));
      if (String(url) === "https://api-sandbox.asaas.com/v3/customers") {
        expect(body).toEqual({ name: "Finance Participant", email: `participant-${suffix}@example.test` });
        return Response.json({ id: `cus_${suffix}` });
      }
      expect(String(url)).toBe("https://api-sandbox.asaas.com/v3/payments");
      const charge = await prisma.charge.findUniqueOrThrow({ where: { id: body.externalReference } });
      expect(charge).toMatchObject({ memberId, paymentPlanId: planId, amountCents: 12550, status: "PENDING" });
      expect(body).toEqual({
        customer: `cus_${suffix}`, value: 125.5, dueDate: "2027-03-10",
        externalReference: charge.id, billingType: "UNDEFINED",
      });
      return Response.json({ id: paymentId, invoiceUrl: paymentUrl });
    });
    vi.stubGlobal("fetch", provider);
    session.userId = adminId;
    const form = new FormData();
    form.set("planId", planId);
    form.set("memberId", memberId);
    form.set("dueAt", "2027-03-10");
    expect(await issueCharge(tripId, { error: "" }, form)).toEqual({ error: "", success: true });
    expect(revalidatePath).toHaveBeenCalledWith(`/trips/${tripId}/payments`);
    expect(provider).toHaveBeenCalledTimes(2);
    const charge = await prisma.charge.findUniqueOrThrow({ where: { asaasPaymentId: paymentId } });
    expect(charge.paymentUrl).toBe(paymentUrl);

    session.userId = participantId;
    const renderPage = async () => renderToStaticMarkup(await TripPaymentsPage({ params: Promise.resolve({ tripId }) }));
    const pendingHtml = await renderPage();
    expect(pendingHtml).toContain("PENDING");
    expect(pendingHtml).toContain(`href="${paymentUrl}"`);
    expect(pendingHtml).toContain("0 de 1 cobranças pagas");

    const event = {
      id: `evt_${suffix}`, event: "PAYMENT_RECEIVED",
      payment: { id: paymentId, externalReference: charge.id, paymentDate: "2027-03-09" },
    };
    const callback = (token: string) => POST(new Request("http://localhost/api/webhooks/asaas", {
      method: "POST", headers: { "Content-Type": "application/json", "asaas-access-token": token },
      body: JSON.stringify(event),
    }));
    expect((await callback("invalid-token")).status).toBe(401);
    expect(await prisma.paymentEvent.count({ where: { chargeId: charge.id } })).toBe(0);
    const response = await callback("integration-test-token");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: "processed" });
    const replay = await callback("integration-test-token");
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual({ result: "duplicate" });
    expect(await prisma.paymentEvent.findMany({ where: { chargeId: charge.id } })).toEqual([
      expect.objectContaining({ externalEventId: event.id, eventType: event.event, payload: event }),
    ]);
    expect(await prisma.charge.findUniqueOrThrow({ where: { id: charge.id } })).toMatchObject({
      status: "PAID", paidAt: new Date("2027-03-09"),
    });
    const paidHtml = await renderPage();
    expect(paidHtml).toContain("PAID");
    expect(paidHtml).not.toContain("PENDING");
    expect(paidHtml).toContain("1 de 1 cobranças pagas");
    expect(paidHtml).toContain(`href="${paymentUrl}"`);
  });
});

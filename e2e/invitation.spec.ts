import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, randomUUID } from "node:crypto";

test("only one of two authenticated users can redeem an invitation", async ({ browser }) => {
  test.setTimeout(90000);
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/ec_viagens_e2e") {
    throw new Error("Requires isolated local ec_viagens_e2e database.");
  }
  const db = new PrismaClient();
  const emails = [0, 1].map(() => `invite-${randomUUID()}@example.test`);
  const trip = await db.trip.create({ data: { name: "Concurrent invite E2E" } });
  const token = randomBytes(32).toString("hex");
  const pages = await Promise.all(emails.map(() => browser.newPage()));
  try {
    await db.invitation.create({ data: { tripId: trip.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 600000), whatsapp: "" } });
    for (const [i, page] of pages.entries()) {
      const base = "http://127.0.0.1:3100";
      await page.goto(base + "/register");
      await page.getByLabel("Nome").fill("Invite Browser Test");
      await page.getByLabel("E-mail").fill(emails[i]);
      await page.getByLabel("Senha").fill("invite-password-12345");
      await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
      await expect(page).toHaveURL(/\/login\?registered=1/);
      await page.getByLabel("E-mail").fill(emails[i]);
      await page.getByLabel("Senha").fill("invite-password-12345");
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await page.goto(base + "/invite/" + token);
      await expect(page.getByRole("button", { name: "Aceitar convite" })).toBeVisible();
    }
    await Promise.all(pages.map(page => page.getByRole("button", { name: "Aceitar convite" }).click()));
    await expect.poll(async () => db.tripMember.count({ where: { tripId: trip.id } })).toBe(1);
    await expect.poll(() => pages.filter(page => page.url().endsWith("/members")).length).toBe(1);
    const loser = pages.find(page => !page.url().endsWith("/members"))!;
    await expect(loser.locator("form").getByRole("alert")).toContainText("This invitation has expired, was used, or is invalid.");
    expect(await db.tripMember.count({ where: { tripId: trip.id } })).toBe(1);
  } finally {
    await Promise.all(pages.map(page => page.close()));
    await db.trip.delete({ where: { id: trip.id } });
    await db.user.deleteMany({ where: { email: { in: emails } } });
    await db.$disconnect();
  }
});

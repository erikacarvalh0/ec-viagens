import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("anonymous and unrelated authenticated users cannot access private photo APIs", async ({ page, request }) => {
  test.setTimeout(90000);
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/ec_viagens_e2e") {
    throw new Error("Requires isolated local ec_viagens_e2e database.");
  }
  const db = new PrismaClient();
  const email = `outsider-${randomUUID()}@example.test`;
  const trip = await db.trip.create({ data: { name: "Private API E2E" } });
  const endpoint = `/api/trips/${trip.id}/photos`;
  const photo = `${endpoint}/${randomUUID()}`;
  try {
    expect((await request.get(photo)).status()).toBe(403);
    expect((await request.post(endpoint)).status()).toBe(403);
    await page.goto("/register");
    await page.getByLabel("Nome").fill("Outside User");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill("outside-password-12345");
    await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?registered=1/);
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill("outside-password-12345");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    expect((await page.request.get(photo)).status()).toBe(403);
    expect((await page.request.post(endpoint)).status()).toBe(403);
  } finally {
    await db.trip.delete({ where: { id: trip.id } });
    await db.user.deleteMany({ where: { email } });
    await db.$disconnect();
  }
});

import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, randomUUID } from "node:crypto";

test("password reset revokes the previous session and consumes its token", async ({ page, browser }) => {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/ec_viagens_e2e") {
    throw new Error("Password reset E2E requires the isolated local ec_viagens_e2e database.");
  }
  const db = new PrismaClient();
  const email = `reset-${randomUUID()}@example.test`;
  const oldPassword = "old-password-12345";
  const newPassword = "new-password-12345";
  const token = randomBytes(32).toString("hex");
  const resetPage = await browser.newPage();
  try {
    await page.goto("/register");
    await page.getByLabel("Nome").fill("Reset Browser Test");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(oldPassword);
    await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?registered=1/);
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(oldPassword);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    await db.passwordResetToken.create({ data: {
      userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 600000),
    } });
    await resetPage.goto(`http://127.0.0.1:3100/reset-password?token=${token}`);
    const submit = async () => {
      await resetPage.getByLabel("Nova senha", { exact: true }).fill(newPassword);
      await resetPage.getByLabel("Confirme a senha").fill(newPassword);
      await resetPage.getByRole("button", { name: "Atualizar senha" }).click();
    };
    await submit();
    await expect(resetPage.getByRole("status")).toContainText("Senha atualizada.");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await resetPage.reload();
    await submit();
    await expect(resetPage.locator("form").getByRole("alert")).toContainText("Não foi possível redefinir a senha.");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(newPassword);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  } finally {
    await resetPage.close();
    await db.user.deleteMany({ where: { email } });
    await db.$disconnect();
  }
});

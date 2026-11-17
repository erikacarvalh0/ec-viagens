import { expect, test } from "@playwright/test";

test("anonymous visitors are redirected from dashboard to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
});

test("registration and login navigation preserve the safe callback", async ({ page }) => {
  await page.goto("/login?callbackUrl=%2Fdashboard");
  await page.getByRole("link", { name: "Cadastrar", exact: true }).click();
  await expect(page.getByLabel("Nome")).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
});

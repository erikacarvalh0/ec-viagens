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

test("registers, rejects invalid credentials, signs in and signs out", async ({ page }) => {
  const email = `e2e-${crypto.randomUUID()}@example.test`;
  const password = "e2e-password-12345";
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Browser Test");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?registered=1/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("wrong-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("E-mail ou senha inválidos.");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Nossas viagens" })).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
});

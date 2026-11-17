import { defineConfig } from "@playwright/test";

const database = new URL(process.env.DATABASE_URL ?? "postgresql://invalid/invalid");
if (!["localhost", "127.0.0.1"].includes(database.hostname) || database.pathname !== "/ec_viagens_e2e" || !["postgresql:", "postgres:"].includes(database.protocol)) {
  throw new Error("Playwright requires an isolated local ec_viagens_e2e database.");
}

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3100" },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: false,
    timeout: 120000,
    env: { AUTH_SECRET: "e2e-only-secret-not-for-production", AUTH_TRUST_HOST: "true" },
  },
});

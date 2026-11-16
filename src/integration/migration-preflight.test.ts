import { describe, expect, it } from "vitest";
import { checkMigrationBaseline } from "./migration-preflight";

describe("Prisma migration preflight", () => {
 it("rejects a migration history without an initial baseline", () => {
  expect(() => checkMigrationBaseline(["20261116000000_password_reset_tokens"])).toThrow("Initial database baseline migration missing.");
 });
 it("accepts a baseline before additive migrations", () => {
  expect(() => checkMigrationBaseline(["20261115000000_initial_baseline", "20261116000000_password_reset_tokens"])).not.toThrow();
 });
 it("rejects an additive migration before the baseline", () => {
  expect(() => checkMigrationBaseline(["20261116000000_password_reset_tokens", "20261117000000_initial_baseline"])).toThrow();
 });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkMigrationBaseline } from "./migration-preflight";

const baseline = readFileSync("prisma/migrations/20261115000000_initial_baseline/migration.sql","utf8");
const reset = readFileSync("prisma/migrations/20261116000000_password_reset_tokens/migration.sql","utf8");

describe("initial PostgreSQL baseline", () => {
 it("orders baseline before additive reset token migration", () => {
  expect(() => checkMigrationBaseline(["20261115000000_initial_baseline","20261116000000_password_reset_tokens"])).not.toThrow();
 });
 it("creates every original table and enum", () => {
  for(const name of ["User","Trip","TripMember","MemberTitle","TravelInfo","Invitation","PaymentPlan","Charge","PaymentEvent","Photo","Notification"]) {
   expect(baseline).toContain(`CREATE TABLE "${name}"`);
  }
  for(const name of ["MemberRole","TripTitle","ChargeStatus","InvitationStatus","Period"]) {
   expect(baseline).toContain(`CREATE TYPE "${name}"`);
  }
 });
 it("keeps password reset token creation in its additive migration", () => {
  expect(baseline).not.toContain('CREATE TABLE "PasswordResetToken"');
  expect(reset).toContain('CREATE TABLE "PasswordResetToken"');
 });
 it("preserves archived trip membership and important unique constraints", () => {
  expect(baseline).toContain('"archivedAt" TIMESTAMP(3)');
  expect(baseline).toContain('CREATE UNIQUE INDEX "TripMember_tripId_userId_key"');
  expect(baseline).toContain('ON DELETE CASCADE');
 });
});

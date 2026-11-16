import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const sql = readFileSync(join(process.cwd(), "prisma/migrations/20261116000000_password_reset_tokens/migration.sql"), "utf8");
describe("password reset token SQL migration", () => {
 it("creates the reset token table with required columns", () => {
  for (const column of ["id", "userId", "tokenHash", "expiresAt", "usedAt", "createdAt"]) {
   expect(sql).toContain('"' + column + '"');
  }
  expect(sql).toContain('CREATE TABLE "PasswordResetToken"');
 });
 it("enforces uniqueness, expiration lookup and cascade cleanup", () => {
  expect(sql).toContain('UNIQUE INDEX');
  expect(sql).toContain('("userId","expiresAt")');
  expect(sql).toContain("ON DELETE CASCADE");
 });
});

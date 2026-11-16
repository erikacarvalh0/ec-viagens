import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PostgreSQL migration integration workflow", () => {
 const workflow = readFileSync(".github/workflows/postgres-integration.yml", "utf8");
 it("deploys versioned migrations instead of pushing the schema", () => {
  expect(workflow).toContain("npx prisma migrate deploy");
  expect(workflow).not.toContain("npx prisma db push");
 });
 it("detects schema drift against Prisma after applying migrations", () => {
  expect(workflow).toContain("prisma migrate diff");
  expect(workflow).toContain("--from-url");
  expect(workflow).toContain("--to-schema-datamodel");
  expect(workflow).toContain("--exit-code");
 });
});

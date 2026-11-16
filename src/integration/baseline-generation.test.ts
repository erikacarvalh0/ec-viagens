import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const workflow = readFileSync(".github/workflows/generate-prisma-baseline.yml", "utf8");
describe("Prisma baseline generation workflow", () => {
 it("generates SQL from an empty schema using Prisma diff", () => {
  expect(workflow).toContain("prisma migrate diff");
  expect(workflow).toContain("--from-empty");
  expect(workflow).toContain("--to-schema-datamodel prisma/schema.prisma");
  expect(workflow).toContain("--script");
 });
 it("requires manual execution and publishes a reviewable artifact", () => {
  expect(workflow).toContain("workflow_dispatch:");
  expect(workflow).toContain("upload-artifact");
  expect(workflow).not.toContain("prisma migrate deploy");
  expect(workflow).not.toContain("prisma db push");
 });
});

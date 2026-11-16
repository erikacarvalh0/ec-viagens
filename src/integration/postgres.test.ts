import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const enabled = process.env.RUN_POSTGRES_INTEGRATION === "1";
describe.skipIf(!enabled)("PostgreSQL integration", () => {
  const db = new PrismaClient();
  const userId = "integration-" + process.pid + "-" + Date.now();
  beforeAll(async () => { await db.$connect(); });
  afterAll(async () => {
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });
  it("persists and retrieves user records", async () => {
    const user = await db.user.create({ data: {
      id: userId, name: "Integration Test",
      email: userId + "@example.test", passwordHash: "test-only",
    }});
    expect((await db.user.findUnique({ where: { id: user.id } }))?.email).toBe(user.email);
  });
  it("enforces unique email constraints", async () => {
    await expect(db.user.create({ data: {
      name: "Duplicate", email: userId + "@example.test", passwordHash: "test-only",
    }})).rejects.toMatchObject({ code: "P2002" });
  });
});

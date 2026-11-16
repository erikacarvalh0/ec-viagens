import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createPasswordResetToken, hashPasswordResetToken } from "@/features/auth/password-reset-token";
import { consumePasswordResetToken } from "@/features/auth/password-reset-store";

describe.skipIf(process.env.RUN_POSTGRES_INTEGRATION !== "1")("password reset PostgreSQL integration", () => {
 const db = new PrismaClient();
 let userId = "";
 let token = "";
 beforeAll(async () => {
  await db.$connect();
  const user = await db.user.create({ data: {
   name: "Reset Integration",
   email: "reset-" + process.pid + "-" + Date.now() + "@example.test",
   passwordHash: "test-only",
  }});
  userId = user.id;
  token = createPasswordResetToken();
  await db.passwordResetToken.create({data:{
   userId,tokenHash:hashPasswordResetToken(token),expiresAt:new Date(Date.now()+60000),
  }});
 });
 afterAll(async () => {
  if(userId) await db.user.delete({where:{id:userId}});
  await db.$disconnect();
 });
 it("consumes a token only once", async () => {
  await expect(consumePasswordResetToken(token)).resolves.toBe(userId);
  await expect(consumePasswordResetToken(token)).rejects.toThrow("Invalid or expired reset token.");
 });
 it("rejects an expired token", async () => {
  const expired = createPasswordResetToken();
  await db.passwordResetToken.create({data:{
   userId,tokenHash:hashPasswordResetToken(expired),expiresAt:new Date(Date.now()-60000),
  }});
  await expect(consumePasswordResetToken(expired)).rejects.toThrow("Invalid or expired reset token.");
 });
});

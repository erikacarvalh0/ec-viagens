import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { completePasswordReset } from "@/features/auth/password-reset-complete";
import { createPasswordResetToken, hashPasswordResetToken } from "@/features/auth/password-reset-token";
import { verifyPassword } from "@/lib/password";

describe.skipIf(process.env.RUN_POSTGRES_INTEGRATION !== "1")("password reset completion in PostgreSQL", () => {
 const db = new PrismaClient();
 let userId = "";
 beforeAll(async () => {
  await db.$connect();
  const user = await db.user.create({data:{
   name:"Reset Completion Test",
   email:"reset-completion-"+process.pid+"-"+Date.now()+"@example.test",
   passwordHash:"old-hash",
  }});
  userId = user.id;
 });
 afterAll(async () => {
  if (userId) await db.user.delete({where:{id:userId}});
  await db.$disconnect();
 });
 it("updates password and consumes token exactly once", async () => {
  const token = createPasswordResetToken();
  await db.passwordResetToken.create({data:{
   userId,tokenHash:hashPasswordResetToken(token),expiresAt:new Date(Date.now()+60000),
  }});
  await completePasswordReset({token,password:"secure-new-password-123"});
  const user = await db.user.findUniqueOrThrow({where:{id:userId}});
  expect(await verifyPassword("secure-new-password-123",user.passwordHash)).toBe(true);
  const stored = await db.passwordResetToken.findUniqueOrThrow({where:{tokenHash:hashPasswordResetToken(token)}});
  expect(stored.usedAt).toBeInstanceOf(Date);
  await expect(completePasswordReset({token,password:"another-secure-password-123"})).rejects.toThrow("Invalid or expired reset token.");
  expect((await db.user.findUniqueOrThrow({where:{id:userId}})).passwordHash).toBe(user.passwordHash);
 });
 it("does not change the password for expired tokens", async () => {
  const token = createPasswordResetToken();
  await db.passwordResetToken.create({data:{
   userId,tokenHash:hashPasswordResetToken(token),expiresAt:new Date(Date.now()-1000),
  }});
  const before = (await db.user.findUniqueOrThrow({where:{id:userId}})).passwordHash;
  await expect(completePasswordReset({token,password:"secure-new-password-456"})).rejects.toThrow("Invalid or expired reset token.");
  expect((await db.user.findUniqueOrThrow({where:{id:userId}})).passwordHash).toBe(before);
 });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const enabled = process.env.RUN_POSTGRES_INTEGRATION === "1";
describe.skipIf(!enabled)("trip membership integration", () => {
 const db = new PrismaClient();
 const suffix = String(process.pid) + "-" + String(Date.now());
 let userId = "";
 let tripId = "";
 beforeAll(async () => {
  await db.$connect();
  const user = await db.user.create({data:{name:"Member Test",email:"membership-"+suffix+"@example.test",passwordHash:"test-only"}});
  userId = user.id;
  const trip = await db.trip.create({data:{name:"History Test"}});
  tripId = trip.id;
 });
 afterAll(async () => {
  if (tripId) await db.trip.delete({where:{id:tripId}});
  if (userId) await db.user.delete({where:{id:userId}});
  await db.$disconnect();
 });
 it("retains membership access after archiving a trip", async () => {
  await db.tripMember.create({data:{tripId,userId,role:"MEMBER"}});
  await db.trip.update({where:{id:tripId},data:{archivedAt:new Date()}});
  const membership = await db.tripMember.findUnique({where:{tripId_userId:{tripId,userId}},include:{trip:true}});
  expect(membership?.trip.archivedAt).toBeInstanceOf(Date);
  expect(membership?.userId).toBe(userId);
 });
 it("enforces unique trip membership", async () => {
  await expect(db.tripMember.create({data:{tripId,userId,role:"MEMBER"}})).rejects.toMatchObject({code:"P2002"});
 });
 it("isolates memberships between trips", async () => {
  const otherTrip = await db.trip.create({data:{name:"Other Trip"}});
  try {
   expect(await db.tripMember.findUnique({where:{tripId_userId:{tripId:otherTrip.id,userId}}})).toBeNull();
   await db.tripMember.create({data:{tripId:otherTrip.id,userId,role:"ADMIN"}});
   const original = await db.tripMember.findUniqueOrThrow({where:{tripId_userId:{tripId,userId}}});
   const other = await db.tripMember.findUniqueOrThrow({where:{tripId_userId:{tripId:otherTrip.id,userId}}});
   expect(original.role).toBe("MEMBER");
   expect(other.role).toBe("ADMIN");
   expect(original.id).not.toBe(other.id);
  } finally {
   await db.trip.delete({where:{id:otherTrip.id}});
  }
 });
 it("allows only one concurrent membership creation for the same user and trip", async () => {
  const concurrentTrip = await db.trip.create({data:{name:"Concurrent Membership"}});
  try {
   const create = () => db.tripMember.create({data:{tripId:concurrentTrip.id,userId,role:"MEMBER"}});
   const results = await Promise.allSettled([create(),create()]);
   expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
   const rejected = results.find(result => result.status === "rejected");
   expect(rejected).toMatchObject({status:"rejected",reason:{code:"P2002"}});
   expect(await db.tripMember.count({where:{tripId:concurrentTrip.id,userId}})).toBe(1);
  } finally {
   await db.trip.delete({where:{id:concurrentTrip.id}});
  }
 });
});

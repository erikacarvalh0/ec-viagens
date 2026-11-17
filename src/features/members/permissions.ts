import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function requireTripMember(tripId: string) {
  const userId = await requireUserId();
  const member = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
    include: { trip: true },
  });

  if (!member) {
    throw new Error("Trip not found or access denied.");
  }

  return member;
}

export async function requireTripAdmin(tripId: string) {
  const member = await requireTripMember(tripId);

  if (member.role !== "ADMIN") {
    throw new Error("Administrator permissions required.");
  }

  return member;
}

export async function changeMemberRole(
  tripId: string,
  targetMemberId: string,
  nextRole: "ADMIN" | "MEMBER",
) {
  const actor = await requireTripAdmin(tripId);

  await prisma.$transaction(
    async (transaction) => {
      const target = await transaction.tripMember.findFirst({
        where: { id: targetMemberId, tripId },
      });

      if (!target) {
        throw new Error("Member not found.");
      }

      // Recheck the actor within the transaction to avoid stale permissions.
      const currentActor = await transaction.tripMember.findUnique({
        where: { id: actor.id },
      });

      if (currentActor?.role !== "ADMIN") {
        throw new Error("Administrator permissions required.");
      }

      if (target.role === nextRole) {
        return;
      }

      if (target.role === "ADMIN" && nextRole === "MEMBER") {
        const adminCount = await transaction.tripMember.count({
          where: { tripId, role: "ADMIN" },
        });

        if (adminCount <= 1) {
          throw new Error("A trip must have at least one administrator.");
        }
      }

      await transaction.tripMember.update({
        where: { id: target.id },
        data: { role: nextRole },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

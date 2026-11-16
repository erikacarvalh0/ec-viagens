"use server";

import { revalidatePath } from "next/cache";

import { requireTripAdmin } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

export async function setTripArchived(tripId: string, archived: boolean) {
  const actor = await requireTripAdmin(tripId);
  if (typeof archived !== "boolean") throw new Error("Invalid archive state.");
  const updated = await prisma.trip.updateMany({
    where: { id: tripId, memberships: { some: { userId: actor.userId, role: "ADMIN" } } },
    data: { archivedAt: archived ? new Date() : null },
  });
  if (updated.count === 0) throw new Error("Trip not found.");
  revalidatePath("/dashboard");
  revalidatePath(`/trips/${tripId}/overview`);
  return { success: true };
}

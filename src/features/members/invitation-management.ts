"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

import { requireTripAdmin } from "./permissions";

export async function revokeInvitation(tripId: string, invitationId: string) {
  await requireTripAdmin(tripId);
  const updated = await prisma.invitation.updateMany({
    where: { id: invitationId, tripId, status: "PENDING" },
    data: { status: "REVOKED" },
  });
  if (updated.count !== 1) throw new Error("No pending invitation found.");
  revalidatePath(`/trips/${tripId}/members`);
  return { success: true };
}

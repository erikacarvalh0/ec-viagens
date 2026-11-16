"use server";

import { revalidatePath } from "next/cache";

import { requireTripAdmin } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

import { tripDraftSchema, type TripDraft } from "./trip";

export async function saveTripChanges(tripId: string, draft: TripDraft) {
  await requireTripAdmin(tripId);
  const validated = tripDraftSchema.parse(draft);
  const updated = await prisma.trip.updateMany({
    where: { id: tripId },
    data: {
      name: validated.name,
      startsAt: validated.startsAt ? new Date(`${validated.startsAt}T12:00:00Z`) : null,
      endsAt: validated.endsAt ? new Date(`${validated.endsAt}T12:00:00Z`) : null,
      locationName: validated.locationName || null,
      mapUrl: validated.mapUrl || null,
    },
  });
  if (updated.count === 0) throw new Error("Trip not found.");
  revalidatePath("/dashboard");
  revalidatePath(`/trips/${tripId}/overview`);
  return { success: true };
}

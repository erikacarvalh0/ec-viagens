"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

import { tripDraftSchema, type TripDraft } from "./trip";

export async function createTrip(draft: TripDraft) {
  const userId = await requireUserId();
  const validated = tripDraftSchema.parse(draft);

  const trip = await prisma.trip.create({
    data: {
      name: validated.name,
      startsAt: validated.startsAt
        ? new Date(`${validated.startsAt}T12:00:00Z`)
        : null,
      endsAt: validated.endsAt
        ? new Date(`${validated.endsAt}T12:00:00Z`)
        : null,
      locationName: validated.locationName || null,
      mapUrl: validated.mapUrl || null,
      memberships: {
        create: {
          userId,
          role: "ADMIN",
        },
      },
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");

  return trip.id;
}

export async function getTripForMember(tripId: string) {
  const userId = await requireUserId();

  return prisma.trip.findFirst({
    where: {
      id: tripId,
      memberships: {
        some: { userId },
      },
    },
  });
}

export async function updateTrip(
  tripId: string,
  draft: TripDraft,
) {
  const userId = await requireUserId();
  const validated = tripDraftSchema.parse(draft);

  const updated = await prisma.trip.updateMany({
    where: {
      id: tripId,
      memberships: {
        some: { userId, role: "ADMIN" },
      },
    },
    data: {
      name: validated.name,
      startsAt: validated.startsAt
        ? new Date(`${validated.startsAt}T12:00:00Z`)
        : null,
      endsAt: validated.endsAt
        ? new Date(`${validated.endsAt}T12:00:00Z`)
        : null,
      locationName: validated.locationName || null,
      mapUrl: validated.mapUrl || null,
    },
  });

  if (updated.count === 0) {
    throw new Error("Trip not found or insufficient permissions.");
  }

  revalidatePath("/dashboard");
}

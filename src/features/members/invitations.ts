import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

import { requireTripAdmin } from "./permissions";

const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createInvitation(tripId: string) {
  const membership = await requireTripAdmin(tripId);
  if (membership.trip?.archivedAt) {
    throw new Error("Archived trips cannot accept new invitations.");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS);

  await prisma.invitation.create({
    data: {
      tripId,
      tokenHash: hashToken(token),
      expiresAt,
      whatsapp: "",
    },
  });

  return token;
}

export async function getInvitation(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  return prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { trip: { select: { name: true, archivedAt: true } } },
  });
}

export async function acceptInvitation(token: string) {
  const userId = await requireUserId();
  const invitation = await getInvitation(token);

  if (
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.expiresAt <= new Date()
  ) {
    throw new Error("This invitation is invalid or expired.");
  }

  if (invitation.trip?.archivedAt) {
    throw new Error("Archived trips cannot accept new invitations.");
  }

  await prisma.$transaction(async (transaction) => {
    // An invitation may be read while a trip is still active, then archived
    // before redemption. Check again within the transaction.
    const trip = await transaction.trip?.findUnique({
      where: { id: invitation.tripId },
      select: { archivedAt: true },
    }) ?? invitation.trip;
    if (!trip || trip.archivedAt) {
      throw new Error("Archived trips cannot accept new invitations.");
    }

    const claimed = await transaction.invitation.updateMany({
      where: {
        id: invitation.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      data: { status: "ACCEPTED" },
    });

    if (claimed.count !== 1) {
      throw new Error("This invitation has already been used.");
    }

    await transaction.tripMember.upsert({
      where: {
        tripId_userId: { tripId: invitation.tripId, userId },
      },
      create: {
        tripId: invitation.tripId,
        userId,
        role: "MEMBER",
      },
      update: {},
    });
  });

  return invitation.tripId;
}

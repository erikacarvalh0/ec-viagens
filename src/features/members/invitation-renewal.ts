import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

import { requireTripAdmin } from "./permissions";

const LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export async function renewInvitation(tripId: string, invitationId: string): Promise<string> {
  const membership = await requireTripAdmin(tripId);
  if (membership.trip?.archivedAt) {
    throw new Error("Archived trips cannot accept new invitations.");
  }
  const now = new Date();
  return prisma.$transaction(async (transaction) => {
    const invitation = await transaction.invitation.findFirst({
      where: { id: invitationId, tripId, status: "PENDING", expiresAt: { lte: now } },
    });
    if (!invitation || invitation.expiresAt > now) throw new Error("No expired invitation found.");

    const claimed = await transaction.invitation.updateMany({
      where: { id: invitationId, tripId, status: "PENDING", expiresAt: { lte: now } },
      data: { status: "EXPIRED" },
    });
    if (claimed.count !== 1) throw new Error("No expired invitation found.");

    const token = randomBytes(32).toString("hex");
    await transaction.invitation.create({
      data: {
        tripId,
        whatsapp: invitation.whatsapp,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(now.getTime() + LIFETIME_MS),
      },
    });
    return token;
  });
}

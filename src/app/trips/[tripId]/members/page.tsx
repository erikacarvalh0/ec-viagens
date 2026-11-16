import { notFound } from "next/navigation";

import { MemberManagement } from "@/features/members/MemberManagement";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

type PageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function TripMembersPage({ params }: PageProps) {
  const { tripId } = await params;
  const userId = await requireUserId();

  const membership = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
    include: { trip: true },
  });

  if (!membership) {
    notFound();
  }

  const members = await prisma.tripMember.findMany({
    where: { tripId },
    include: { user: true, titles: true },
    orderBy: { user: { name: "asc" } },
  });

  const invitations = membership.role === "ADMIN"
    ? await prisma.invitation.findMany({
        where: { tripId },
        select: { id: true, status: true, expiresAt: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <MemberManagement
      isAdmin={membership.role === "ADMIN"}
      invitations={invitations.map((invitation) => ({
        id: invitation.id,
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
        createdAt: invitation.createdAt.toISOString(),
      }))}
      members={members.map((member) => ({
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        titles: member.titles.map((entry) => ({
          title: entry.title,
          description: entry.description ?? "",
        })),
      }))}
      tripId={tripId}
      tripName={membership.trip.name}
    />
  );
}

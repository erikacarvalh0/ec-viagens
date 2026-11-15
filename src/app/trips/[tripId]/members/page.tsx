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
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <MemberManagement
      isAdmin={membership.role === "ADMIN"}
      members={members.map((member) => ({
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
      }))}
      tripId={tripId}
      tripName={membership.trip.name}
    />
  );
}

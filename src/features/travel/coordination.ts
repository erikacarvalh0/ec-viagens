export type CoordinationMember = {
  id: string;
  name: string;
  travel: {
    needsRide: boolean;
    offersRide: boolean;
    rideOutbound: boolean;
    rideReturn: boolean;
    shareUber: boolean;
    interestedVan: boolean;
  } | null;
};

export function getCoordinationGroups<T extends CoordinationMember>(
  members: T[],
  currentMemberId: string,
) {
  const current = members.find((member) => member.id === currentMemberId);
  const otherMembers = members.filter((member) => member.id !== currentMemberId);

  return {
    rideSeekers: current?.travel?.offersRide
      ? otherMembers.filter((member) => member.travel?.needsRide)
      : [],
    rideOffers: current?.travel?.needsRide
      ? otherMembers.filter((member) => member.travel?.offersRide)
      : [],
    outboundRideOffers: current?.travel?.needsRide
      ? otherMembers.filter((member) => member.travel?.offersRide && member.travel.rideOutbound)
      : [],
    returnRideOffers: current?.travel?.needsRide
      ? otherMembers.filter((member) => member.travel?.offersRide && member.travel.rideReturn)
      : [],
    uberSharing: current?.travel?.shareUber
      ? members.filter((member) => member.travel?.shareUber)
      : [],
    vanInterested: members.filter((member) => member.travel?.interestedVan),
  };
}

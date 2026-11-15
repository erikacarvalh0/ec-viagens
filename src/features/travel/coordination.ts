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

  return {
    rideSeekers: current?.travel?.offersRide
      ? members.filter((member) => member.travel?.needsRide)
      : [],
    rideOffers: current?.travel?.needsRide
      ? members.filter((member) => member.travel?.offersRide)
      : [],
    uberSharing: current?.travel?.shareUber
      ? members.filter((member) => member.travel?.shareUber)
      : [],
    vanInterested: members.filter((member) => member.travel?.interestedVan),
  };
}

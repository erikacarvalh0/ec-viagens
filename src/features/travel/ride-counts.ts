type DirectionMember = { travel: { rideOutbound: boolean; rideReturn: boolean } | null };

export function countRideDirections(members: DirectionMember[]) {
  return {
    outbound: members.filter((member) => member.travel?.rideOutbound === true).length,
    return: members.filter((member) => member.travel?.rideReturn === true).length,
  };
}

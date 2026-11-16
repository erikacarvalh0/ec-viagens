export type RideDirection = "all" | "outbound" | "return";
export type RideOffer = {
  id: string;
  name: string;
  travel: { rideOutbound: boolean; rideReturn: boolean } | null;
};

export function filterRideMembers<T extends RideOffer>(members: T[], direction: RideDirection): T[] {
  if (direction === "all") return members;
  return members.filter((member) =>
    direction === "outbound" ? member.travel?.rideOutbound === true : member.travel?.rideReturn === true,
  );
}

"use server";

import { revalidatePath } from "next/cache";

import { requireTripMember } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

import { adminTravelDetailsSchema, travelDetailsSchema } from "./schema";

export type TravelActionState = { error: string; success?: boolean };

const checkboxKeys = [
  "needsRide",
  "interestedVan",
  "shareUber",
  "offersRide",
  "rideOutbound",
  "rideReturn",
] as const;

export async function saveTravelDetails(
  tripId: string,
  previous: TravelActionState,
  formData: FormData,
): Promise<TravelActionState> {
  void previous;

  let membership: Awaited<ReturnType<typeof requireTripMember>>;

  try {
    membership = await requireTripMember(tripId);
  } catch {
    return { error: "Você não participa desta viagem." };
  }

  const values: Record<string, string | boolean> = Object.fromEntries(
    [
      "city", "state", "whatsapp", "outboundAt", "outboundPeriod",
      "outboundOrigin", "returnAt", "returnPeriod", "returnOrigin",
      "transportMode",
    ].map((key) => [key, String(formData.get(key) ?? "")]),
  );

  for (const key of checkboxKeys) {
    values[key] = formData.has(key);
  }

  const schema = membership.role === "ADMIN"
    ? adminTravelDetailsSchema
    : travelDetailsSchema;
  const result = schema.safeParse(values);

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Verifique os dados." };
  }

  const { city, state, whatsapp, ...travel } = result.data;

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: membership.userId },
        data: {
          city: city || null,
          state: state || null,
          whatsapp: whatsapp || null,
        },
      });

      const data = {
        outboundAt: travel.outboundAt ? new Date(`${travel.outboundAt}T12:00:00Z`) : null,
        outboundPeriod: travel.outboundPeriod || null,
        outboundOrigin: travel.outboundOrigin || null,
        returnAt: travel.returnAt ? new Date(`${travel.returnAt}T12:00:00Z`) : null,
        returnPeriod: travel.returnPeriod || null,
        returnOrigin: travel.returnOrigin || null,
        transportMode: travel.transportMode || null,
        needsRide: travel.needsRide,
        interestedVan: travel.interestedVan,
        shareUber: travel.shareUber,
        offersRide: travel.offersRide,
        rideOutbound: travel.offersRide && travel.rideOutbound,
        rideReturn: travel.offersRide && travel.rideReturn,
      };

      await transaction.travelInfo.upsert({
        where: { memberId: membership.id },
        create: { memberId: membership.id, ...data },
        update: data,
      });
    });
  } catch {
    return { error: "Não foi possível salvar. Confira se o WhatsApp já está cadastrado." };
  }

  revalidatePath(`/trips/${tripId}/travel`);
  revalidatePath(`/trips/${tripId}/members`);

  return { error: "", success: true };
}

"use server";

import { revalidatePath } from "next/cache";

import { requireTripAdmin } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

import {
  responsibilitySchema,
  type ResponsibilityInput,
} from "./schema";

export type ResponsibilityActionState = { error: string };

async function validateTarget(tripId: string, memberId: string) {
  await requireTripAdmin(tripId);

  const target = await prisma.tripMember.findFirst({
    where: { id: memberId, tripId },
    select: { id: true },
  });

  if (!target) {
    throw new Error("Member not found in this trip.");
  }
}

export async function assignResponsibility(
  tripId: string,
  memberId: string,
  previous: ResponsibilityActionState,
  input: ResponsibilityInput,
): Promise<ResponsibilityActionState> {
  void previous;

  const parsed = responsibilitySchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Verifique o título e a descrição (máximo de 500 caracteres)." };
  }

  try {
    await validateTarget(tripId, memberId);

    await prisma.memberTitle.upsert({
      where: {
        memberId_title: { memberId, title: parsed.data.title },
        member: { tripId },
      },
      create: {
        memberId,
        title: parsed.data.title,
        description: parsed.data.description,
      },
      update: { description: parsed.data.description },
    });
  } catch {
    return { error: "Apenas administradoras podem atribuir títulos nesta viagem." };
  }

  revalidatePath(`/trips/${tripId}/members`);
  return { error: "" };
}

export async function removeResponsibility(
  tripId: string,
  memberId: string,
  previous: ResponsibilityActionState,
  title: ResponsibilityInput["title"],
): Promise<ResponsibilityActionState> {
  void previous;

  if (!responsibilitySchema.shape.title.safeParse(title).success) {
    return { error: "Título inválido." };
  }

  try {
    await validateTarget(tripId, memberId);

    await prisma.memberTitle.deleteMany({
      where: {
        memberId,
        title,
        member: { tripId },
      },
    });
  } catch {
    return { error: "Não foi possível remover este título." };
  }

  revalidatePath(`/trips/${tripId}/members`);
  return { error: "" };
}

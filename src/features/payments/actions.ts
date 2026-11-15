"use server";

import { revalidatePath } from "next/cache";

import { requireTripAdmin } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

import { paymentPlanSchema } from "./schema";

export type PaymentActionState = { error: string; success?: boolean };

export async function createPaymentPlan(
  tripId: string,
  previous: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  void previous;

  const parsed = paymentPlanSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    dueDay: formData.get("dueDay") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await requireTripAdmin(tripId);

    await prisma.paymentPlan.create({
      data: {
        tripId,
        ...parsed.data,
      },
    });
  } catch {
    return { error: "Não foi possível criar o plano. Verifique suas permissões." };
  }

  revalidatePath(`/trips/${tripId}/payments`);
  return { error: "", success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireTripAdmin } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

import { createAsaasCustomer, createAsaasPayment } from "./asaas";

export type ChargeActionState = { error: string; success?: boolean };

const chargeInputSchema = z.object({
  planId: z.string().min(1),
  memberId: z.string().min(1),
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine((input) => {
  const date = new Date(`${input.dueAt}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === input.dueAt;
}, { path: ["dueAt"], message: "Data de vencimento inválida." });

export async function issueCharge(
  tripId: string,
  previous: ChargeActionState,
  formData: FormData,
): Promise<ChargeActionState> {
  void previous;

  const parsed = chargeInputSchema.safeParse({
    planId: formData.get("planId"),
    memberId: formData.get("memberId"),
    dueAt: formData.get("dueAt"),
  });

  if (!parsed.success) {
    return { error: "Selecione um plano, uma participante e uma data válida." };
  }

  try {
    await requireTripAdmin(tripId);

    const [plan, member] = await Promise.all([
      prisma.paymentPlan.findFirst({
        where: { id: parsed.data.planId, tripId },
      }),
      prisma.tripMember.findFirst({
        where: { id: parsed.data.memberId, tripId },
        include: { user: true },
      }),
    ]);

    if (!plan || !member) {
      return { error: "Plano ou participante não pertence a esta viagem." };
    }

    // Save locally before calling Asaas so its external reference is traceable.
    const charge = await prisma.charge.create({
      data: {
        paymentPlanId: plan.id,
        memberId: member.id,
        amountCents: plan.amountCents,
        dueAt: new Date(`${parsed.data.dueAt}T12:00:00Z`),
        status: "PENDING",
      },
    });

    const customer = await createAsaasCustomer({
      name: member.user.name,
      email: member.user.email,
    });
    const payment = await createAsaasPayment({
      customer,
      value: plan.amountCents / 100,
      dueDate: parsed.data.dueAt,
      externalReference: charge.id,
    });

    await prisma.charge.update({
      where: { id: charge.id },
      data: {
        asaasPaymentId: payment.id,
        paymentUrl: payment.invoiceUrl,
      },
    });
  } catch {
    return {
      error: "Não foi possível emitir a cobrança. Verifique a configuração do Asaas e as cobranças pendentes antes de tentar novamente.",
    };
  }

  revalidatePath(`/trips/${tripId}/payments`);
  return { error: "", success: true };
}

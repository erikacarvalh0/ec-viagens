"use server";

import { revalidatePath } from "next/cache";

import { requireTripAdmin } from "@/features/members/permissions";
import { prisma } from "@/lib/prisma";

import { findAsaasPaymentByReference } from "./asaas";

type RecoveryResult = { error: string; success?: boolean };

export async function recoverCharge(
  tripId: string,
  chargeId: string,
): Promise<RecoveryResult> {
  try {
    await requireTripAdmin(tripId);

    const charge = await prisma.charge.findFirst({
      where: { id: chargeId, plan: { tripId } },
    });

    if (!charge) {
      return { error: "Cobrança não encontrada nesta viagem." };
    }

    if (charge.asaasPaymentId) {
      return { error: "Esta cobrança já está vinculada ao Asaas." };
    }

    if (charge.status !== "PENDING") {
      return { error: "Somente cobranças pendentes podem ser recuperadas." };
    }

    const payment = await findAsaasPaymentByReference(charge.id);

    if (!payment || !payment.invoiceUrl) {
      return {
        error: "Nenhum pagamento correspondente foi encontrado no Asaas. Verifique no painel antes de emitir outra cobrança.",
      };
    }

    const status = payment.status === "CONFIRMED" || payment.status === "RECEIVED"
      ? "PAID"
      : payment.status === "OVERDUE"
        ? "OVERDUE"
        : payment.status === "REFUNDED"
          ? "REFUNDED"
          : payment.status === "DELETED"
            ? "CANCELLED"
            : "PENDING";

    // Claim only an unlinked pending charge to avoid overwriting a
    // concurrent webhook or a second recovery attempt.
    const updated = await prisma.charge.updateMany({
      where: {
        id: charge.id,
        status: "PENDING",
        asaasPaymentId: null,
      },
      data: {
        asaasPaymentId: payment.id,
        paymentUrl: payment.invoiceUrl,
        status,
      },
    });
    if (updated.count !== 1) {
      return { error: "A cobrança foi atualizada por outra operação. Atualize a página." };
    }

    revalidatePath(`/trips/${tripId}/payments`);
    return { error: "", success: true };
  } catch {
    return {
      error: "Não foi possível consultar o Asaas. Tente novamente mais tarde.",
    };
  }
}

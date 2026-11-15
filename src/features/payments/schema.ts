import { z } from "zod";

const rawPaymentPlanSchema = z.object({
  name: z.string().trim().min(3).max(100),
  amount: z.string().regex(/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/),
  dueDay: z.union([z.literal(""), z.string().regex(/^\d{1,2}$/)]),
});

export const paymentPlanSchema = rawPaymentPlanSchema
  .refine((value) => Number(value.amount) > 0, {
    path: ["amount"],
    message: "O valor deve ser maior que zero.",
  })
  .refine(
    (value) =>
      value.dueDay === "" ||
      (Number(value.dueDay) >= 1 && Number(value.dueDay) <= 28),
    {
      path: ["dueDay"],
      message: "Escolha um dia de vencimento entre 1 e 28.",
    },
  )
  .transform((value) => {
    const [whole, fraction = ""] = value.amount.split(".");

    return {
      name: value.name,
      amountCents: Number(whole) * 100 + Number(fraction.padEnd(2, "0")),
      dueDay: value.dueDay ? Number(value.dueDay) : null,
    };
  });

export function formatBRL(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

import { z } from "zod";

const optionalText = z.string().trim().max(160);
const period = z.enum(["MORNING", "AFTERNOON", "EVENING"]);
const optionalPeriod = z.union([period, z.literal("")]);

function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

const optionalTravelDate = z.string().refine(
  (value) => !value || validCalendarDate(value),
  "Informe uma data válida.",
);

export const travelDetailsSchema = z
  .object({
    city: optionalText,
    state: z.string().trim().max(2),
    whatsapp: z.string().trim().max(20),
    outboundAt: optionalTravelDate,
    outboundPeriod: optionalPeriod,
    outboundOrigin: optionalText,
    returnAt: optionalTravelDate,
    returnPeriod: optionalPeriod,
    returnOrigin: optionalText,
    transportMode: optionalText,
    needsRide: z.boolean(),
    interestedVan: z.boolean(),
    shareUber: z.boolean(),
    offersRide: z.boolean(),
    rideOutbound: z.boolean(),
    rideReturn: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.returnAt && value.outboundAt && value.returnAt < value.outboundAt) {
      context.addIssue({
        code: "custom",
        path: ["returnAt"],
        message: "A volta não pode ser anterior à ida.",
      });
    }

    if (value.offersRide && !value.rideOutbound && !value.rideReturn) {
      context.addIssue({
        code: "custom",
        path: ["offersRide"],
        message: "Escolha pelo menos um trecho para oferecer carona.",
      });
    }

    if (!value.city || !value.state || !value.whatsapp) {
      context.addIssue({
        code: "custom",
        path: ["city"],
        message: "Informe cidade, estado e WhatsApp.",
      });
    }

    if (!/^\d{10,13}$/.test(value.whatsapp.replace(/\D/g, ""))) {
      context.addIssue({
        code: "custom",
        path: ["whatsapp"],
        message: "Informe um WhatsApp com DDD.",
      });
    }

    if (!value.outboundAt || !value.returnAt || !value.outboundPeriod || !value.returnPeriod || !value.outboundOrigin || !value.returnOrigin || !value.transportMode) {
      context.addIssue({
        code: "custom",
        path: ["outboundAt"],
        message: "Preencha as informações de ida, volta e transporte.",
      });
    }
  });

export type TravelDetails = z.infer<typeof travelDetailsSchema>;

export const adminTravelDetailsSchema = z
  .object(travelDetailsSchema._def.schema.shape)
  .superRefine((value, context) => {
    if (value.returnAt && value.outboundAt && value.returnAt < value.outboundAt) {
      context.addIssue({
        code: "custom",
        path: ["returnAt"],
        message: "A volta não pode ser anterior à ida.",
      });
    }

    if (value.offersRide && !value.rideOutbound && !value.rideReturn) {
      context.addIssue({
        code: "custom",
        path: ["offersRide"],
        message: "Escolha pelo menos um trecho para oferecer carona.",
      });
    }
  });

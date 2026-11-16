import { z } from "zod";

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(`${value}T00:00:00.000Z`);
  return year > 0 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const tripDate = z.string().refine((value) => !value || validDate(value), "Informe uma data válida.");

const tripFields = {
  name: z
    .string()
    .trim()
    .min(3, "Informe um nome com pelo menos 3 caracteres.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  startsAt: tripDate,
  endsAt: tripDate,
  locationName: z.string().trim().max(120),
  mapUrl: z.string().trim().max(2048, "O link do mapa deve ter no máximo 2048 caracteres."),
};

export const tripDraftSchema = z
  .object(tripFields)
  .superRefine((value, context) => {
    if (value.startsAt && value.endsAt && value.endsAt < value.startsAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "A data de volta não pode ser anterior à data de ida.",
      });
    }

    if (value.mapUrl) {
      try {
        const url = new URL(value.mapUrl);

        if (url.protocol !== "https:" || url.username || url.password) {
          throw new Error("Insecure URL");
        }
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["mapUrl"],
          message: "Informe um link HTTPS válido para o mapa.",
        });
      }
    }
  });

export type TripDraft = z.infer<typeof tripDraftSchema>;

export type Trip = TripDraft & {
  id: string;
  createdAt: string;
  archivedAt?: string | null;
};

export function formatTripDates(trip: Trip): string {
  function formatDate(value: string): string {
    return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (!trip.startsAt && !trip.endsAt) {
    return "Datas a definir";
  }

  if (trip.startsAt && trip.endsAt) {
    return `${formatDate(trip.startsAt)} – ${formatDate(trip.endsAt)}`;
  }

  return formatDate(trip.startsAt || trip.endsAt);
}

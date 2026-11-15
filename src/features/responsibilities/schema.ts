import { z } from "zod";

export const responsibilitySchema = z.object({
  title: z.enum(["VAN_COORDINATOR", "ORGANIZER"]),
  description: z.string().trim().max(500),
});

export type ResponsibilityInput = z.infer<typeof responsibilitySchema>;

export const responsibilityLabels: Record<ResponsibilityInput["title"], string> = {
  VAN_COORDINATOR: "Coordenadora da van",
  ORGANIZER: "Organizadora",
};

import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  city: z.string().trim().max(100),
  state: z.string().trim().max(80),
  whatsapp: z.string().trim().refine((value) => !value || /^\d{10,15}$/.test(value), {
    message: "Informe o WhatsApp com DDI e DDD, somente números.",
  }),
});

export type ProfileDraft = z.infer<typeof profileSchema>;


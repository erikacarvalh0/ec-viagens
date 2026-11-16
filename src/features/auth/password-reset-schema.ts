import { z } from "zod";
export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
});
export const passwordResetConfirmationSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: z.string().min(12).max(128),
});

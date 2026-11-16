import { sendPasswordResetEmail } from "./password-reset-email";
import { requestPasswordReset } from "./password-reset-request";

/**
 * Internal composition boundary. Do not expose this directly as a public
 * action or route without per-IP abuse protection and uniform responses.
 */
export async function requestPasswordResetByEmail(input: unknown): Promise<void> {
  await requestPasswordReset(input, sendPasswordResetEmail);
}

import { createHash, randomBytes } from "node:crypto";

export function createPasswordResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string): string {
  if (!/^[a-f0-9]{64}$/.test(token)) {
    throw new Error("Invalid password reset token.");
  }
  return createHash("sha256").update(token).digest("hex");
}

import Credentials from "next-auth/providers/credentials";
import { describe, expect, it, vi } from "vitest";

import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

vi.mock("next-auth", () => ({ default: vi.fn(() => ({})) }));
vi.mock("next-auth/providers/credentials", () => ({ default: vi.fn((config) => config) }));
vi.mock("@/lib/password", () => ({ verifyPassword: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }));

import "./auth";

const authorize = vi.mocked(Credentials).mock.calls[0][0].authorize!;
const request = new Request("https://example.com/api/auth/callback/credentials");

describe("credentials input bounds", () => {
  it("rejects oversized emails before querying users or hashing", async () => {
    const domain = `${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(57)}.com`;

    await expect(authorize({
      email: `${"a".repeat(64)}@${domain}x`,
      password: "secure-password-123",
    }, request)).resolves.toBeNull();

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it("rejects oversized passwords before querying users or hashing", async () => {
    await expect(authorize({
      email: "ana@example.com",
      password: "a".repeat(129),
    }, request)).resolves.toBeNull();

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(verifyPassword).not.toHaveBeenCalled();
  });
});

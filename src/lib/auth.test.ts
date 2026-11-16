import NextAuth, { type NextAuthConfig } from "next-auth";
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
const jwtCallback = (vi.mocked(NextAuth).mock.calls[0][0] as NextAuthConfig).callbacks!.jwt!;
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

describe("session revocation", () => {
  it("rejects a session whose version was revoked", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ sessionVersion: 3 } as never);
    const token = { userId: "user-1", sessionVersion: 2 };
    expect(await jwtCallback({ token, trigger: "update", session: {} } as never)).toBeNull();
  });

  it("preserves a session whose version matches the database", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ sessionVersion: 3 } as never);
    const token = { userId: "user-1", sessionVersion: 3 };
    expect(await jwtCallback({ token, trigger: "update", session: {} } as never)).toEqual(token);
  });

  it("rejects tokens issued before session versioning", async () => {
    expect(await jwtCallback({ token: { userId: "user-1" }, trigger: "update", session: {} } as never)).toBeNull();
  });
});

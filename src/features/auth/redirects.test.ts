import { describe, expect, it } from "vitest";

import { authCallbackPath, authPageHref } from "./redirects";

describe("invitation registration redirects", () => {
  const invite = `/invite/${"a".repeat(64)}`;

  it("preserves a valid invitation path", () => {
    expect(authCallbackPath(invite)).toBe(invite);
    expect(authPageHref("/register", invite)).toBe(`/register?callbackUrl=${encodeURIComponent(invite)}`);
    expect(authPageHref("/login", invite)).toBe(`/login?callbackUrl=${encodeURIComponent(invite)}`);
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/admin",
    `/invite/${"a".repeat(63)}`,
    `/invite/${"a".repeat(65)}`,
    `/invite/${"A".repeat(64)}`,
    `/invite/${"g".repeat(64)}`,
    `${invite}/`,
    `${invite}?next=https://evil.example`,
    `${invite}#fragment`,
    `https://evil.example${invite}`,
  ])("rejects unsafe or malformed callback %s", (callback) => {
    expect(authCallbackPath(callback)).toBe("/dashboard");
    expect(authPageHref("/login", callback)).toBe("/login");
    expect(authPageHref("/register", callback)).toBe("/register");
  });

  it("preserves invitation tokens containing every hexadecimal digit", () => {
    const callback = `/invite/${"0123456789abcdef".repeat(4)}`;

    expect(authCallbackPath(callback)).toBe(callback);
    expect(authPageHref("/login", callback)).toBe(`/login?callbackUrl=${encodeURIComponent(callback)}`);
    expect(authPageHref("/register", callback)).toBe(`/register?callbackUrl=${encodeURIComponent(callback)}`);
  });

  it("uses dashboard when no invitation is supplied", () => {
    expect(authPageHref("/login", "")).toBe("/login");
  });
});

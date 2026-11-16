import { describe, expect, it } from "vitest";

import { authCallbackPath, authPageHref } from "./redirects";

describe("invitation registration redirects", () => {
  const invite = `/invite/${"a".repeat(64)}`;

  it("preserves a valid invitation path", () => {
    expect(authCallbackPath(invite)).toBe(invite);
    expect(authPageHref("/register", invite)).toBe(`/register?callbackUrl=${encodeURIComponent(invite)}`);
    expect(authPageHref("/login", invite)).toBe(`/login?callbackUrl=${encodeURIComponent(invite)}`);
  });

  it("rejects external URLs and arbitrary internal paths", () => {
    expect(authCallbackPath("https://evil.example")).toBe("/dashboard");
    expect(authCallbackPath("//evil.example")).toBe("/dashboard");
    expect(authCallbackPath("/admin")).toBe("/dashboard");
  });

  it("uses dashboard when no invitation is supplied", () => {
    expect(authPageHref("/login", "")).toBe("/login");
  });
});

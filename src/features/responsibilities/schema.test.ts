import { describe, expect, it } from "vitest";

import { responsibilitySchema } from "./schema";

describe("trip responsibilities validation", () => {
  it("accepts a van coordinator with a description", () => {
    expect(
      responsibilitySchema.safeParse({
        title: "VAN_COORDINATOR",
        description: "Organiza os horários e pontos de embarque.",
      }).success,
    ).toBe(true);
  });

  it("accepts an organizer without a description", () => {
    expect(
      responsibilitySchema.safeParse({
        title: "ORGANIZER",
        description: "",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown roles", () => {
    expect(
      responsibilitySchema.safeParse({
        title: "ADMIN",
        description: "",
      }).success,
    ).toBe(false);
  });

  it("rejects overly long descriptions", () => {
    expect(
      responsibilitySchema.safeParse({
        title: "ORGANIZER",
        description: "a".repeat(501),
      }).success,
    ).toBe(false);
  });
});

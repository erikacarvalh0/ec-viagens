import { afterEach, describe, expect, it, vi } from "vitest";
import { photosEnabled } from "./availability";

afterEach(() => vi.unstubAllEnvs());

describe("gallery availability", () => {
  it.each([undefined, "", "false", "TRUE"])("disables gallery for %s", (value) => {
    vi.stubEnv("PHOTOS_ENABLED", value);
    expect(photosEnabled()).toBe(false);
  });
  it("requires explicit opt-in", () => {
    vi.stubEnv("PHOTOS_ENABLED", "true");
    expect(photosEnabled()).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { validateSelectedPhoto } from "./upload-client";

describe("client photo selection", () => {
  it("accepts JPEG and PNG files up to 5 MB", () => {
    expect(validateSelectedPhoto({ size: 1024, type: "image/jpeg" })).toBeNull();
    expect(validateSelectedPhoto({ size: 5 * 1024 * 1024, type: "image/png" })).toBeNull();
  });

  it("rejects empty and oversized files", () => {
    expect(validateSelectedPhoto({ size: 0, type: "image/jpeg" })).toBeTruthy();
    expect(validateSelectedPhoto({ size: 5 * 1024 * 1024 + 1, type: "image/png" })).toBeTruthy();
  });

  it("rejects negative, fractional, non-finite and unsafe sizes", () => {
    for (const size of [-1, 0.5, Number.NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(validateSelectedPhoto({ size, type: "image/jpeg" })).toBeTruthy();
    }
  });

  it("rejects unsupported formats", () => {
    expect(validateSelectedPhoto({ size: 1024, type: "image/svg+xml" })).toBeTruthy();
    expect(validateSelectedPhoto({ size: 1024, type: "image/webp" })).toBeTruthy();
  });

  it("rejects missing selections", () => {
    expect(validateSelectedPhoto(null)).toBeTruthy();
  });
});

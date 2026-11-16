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

  it("rejects unsupported formats", () => {
    expect(validateSelectedPhoto({ size: 1024, type: "image/svg+xml" })).toBeTruthy();
    expect(validateSelectedPhoto({ size: 1024, type: "image/webp" })).toBeTruthy();
  });

  it("rejects missing selections", () => {
    expect(validateSelectedPhoto(null)).toBeTruthy();
  });
});

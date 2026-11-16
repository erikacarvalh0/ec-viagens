import { describe, expect, it } from "vitest";

import { detectPhotoType, validatePhotoUpload } from "./validation";

describe("trip photo validation", () => {
  it("accepts JPEG and PNG magic bytes", () => {
    expect(detectPhotoType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectPhotoType(new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10,
      0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 0, 1, 0, 0, 0, 1,
    ]))).toBe("image/png");
  });

  it("rejects PNG signature-only files and malformed IHDR headers", () => {
    expect(detectPhotoType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))).toBeNull();
    expect(detectPhotoType(new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10,
      0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 0, 0, 0, 0, 0, 0,
    ]))).toBeNull();
  });

  it("rejects files with mismatched signatures", () => {
    expect(() => validatePhotoUpload(new Uint8Array([1, 2, 3]), "image/jpeg")).toThrow();
  });

  it("rejects oversized uploads", () => {
    expect(() => validatePhotoUpload(new Uint8Array(5 * 1024 * 1024 + 1), "image/png")).toThrow();
  });

  it("rejects unsupported MIME types", () => {
    expect(() => validatePhotoUpload(new Uint8Array([0xff, 0xd8, 0xff]), "image/svg+xml")).toThrow();
  });
});

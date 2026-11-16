import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  metadata: vi.fn(),
  resize: vi.fn(),
  rotate: vi.fn(),
  jpeg: vi.fn(),
  toBuffer: vi.fn(),
}));
vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    metadata: mocks.metadata,
    resize: mocks.resize,
    rotate: mocks.rotate,
    jpeg: mocks.jpeg,
    toBuffer: mocks.toBuffer,
  })),
}));
import { optimizePhoto } from "./optimization";

describe("photo optimization", () => {
  it("creates a resized original and a thumbnail without source metadata", async () => {
    mocks.metadata.mockResolvedValue({ width: 2400, height: 1600 });
    mocks.rotate.mockReturnThis();
    mocks.resize.mockReturnThis();
    mocks.jpeg.mockReturnThis();
    mocks.toBuffer.mockResolvedValue(Buffer.from([255, 216, 255]));
    const result = await optimizePhoto(new Uint8Array([255, 216, 255]));
    expect(result.original.contentType).toBe("image/jpeg");
    expect(result.thumbnail.contentType).toBe("image/jpeg");
    expect(mocks.resize).toHaveBeenCalledWith({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true });
    expect(mocks.resize).toHaveBeenCalledWith({ width: 360, height: 360, fit: "inside", withoutEnlargement: true });
    expect(mocks.jpeg).toHaveBeenCalledWith({ quality: 80, mozjpeg: true });
  });

  it("rejects images above safe pixel limits", async () => {
    mocks.metadata.mockResolvedValue({ width: 15000, height: 15000 });
    await expect(optimizePhoto(new Uint8Array([255, 216, 255]))).rejects.toThrow();
  });
});

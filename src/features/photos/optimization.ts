import sharp from "sharp";

const MAX_PIXELS = 40_000_000;

async function render(bytes: Uint8Array, width: number) {
  // Rotate according to EXIF orientation, then discard all source metadata.
  const output = await sharp(Buffer.from(bytes), {
    limitInputPixels: MAX_PIXELS,
    failOn: "error",
  })
    .rotate()
    .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  return { bytes: new Uint8Array(output), contentType: "image/jpeg" };
}

export async function optimizePhoto(bytes: Uint8Array) {
  const metadata = await sharp(Buffer.from(bytes), {
    limitInputPixels: MAX_PIXELS,
    failOn: "error",
  }).metadata();
  if (!metadata.width || !metadata.height ||
      metadata.width * metadata.height > MAX_PIXELS) {
    throw new Error("Image dimensions exceed safe limits.");
  }

  const [original, thumbnail] = await Promise.all([
    render(bytes, 1600),
    render(bytes, 360),
  ]);
  return { original, thumbnail };
}

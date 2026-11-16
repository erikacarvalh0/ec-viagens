export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function detectPhotoType(bytes: Uint8Array): "image/jpeg" | "image/png" | null {
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return "image/jpeg";
  }
  if (bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) {
    return "image/png";
  }
  return null;
}

export function validatePhotoUpload(bytes: Uint8Array, claimedType: string) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_PHOTO_BYTES) {
    throw new Error("A imagem deve ter até 5 MB.");
  }
  const actualType = detectPhotoType(bytes);
  if (!actualType || actualType !== claimedType) {
    throw new Error("Envie um JPEG ou PNG válido.");
  }
  return actualType;
}

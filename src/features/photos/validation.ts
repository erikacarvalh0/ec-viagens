export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function detectPhotoType(bytes: Uint8Array): "image/jpeg" | "image/png" | null {
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 24 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value) &&
    bytes[8] === 0 && bytes[9] === 0 && bytes[10] === 0 && bytes[11] === 13 &&
    bytes[12] === 73 && bytes[13] === 72 && bytes[14] === 68 && bytes[15] === 82 &&
    (bytes[16] !== 0 || bytes[17] !== 0 || bytes[18] !== 0 || bytes[19] !== 0) &&
    (bytes[20] !== 0 || bytes[21] !== 0 || bytes[22] !== 0 || bytes[23] !== 0)
  ) {
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

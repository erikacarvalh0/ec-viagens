import { MAX_PHOTO_BYTES } from "./validation";

export function validateSelectedPhoto(file: { size: number; type: string } | null) {
  if (!file) return "Selecione uma foto.";
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) {
    return "A foto deve ter até 5 MB.";
  }
  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    return "Selecione uma imagem JPEG ou PNG.";
  }
  return null;
}

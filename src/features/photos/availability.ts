export function photosEnabled(): boolean {
  return process.env.PHOTOS_ENABLED === "true";
}

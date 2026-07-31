/** Mirrors the API's own limits (apps/api/src/lib/image-upload.ts). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

/** Value for an `<input type="file" accept>`. */
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',')

/**
 * Why `file` can't be uploaded, or null when it's fine. The server checks the
 * same things by magic bytes; this only saves the round trip. The name is
 * included because a drop can carry several files and "which one?" matters.
 */
export function imageRejection(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return `${file.name}: use a PNG, JPEG, GIF, or WebP image.`
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: must be 5 MB or smaller.`
  }
  return null
}

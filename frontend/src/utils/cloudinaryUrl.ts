/**
 * Cloudinary URL optimization utility.
 *
 * Detects Cloudinary image URLs and injects transformation parameters
 * (quality auto, format auto, width resize) to save bandwidth and
 * prevent memory crashes on mobile devices.
 *
 * Falls through for non-Cloudinary URLs or video URLs.
 */

const CLOUDINARY_REGEX = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/)(?:image\/upload\/)(.*)/;

/**
 * Returns an optimized Cloudinary image URL with auto quality, auto format,
 * and optional width resize. Returns the original URL unchanged for
 * non-Cloudinary URLs or video files.
 *
 * @param url - The original media URL
 * @param width - Desired image width in pixels (default: 800)
 */
export function optimizedImageUrl(url: string | undefined | null, width: number = 800): string | undefined {
  if (!url) return undefined;

  // Skip videos — Cloudinary video transforms need a different pipeline
  const lower = url.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) {
    return url;
  }

  const match = url.match(CLOUDINARY_REGEX);
  if (!match) return url; // Not a Cloudinary URL, pass through

  const base = match[1];     // e.g. https://res.cloudinary.com/xxx/
  const remainder = match[2]; // e.g. v123456/folder/image.jpg (or already has transforms)

  return `${base}image/upload/q_auto,f_auto,w_${width}/${remainder}`;
}

/**
 * Convenience variant for thumbnails (smaller width).
 */
export function optimizedThumbUrl(url: string | undefined | null, width: number = 400): string | undefined {
  return optimizedImageUrl(url, width);
}

/**
 * Cloudflare Image Optimization Utility
 *
 * This utility provides functions to optimize images using Cloudflare's image resizing service.
 * It automatically generates optimized URLs with proper compression and sizing.
 *
 * @example Basic usage
 * ```tsx
 * import { cloudflareImage } from '@/lib/image-utils';
 *
 * <img
 *   src={cloudflareImage('/images/logo.webp', { width: 32, height: 32 })}
 *   alt="Logo"
 *   width={32}
 *   height={32}
 * />
 * ```
 *
 * @example Responsive images
 * ```tsx
 * import { responsiveImage } from '@/lib/image-utils';
 *
 * const sources = responsiveImage('/images/logo.webp', 32);
 *
 * <img
 *   src={sources['1x']}
 *   srcSet={`${sources['1x']} 1x, ${sources['2x']} 2x, ${sources['3x']} 3x`}
 *   alt="Logo"
 * />
 * ```
 *
 * @see https://developers.cloudflare.com/images/image-resizing/
 */

interface CloudflareImageOptions {
    width?: number;
    height?: number;
    format?: 'auto' | 'avif' | 'webp' | 'png' | 'jpeg';
    quality?: number; // 1-100
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
    gravity?: 'auto' | 'center' | 'top' | 'right' | 'bottom' | 'left';
    sharpen?: number; // 0-10
}

/**
 * Generate a Cloudflare optimized image URL
 *
 * @param src - Original image path (relative to public directory)
 * @param options - Cloudflare image transformation options
 * @returns Optimized image URL
 */
export function cloudflareImage(src: string, options: CloudflareImageOptions = {}): string {
    // Default options optimized for web performance
    const defaultOptions: CloudflareImageOptions = {
        format: 'auto', // Let Cloudflare choose the best format (avif/webp/etc)
        quality: 85, // Good balance between quality and size
        fit: 'scale-down', // Preserve aspect ratio
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Build the Cloudflare image transformation parameters
    const params: string[] = [];

    if (finalOptions.width) params.push(`w=${finalOptions.width}`);
    if (finalOptions.height) params.push(`h=${finalOptions.height}`);
    if (finalOptions.format) params.push(`f=${finalOptions.format}`);
    if (finalOptions.quality) params.push(`q=${finalOptions.quality}`);
    if (finalOptions.fit) params.push(`fit=${finalOptions.fit}`);
    if (finalOptions.gravity) params.push(`gravity=${finalOptions.gravity}`);
    if (finalOptions.sharpen) params.push(`sharpen=${finalOptions.sharpen}`);

    const paramString = params.join(',');

    // Remove leading slash if present
    const cleanSrc = src.startsWith('/') ? src.slice(1) : src;

    // Generate the Cloudflare image URL
    // Format: /cdn-cgi/image/[options]/[original-url]
    return `/cdn-cgi/image/${paramString}/${cleanSrc}`;
}

/**
 * Generate responsive image sources for different screen densities
 *
 * @param src - Original image path
 * @param baseWidth - Base width for 1x density
 * @param options - Additional Cloudflare options
 * @returns Object with 1x, 2x, and 3x image sources
 */
export function responsiveImage(src: string, baseWidth: number, options: Omit<CloudflareImageOptions, 'width'> = {}) {
    return {
        '1x': cloudflareImage(src, { ...options, width: baseWidth }),
        '2x': cloudflareImage(src, { ...options, width: baseWidth * 2 }),
        '3x': cloudflareImage(src, { ...options, width: baseWidth * 3 }),
    };
}

/**
 * Generate srcSet string for responsive images
 *
 * @param src - Original image path
 * @param sizes - Array of widths for different breakpoints
 * @param options - Additional Cloudflare options
 * @returns srcSet string for use in img elements
 */
export function generateSrcSet(src: string, sizes: number[], options: Omit<CloudflareImageOptions, 'width'> = {}): string {
    return sizes.map((size) => `${cloudflareImage(src, { ...options, width: size })} ${size}w`).join(', ');
}

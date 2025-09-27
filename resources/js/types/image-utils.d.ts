/**
 * Type definitions for image optimization utilities
 */

export interface CloudflareImageOptions {
    /** Target width in pixels */
    width?: number;
    /** Target height in pixels */
    height?: number;
    /** Output format - 'auto' lets Cloudflare choose the best format */
    format?: 'auto' | 'avif' | 'webp' | 'png' | 'jpeg';
    /** Quality setting from 1-100 (higher is better quality but larger file) */
    quality?: number;
    /** How to resize the image to fit the target dimensions */
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
    /** Which part of the image to focus on when cropping */
    gravity?: 'auto' | 'center' | 'top' | 'right' | 'bottom' | 'left';
    /** Sharpening amount from 0-10 */
    sharpen?: number;
}

export interface ResponsiveImageSources {
    '1x': string;
    '2x': string;
    '3x': string;
}

export type ImageOptimizationFunction = (src: string, options?: CloudflareImageOptions) => string;

export type ResponsiveImageFunction = (src: string, baseWidth: number, options?: Omit<CloudflareImageOptions, 'width'>) => ResponsiveImageSources;

export type SrcSetFunction = (src: string, sizes: number[], options?: Omit<CloudflareImageOptions, 'width'>) => string;

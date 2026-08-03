const TRANSFORMATION_ORIGIN = 'https://diuacm.com'
const R2_IMAGE_HOST = 'r2.diuacm.com'

type ImagePreset = {
  widths: readonly number[]
  defaultWidth: number
  sizes: string
  quality: number
  fit: 'cover' | 'scale-down'
  aspectRatio?: number
}

export const IMAGE_PRESETS = {
  avatar: {
    widths: [64, 128],
    defaultWidth: 64,
    sizes: '64px',
    quality: 80,
    fit: 'cover',
    aspectRatio: 1,
  },
  profileAvatar: {
    widths: [192, 384],
    defaultWidth: 192,
    sizes: '96px',
    quality: 85,
    fit: 'cover',
    aspectRatio: 1,
  },
  squareGrid: {
    widths: [320, 640, 960],
    defaultWidth: 640,
    sizes: '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw',
    quality: 80,
    fit: 'cover',
    aspectRatio: 1,
  },
  landscapeGrid: {
    widths: [480, 768, 1200],
    defaultWidth: 768,
    sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
    quality: 80,
    fit: 'cover',
    aspectRatio: 16 / 9,
  },
  landscapeGallery: {
    widths: [320, 640, 960],
    defaultWidth: 640,
    sizes: '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw',
    quality: 80,
    fit: 'cover',
    aspectRatio: 16 / 9,
  },
  hero: {
    widths: [768, 1200, 1920],
    defaultWidth: 1200,
    sizes: '(min-width: 1280px) 1280px, 100vw',
    quality: 82,
    fit: 'cover',
    aspectRatio: 16 / 9,
  },
  content: {
    widths: [640, 960, 1600],
    defaultWidth: 960,
    sizes: '(min-width: 768px) 768px, 100vw',
    quality: 82,
    fit: 'scale-down',
  },
  lightbox: {
    widths: [960, 1600, 1920],
    defaultWidth: 1600,
    sizes: '100vw',
    quality: 85,
    fit: 'scale-down',
  },
} as const satisfies Record<string, ImagePreset>

export type ImagePresetName = keyof typeof IMAGE_PRESETS

const productionR2Url = (source: string): URL | null => {
  try {
    const url = new URL(source)
    return url.protocol === 'https:' && url.hostname === R2_IMAGE_HOST ? url : null
  } catch {
    return null
  }
}

/**
 * Build a Cloudflare Image Transformations URL for an immutable R2 object.
 * Local/preview URLs are returned untouched so Wrangler's emulated R2 route
 * keeps working without the production transformation service.
 */
export function imageVariantUrl(
  source: string,
  width: number,
  presetName: ImagePresetName,
): string {
  const sourceUrl = productionR2Url(source)
  if (!sourceUrl) return source

  const preset: ImagePreset = IMAGE_PRESETS[presetName]
  const options = [`width=${width}`]
  if (preset.aspectRatio) {
    options.push(`height=${Math.round(width / preset.aspectRatio)}`)
  }
  options.push(
    `fit=${preset.fit}`,
    `quality=${preset.quality}`,
    'format=auto',
    'metadata=none',
    'onerror=redirect',
  )

  return `${TRANSFORMATION_ORIGIN}/cdn-cgi/image/${options.join(',')}/${sourceUrl.href}`
}

export function responsiveImageProps(source: string, presetName: ImagePresetName) {
  const preset: ImagePreset = IMAGE_PRESETS[presetName]
  if (!productionR2Url(source)) {
    return { src: source }
  }

  return {
    src: imageVariantUrl(source, preset.defaultWidth, presetName),
    srcSet: preset.widths
      .map((width) => `${imageVariantUrl(source, width, presetName)} ${width}w`)
      .join(', '),
    sizes: preset.sizes,
  }
}

export function presetDimensions(presetName: ImagePresetName) {
  const preset: ImagePreset = IMAGE_PRESETS[presetName]
  return {
    width: preset.defaultWidth,
    height: preset.aspectRatio
      ? Math.round(preset.defaultWidth / preset.aspectRatio)
      : undefined,
  }
}

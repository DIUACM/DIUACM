import type { ComponentProps } from 'react'
import {
  presetDimensions,
  responsiveImageProps,
  type ImagePresetName,
} from '@/lib/responsive-image'

type ResponsiveImageProps = Omit<
  ComponentProps<'img'>,
  'src' | 'srcSet' | 'sizes'
> & {
  src: string
  preset: ImagePresetName
}

/** Responsive Cloudflare variant for production R2 images; plain image elsewhere. */
export function ResponsiveImage({
  src,
  preset,
  loading = 'lazy',
  decoding = 'async',
  width,
  height,
  ...props
}: ResponsiveImageProps) {
  const responsive = responsiveImageProps(src, preset)
  const dimensions = presetDimensions(preset)

  return (
    <img
      {...props}
      {...responsive}
      loading={loading}
      decoding={decoding}
      width={width ?? dimensions.width}
      height={height ?? dimensions.height}
    />
  )
}

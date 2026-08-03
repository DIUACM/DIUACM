import { describe, expect, it } from 'vitest'
import {
  imageVariantUrl,
  presetDimensions,
  responsiveImageProps,
} from './responsive-image'

const source = 'https://r2.diuacm.com/gallery/12/photo.jpg'

describe('responsive image URLs', () => {
  it('builds bounded, automatically formatted Cloudflare variants', () => {
    expect(imageVariantUrl(source, 640, 'squareGrid')).toBe(
      'https://diuacm.com/cdn-cgi/image/width=640,height=640,fit=cover,quality=80,format=auto,metadata=none,onerror=redirect/https://r2.diuacm.com/gallery/12/photo.jpg',
    )
  })

  it('builds a srcset from the shared preset widths', () => {
    const props = responsiveImageProps(source, 'avatar')

    expect(props.src).toContain('width=64,height=64')
    expect(props.srcSet).toContain('width=64,height=64')
    expect(props.srcSet).toContain('width=128,height=128')
    expect(props.sizes).toBe('64px')
  })

  it('provides high-density variants for large profile avatars', () => {
    const props = responsiveImageProps(source, 'profileAvatar')

    expect(props.src).toContain('width=192,height=192')
    expect(props.srcSet).toContain('width=384,height=384')
    expect(props.sizes).toBe('96px')
  })

  it('leaves local, preview, and third-party images untouched', () => {
    expect(responsiveImageProps('http://localhost:8787/files/users/a.jpg', 'avatar')).toEqual({
      src: 'http://localhost:8787/files/users/a.jpg',
    })
    expect(responsiveImageProps('https://i.ytimg.com/example.jpg', 'landscapeGrid')).toEqual({
      src: 'https://i.ytimg.com/example.jpg',
    })
  })

  it('provides intrinsic dimensions for fixed-aspect presets', () => {
    expect(presetDimensions('hero')).toEqual({ width: 1200, height: 675 })
    expect(presetDimensions('lightbox')).toEqual({ width: 1600, height: undefined })
  })
})

# Image Optimization with Cloudflare

This project uses Cloudflare's image optimization service to automatically compress and resize images for better performance.

## Key Benefits

- **Reduced file sizes**: Images are automatically compressed from 61.8 KiB to much smaller sizes
- **Responsive images**: Images are properly sized for their display dimensions (28x28 vs original 782x782)
- **Format optimization**: Cloudflare automatically serves the best format (AVIF, WebP, etc.) based on browser support
- **Better performance**: Faster page loads due to optimized images

## Usage Examples

### Basic Image Optimization

```tsx
import { cloudflareImage } from '@/lib/image-utils';

// Before: Large unoptimized image
<img src="/images/logo.webp" alt="Logo" />

// After: Optimized image
<img 
  src={cloudflareImage('/images/logo.webp', { width: 32, height: 32 })} 
  alt="Logo" 
  width={32}
  height={32}
/>
```

### Responsive Images for Different Screen Densities

```tsx
import { responsiveImage } from '@/lib/image-utils';

const logoSources = responsiveImage('/images/logo.webp', 32, { height: 32 });

<img 
  src={logoSources['1x']}
  srcSet={`${logoSources['1x']} 1x, ${logoSources['2x']} 2x, ${logoSources['3x']} 3x`}
  alt="Logo"
  width={32}
  height={32}
/>
```

### Advanced Options

```tsx
import { cloudflareImage } from '@/lib/image-utils';

<img 
  src={cloudflareImage('/images/hero.jpg', {
    width: 800,
    height: 400,
    quality: 90,
    fit: 'cover',
    gravity: 'center',
    format: 'auto'
  })} 
  alt="Hero image"
/>
```

## Implementation Details

The navigation component now uses optimized images:

1. **Desktop logo**: Optimized from 782x782 to 32x32 pixels
2. **Mobile logo**: Optimized from 782x782 to 36x36 pixels  
3. **Responsive images**: Multiple densities (1x, 2x, 3x) for crisp display on all screens
4. **Loading optimization**: `eager` for above-the-fold content, `lazy` for below-the-fold

## Cloudflare URL Structure

The optimization uses Cloudflare's `/cdn-cgi/image/` endpoint:

```
/cdn-cgi/image/w=32,h=32,f=auto,q=85,fit=scale-down/images/logo.webp
```

This automatically:
- Resizes to 32x32 pixels
- Chooses the best format (AVIF/WebP/etc.)
- Applies 85% quality compression
- Scales down while preserving aspect ratio
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../client'

export function useGalleryAlbums(page = 1) {
  return useQuery({
    queryKey: ['gallery', { page }],
    queryFn: () => unwrap(api.GET('/gallery', { params: { query: { page } } })),
    placeholderData: keepPreviousData,
  })
}

export function useGalleryAlbum(slug: string) {
  return useQuery({
    queryKey: ['gallery', slug],
    queryFn: () => unwrap(api.GET('/gallery/{slug}', { params: { path: { slug } } })),
  })
}

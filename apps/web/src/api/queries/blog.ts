import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../client'

export interface BlogFilters {
  page?: number
  q?: string
}

export function useBlogPosts(filters: BlogFilters = {}) {
  return useQuery({
    queryKey: ['blog', filters],
    queryFn: () =>
      unwrap(
        api.GET('/blog', {
          params: {
            query: { page: filters.page ?? 1, q: filters.q || undefined },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  })
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog', slug],
    queryFn: () => unwrap(api.GET('/blog/{slug}', { params: { path: { slug } } })),
  })
}

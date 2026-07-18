import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../client'

export function useTrackers(page = 1) {
  return useQuery({
    queryKey: ['trackers', { page }],
    queryFn: () =>
      unwrap(api.GET('/trackers', { params: { query: { page } } })),
    placeholderData: keepPreviousData,
  })
}

export function useTracker(slug: string) {
  return useQuery({
    queryKey: ['trackers', slug],
    queryFn: () =>
      unwrap(api.GET('/trackers/{slug}', { params: { path: { slug } } })),
  })
}

export function useRanklist(slug: string, keyword: string) {
  return useQuery({
    queryKey: ['trackers', slug, keyword],
    queryFn: () =>
      unwrap(
        api.GET('/trackers/{slug}/{keyword}', {
          params: { path: { slug, keyword } },
        }),
      ),
    enabled: keyword !== '',
  })
}

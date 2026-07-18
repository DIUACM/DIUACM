import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../client'

export function useProgrammers(filters: { page?: number; q?: string } = {}) {
  return useQuery({
    queryKey: ['programmers', filters],
    queryFn: () =>
      unwrap(
        api.GET('/programmers', {
          params: {
            query: { page: filters.page ?? 1, q: filters.q || undefined },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  })
}

export function useProgrammer(username: string) {
  return useQuery({
    queryKey: ['programmers', username],
    queryFn: () =>
      unwrap(
        api.GET('/programmers/{username}', { params: { path: { username } } }),
      ),
  })
}

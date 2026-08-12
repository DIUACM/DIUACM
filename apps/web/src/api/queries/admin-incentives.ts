import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { runBulkInChunks } from '../bulk'
import { api, unwrap } from '../client'
import type { AdminIncentiveApplication } from '../types'

export interface AdminIncentiveFilters {
  page?: number
  q?: string
  batch?: string
  semester?: string
}

export function useAdminIncentiveApplications(filters: AdminIncentiveFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'incentive-applications', filters],
    queryFn: () =>
      unwrap(
        api.GET('/admin/incentive-applications', {
          params: {
            query: {
              page: filters.page ?? 1,
              q: filters.q || undefined,
              batch: filters.batch || undefined,
              semester: filters.semester || undefined,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  })
}

/**
 * Fetch every application matching the active list filters for a file export.
 * Pages are requested in small parallel groups to keep large exports quick
 * without sending an unbounded burst of requests to the API.
 */
export async function fetchAdminIncentiveApplicationsForExport(
  filters: Omit<AdminIncentiveFilters, 'page'> = {},
): Promise<AdminIncentiveApplication[]> {
  const fetchPage = (page: number) =>
    unwrap(
      api.GET('/admin/incentive-applications', {
        params: {
          query: {
            page,
            perPage: 100,
            q: filters.q || undefined,
            batch: filters.batch || undefined,
            semester: filters.semester || undefined,
          },
        },
      }),
    )

  const firstPage = await fetchPage(1)
  const applications = [...firstPage.data]
  const remainingPages = Array.from(
    { length: Math.max(0, firstPage.meta.totalPages - 1) },
    (_, index) => index + 2,
  )

  for (let index = 0; index < remainingPages.length; index += 5) {
    const pageGroup = remainingPages.slice(index, index + 5)
    const results = await Promise.all(pageGroup.map(fetchPage))
    applications.push(...results.flatMap((result) => result.data))
  }

  return applications
}

/** Batch and semester values present across every application, for the filter selects. */
export function useAdminIncentiveFilterOptions() {
  return useQuery({
    queryKey: ['admin', 'incentive-applications', 'filters'],
    queryFn: () => unwrap(api.GET('/admin/incentive-applications/filters')),
  })
}

export function useAdminIncentiveApplication(id: number) {
  return useQuery({
    queryKey: ['admin', 'incentive-applications', id],
    queryFn: () =>
      unwrap(api.GET('/admin/incentive-applications/{id}', { params: { path: { id } } })),
  })
}

export function useAdminDeleteIncentiveApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE('/admin/incentive-applications/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'incentive-applications'] })
      void queryClient.invalidateQueries({ queryKey: ['incentive-application'] })
    },
  })
}

export function useAdminBulkDeleteIncentiveApplications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) =>
      runBulkInChunks(ids, (chunk) =>
        unwrap(api.POST('/admin/incentive-applications/bulk-delete', { body: { ids: chunk } })),
      ),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'incentive-applications'] })
      void queryClient.invalidateQueries({ queryKey: ['incentive-application'] })
    },
  })
}

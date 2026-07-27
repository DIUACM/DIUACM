import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../client'
import type { components } from '../schema'

export type SystemHealth = components['schemas']['SystemHealth']
export type SystemJob = components['schemas']['SystemJob']
export type SystemNotice = components['schemas']['SystemNotice']
export type CronRun = components['schemas']['CronRun']
export type CronRunStatus = components['schemas']['CronRunStatus']

/**
 * The sub-hourly jobs tick every 15 minutes, so anything faster than this is
 * polling for news that cannot have arrived. Refetching on focus covers the
 * case that matters — someone opening the tab to check on something.
 */
const HEALTH_REFETCH_MS = 60_000

export function useSystemHealth() {
  return useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: () => unwrap(api.GET('/admin/system/health')),
    refetchInterval: HEALTH_REFETCH_MS,
    refetchOnWindowFocus: true,
  })
}

export interface SystemRunFilters {
  page?: number
  job?: string
  status?: CronRunStatus
}

export function useSystemRuns(filters: SystemRunFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'system', 'runs', filters],
    queryFn: () =>
      unwrap(
        api.GET('/admin/system/runs', {
          params: {
            query: {
              page: filters.page ?? 1,
              job: filters.job || undefined,
              status: filters.status,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  })
}

/**
 * Acknowledge a fault. The API drops its cooldown row, so a recurrence alerts
 * immediately instead of being swallowed by a cooldown the admin started by
 * fixing the problem.
 */
export function useResolveNotice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) =>
      unwrap(api.DELETE('/admin/system/notices/{key}', { params: { path: { key } } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'system'] })
    },
  })
}

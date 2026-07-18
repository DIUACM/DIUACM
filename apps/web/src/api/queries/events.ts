import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../client'
import type { EventType, ParticipationScope } from '../types'

export interface EventFilters {
  page?: number
  type?: EventType
  scope?: ParticipationScope
  q?: string
}

export function useEvents(filters: EventFilters = {}, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['events', filters],
    queryFn: () =>
      unwrap(
        api.GET('/events', {
          params: {
            query: {
              page: filters.page ?? 1,
              type: filters.type,
              scope: filters.scope,
              q: filters.q || undefined,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
  })
}

export function useEvent(id: number, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['events', id],
    queryFn: () => unwrap(api.GET('/events/{id}', { params: { path: { id } } })),
  })
}

export function useEventAttendance(id: number, enabled = true) {
  return useQuery({
    queryKey: ['events', id, 'attendance'],
    queryFn: () =>
      unwrap(api.GET('/events/{id}/attendance', { params: { path: { id } } })),
    enabled,
  })
}

export function useEventPerformance(id: number, enabled = true) {
  return useQuery({
    queryKey: ['events', id, 'performance'],
    queryFn: () =>
      unwrap(api.GET('/events/{id}/performance', { params: { path: { id } } })),
    enabled,
  })
}

export function useMarkAttendance(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (password: string) =>
      unwrap(
        api.POST('/events/{id}/attendance', {
          params: { path: { id } },
          body: { password },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../client'
import type { components } from '../schema'
import type { EventType, ParticipationScope } from '../types'

export type AdminEvent = components['schemas']['AdminEvent']
export type AdminEventDetail = components['schemas']['AdminEventDetail']
export type PublishStatus = AdminEvent['status']

export interface AdminEventFilters {
  page?: number
  type?: EventType
  scope?: ParticipationScope
  status?: PublishStatus
  q?: string
}

export function useAdminEvents(filters: AdminEventFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'events', filters],
    queryFn: () =>
      unwrap(
        api.GET('/admin/events', {
          params: {
            query: {
              page: filters.page ?? 1,
              type: filters.type,
              scope: filters.scope,
              status: filters.status,
              q: filters.q || undefined,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useAdminEvent(id: number, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['admin', 'events', id],
    queryFn: () =>
      unwrap(api.GET('/admin/events/{id}', { params: { path: { id } } })),
  })
}

export interface AdminEventInput {
  title: string
  description?: string
  type?: EventType
  status?: PublishStatus
  startingAt: number
  endingAt: number
  eventLink?: string | null
  eventPassword?: string | null
  participationScope?: ParticipationScope
  openForAttendance?: boolean
  strictAttendance?: boolean
}

export function useAdminCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AdminEventInput) =>
      unwrap(api.POST('/admin/events', { body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] })
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useAdminUpdateEvent(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<AdminEventInput>) =>
      unwrap(api.PATCH('/admin/events/{id}', { params: { path: { id } }, body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] })
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useAdminDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE('/admin/events/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] })
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useAdminAddEventMedia(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData()
      body.append('image', file)
      return unwrap(
        api.POST('/admin/events/{id}/media', {
          params: { path: { id: eventId } },
          body: body as unknown as { image: string },
          bodySerializer: (formData) => formData as unknown as BodyInit,
        }),
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events', eventId] })
    },
  })
}

export function useAdminRemoveEventMedia(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mediaId: number) =>
      unwrap(
        api.DELETE('/admin/events/{id}/media/{mediaId}', {
          params: { path: { id: eventId, mediaId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events', eventId] })
    },
  })
}

export function useAdminAddAttendance(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      unwrap(
        api.POST('/admin/events/{id}/attendance', {
          params: { path: { id: eventId } },
          body: { userId },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events', eventId, 'attendance'] })
    },
  })
}

export function useAdminRemoveAttendance(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      unwrap(
        api.DELETE('/admin/events/{id}/attendance/{userId}', {
          params: { path: { id: eventId, userId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events', eventId, 'attendance'] })
    },
  })
}

export interface AdminPerformanceInput {
  position: number | null
  solveCount: number
  upsolveCount: number
}

export function useAdminSetPerformance(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, ...body }: AdminPerformanceInput & { userId: number }) =>
      unwrap(
        api.PUT('/admin/events/{id}/performance/{userId}', {
          params: { path: { id: eventId, userId } },
          body,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events', eventId, 'performance'] })
    },
  })
}

export function useAdminRemovePerformance(eventId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      unwrap(
        api.DELETE('/admin/events/{id}/performance/{userId}', {
          params: { path: { id: eventId, userId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events', eventId, 'performance'] })
    },
  })
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../client'
import type { components } from '../schema'
import type { PublishStatus } from './admin-events'

export type AdminTracker = components['schemas']['AdminTracker']
export type AdminTrackerDetail = components['schemas']['AdminTrackerDetail']
export type AdminRanklist = components['schemas']['AdminRanklist']
export type AdminRanklistDetail = components['schemas']['AdminRanklistDetail']

export interface AdminTrackerFilters {
  page?: number
  status?: PublishStatus
  q?: string
}

export function useAdminTrackers(filters: AdminTrackerFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'trackers', filters],
    queryFn: () =>
      unwrap(
        api.GET('/admin/trackers', {
          params: {
            query: {
              page: filters.page ?? 1,
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

export function useAdminTracker(id: number) {
  return useQuery({
    queryKey: ['admin', 'trackers', id],
    queryFn: () =>
      unwrap(api.GET('/admin/trackers/{id}', { params: { path: { id } } })),
  })
}

export interface AdminTrackerInput {
  title: string
  slug: string
  description?: string
  status?: PublishStatus
}

export function useAdminCreateTracker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AdminTrackerInput) =>
      unwrap(api.POST('/admin/trackers', { body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'trackers'] })
      void queryClient.invalidateQueries({ queryKey: ['trackers'] })
    },
  })
}

export function useAdminUpdateTracker(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<AdminTrackerInput>) =>
      unwrap(api.PATCH('/admin/trackers/{id}', { params: { path: { id } }, body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'trackers'] })
      void queryClient.invalidateQueries({ queryKey: ['trackers'] })
    },
  })
}

export interface ReorderItem {
  id: number
  order: number
}

interface AdminTrackerList {
  data: AdminTracker[]
  meta: components['schemas']['PaginationMeta']
}

function sortByOrder<T extends { id: number }>(rows: T[], items: ReorderItem[]): T[] {
  const order = new Map(items.map((item) => [item.id, item.order]))
  return [...rows].sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  )
}

export function useAdminReorderTrackers() {
  const queryClient = useQueryClient()
  // List queries are keyed ['admin', 'trackers', filters]; the detail query's
  // third element is a number, so the predicate keeps it out.
  const listFilter = {
    queryKey: ['admin', 'trackers'],
    predicate: (query: { queryKey: readonly unknown[] }) =>
      typeof query.queryKey[2] === 'object',
  }
  return useMutation({
    mutationFn: (items: ReorderItem[]) =>
      unwrap(api.POST('/admin/trackers/reorder', { body: { items } })),
    onMutate: async (items) => {
      await queryClient.cancelQueries(listFilter)
      const previous = queryClient.getQueriesData<AdminTrackerList>(listFilter)
      queryClient.setQueriesData<AdminTrackerList>(listFilter, (old) =>
        old ? { ...old, data: sortByOrder(old.data, items) } : old,
      )
      return { previous }
    },
    onError: (_error, _items, context) => {
      for (const [queryKey, data] of context?.previous ?? []) {
        queryClient.setQueryData(queryKey, data)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'trackers'] })
      void queryClient.invalidateQueries({ queryKey: ['trackers'] })
    },
  })
}

export function useAdminReorderRanklists(trackerId: number) {
  const queryClient = useQueryClient()
  const queryKey = ['admin', 'trackers', trackerId]
  return useMutation({
    mutationFn: (items: ReorderItem[]) =>
      unwrap(
        api.POST('/admin/trackers/{id}/ranklists/reorder', {
          params: { path: { id: trackerId } },
          body: { items },
        }),
      ),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<AdminTrackerDetail>(queryKey)
      queryClient.setQueryData<AdminTrackerDetail>(queryKey, (old) =>
        old ? { ...old, ranklists: sortByOrder(old.ranklists, items) } : old,
      )
      return { previous }
    },
    onError: (_error, _items, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
      void queryClient.invalidateQueries({ queryKey: ['trackers'] })
    },
  })
}

export function useAdminDeleteTracker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE('/admin/trackers/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'trackers'] })
      void queryClient.invalidateQueries({ queryKey: ['trackers'] })
    },
  })
}

export interface AdminRanklistInput {
  keyword: string
  description?: string
  status?: PublishStatus
  upsolveWeight?: number
  isLocked?: boolean
  considerStrictAttendance?: boolean
  autoAddUsers?: boolean
}

export function useAdminCreateRanklist(trackerId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AdminRanklistInput) =>
      unwrap(
        api.POST('/admin/trackers/{id}/ranklists', {
          params: { path: { id: trackerId } },
          body,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'trackers', trackerId] })
    },
  })
}

export function useAdminRanklist(id: number) {
  return useQuery({
    queryKey: ['admin', 'ranklists', id],
    queryFn: () =>
      unwrap(api.GET('/admin/ranklists/{id}', { params: { path: { id } } })),
  })
}

export function useAdminUpdateRanklist(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<AdminRanklistInput>) =>
      unwrap(api.PATCH('/admin/ranklists/{id}', { params: { path: { id } }, body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ranklists', id] })
      void queryClient.invalidateQueries({ queryKey: ['trackers'] })
    },
  })
}

export function useAdminDeleteRanklist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE('/admin/ranklists/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'trackers'] })
      void queryClient.invalidateQueries({ queryKey: ['trackers'] })
    },
  })
}

export function useAdminSetRanklistEvent(ranklistId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, weight }: { eventId: number; weight: number }) =>
      unwrap(
        api.PUT('/admin/ranklists/{id}/events/{eventId}', {
          params: { path: { id: ranklistId, eventId } },
          body: { weight },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ranklists', ranklistId] })
    },
  })
}

export function useAdminRemoveRanklistEvent(ranklistId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (eventId: number) =>
      unwrap(
        api.DELETE('/admin/ranklists/{id}/events/{eventId}', {
          params: { path: { id: ranklistId, eventId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ranklists', ranklistId] })
    },
  })
}

export function useAdminAddRanklistUser(ranklistId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      unwrap(
        api.PUT('/admin/ranklists/{id}/users/{userId}', {
          params: { path: { id: ranklistId, userId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ranklists', ranklistId] })
    },
  })
}

export function useAdminRemoveRanklistUser(ranklistId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      unwrap(
        api.DELETE('/admin/ranklists/{id}/users/{userId}', {
          params: { path: { id: ranklistId, userId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ranklists', ranklistId] })
    },
  })
}

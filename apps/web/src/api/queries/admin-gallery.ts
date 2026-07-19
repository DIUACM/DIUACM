import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../client'
import type { components } from '../schema'
import type { PublishStatus } from './admin-events'
import type { ReorderItem } from './admin-trackers'

export type AdminGalleryAlbum = components['schemas']['AdminGalleryAlbum']
export type AdminGalleryAlbumDetail = components['schemas']['AdminGalleryAlbumDetail']
export type AdminGalleryMedia = components['schemas']['AdminGalleryMedia']

export interface AdminGalleryFilters {
  page?: number
  status?: PublishStatus
  q?: string
}

export function useAdminGalleryAlbums(filters: AdminGalleryFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'gallery', filters],
    queryFn: () =>
      unwrap(
        api.GET('/admin/gallery', {
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
  })
}

export function useAdminGalleryAlbum(id: number) {
  return useQuery({
    queryKey: ['admin', 'gallery', id],
    queryFn: () =>
      unwrap(api.GET('/admin/gallery/{id}', { params: { path: { id } } })),
  })
}

export interface AdminGalleryAlbumInput {
  title: string
  slug: string
  description?: string
  status?: PublishStatus
}

export function useAdminCreateGalleryAlbum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AdminGalleryAlbumInput) =>
      unwrap(api.POST('/admin/gallery', { body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] })
      void queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}

export function useAdminUpdateGalleryAlbum(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<AdminGalleryAlbumInput>) =>
      unwrap(api.PATCH('/admin/gallery/{id}', { params: { path: { id } }, body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] })
      void queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}

export function useAdminDeleteGalleryAlbum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE('/admin/gallery/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] })
      void queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}

interface AdminGalleryAlbumList {
  data: (AdminGalleryAlbum & { mediaCount: number })[]
  meta: components['schemas']['PaginationMeta']
}

function sortByOrder<T extends { id: number }>(rows: T[], items: ReorderItem[]): T[] {
  const order = new Map(items.map((item) => [item.id, item.order]))
  return [...rows].sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  )
}

export function useAdminReorderGalleryAlbums() {
  const queryClient = useQueryClient()
  // List queries are keyed ['admin', 'gallery', filters]; the detail query's
  // third element is a number, so the predicate keeps it out.
  const listFilter = {
    queryKey: ['admin', 'gallery'],
    predicate: (query: { queryKey: readonly unknown[] }) =>
      typeof query.queryKey[2] === 'object',
  }
  return useMutation({
    mutationFn: (items: ReorderItem[]) =>
      unwrap(api.POST('/admin/gallery/reorder', { body: { items } })),
    onMutate: async (items) => {
      await queryClient.cancelQueries(listFilter)
      const previous = queryClient.getQueriesData<AdminGalleryAlbumList>(listFilter)
      queryClient.setQueriesData<AdminGalleryAlbumList>(listFilter, (old) =>
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
      void queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] })
      void queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}

export function useAdminAddGalleryMedia(albumId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData()
      body.append('image', file)
      return unwrap(
        api.POST('/admin/gallery/{id}/media', {
          params: { path: { id: albumId } },
          body: body as unknown as { image: string },
          bodySerializer: (formData) => formData as unknown as BodyInit,
        }),
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] })
      void queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}

export function useAdminRemoveGalleryMedia(albumId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mediaId: number) =>
      unwrap(
        api.DELETE('/admin/gallery/{id}/media/{mediaId}', {
          params: { path: { id: albumId, mediaId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'gallery'] })
      void queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}

export function useAdminReorderGalleryMedia(albumId: number) {
  const queryClient = useQueryClient()
  const queryKey = ['admin', 'gallery', albumId]
  return useMutation({
    mutationFn: (items: ReorderItem[]) =>
      unwrap(
        api.POST('/admin/gallery/{id}/media/reorder', {
          params: { path: { id: albumId } },
          body: { items },
        }),
      ),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<AdminGalleryAlbumDetail>(queryKey)
      queryClient.setQueryData<AdminGalleryAlbumDetail>(queryKey, (old) =>
        old ? { ...old, media: sortByOrder(old.media, items) } : old,
      )
      return { previous }
    },
    onError: (_error, _items, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
      void queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })
}

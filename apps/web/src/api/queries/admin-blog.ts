import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../client'
import type { components } from '../schema'
import type { PublishStatus } from './admin-events'

export type AdminBlogPost = components['schemas']['AdminBlogPost']
export type AdminBlogPostDetail = components['schemas']['AdminBlogPostDetail']

export interface AdminBlogFilters {
  page?: number
  status?: PublishStatus
  q?: string
}

export function useAdminBlogPosts(filters: AdminBlogFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'blog', filters],
    queryFn: () =>
      unwrap(
        api.GET('/admin/blog', {
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

export function useAdminBlogPost(id: number) {
  return useQuery({
    queryKey: ['admin', 'blog', id],
    queryFn: () => unwrap(api.GET('/admin/blog/{id}', { params: { path: { id } } })),
  })
}

export interface AdminBlogPostInput {
  title: string
  slug: string
  content?: string
  status?: PublishStatus
}

export function useAdminCreateBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AdminBlogPostInput) =>
      unwrap(api.POST('/admin/blog', { body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'blog'] })
      void queryClient.invalidateQueries({ queryKey: ['blog'] })
    },
  })
}

export function useAdminUpdateBlogPost(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<AdminBlogPostInput>) =>
      unwrap(api.PATCH('/admin/blog/{id}', { params: { path: { id } }, body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'blog'] })
      void queryClient.invalidateQueries({ queryKey: ['blog'] })
    },
  })
}

export function useAdminDeleteBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE('/admin/blog/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'blog'] })
      void queryClient.invalidateQueries({ queryKey: ['blog'] })
    },
  })
}

export function useAdminSetBlogFeaturedImage(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData()
      body.append('image', file)
      return unwrap(
        api.POST('/admin/blog/{id}/featured-image', {
          params: { path: { id: postId } },
          body: body as unknown as { image: string },
          bodySerializer: (formData) => formData as unknown as BodyInit,
        }),
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'blog'] })
      void queryClient.invalidateQueries({ queryKey: ['blog'] })
    },
  })
}

export function useAdminRemoveBlogFeaturedImage(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.DELETE('/admin/blog/{id}/featured-image', {
          params: { path: { id: postId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'blog'] })
      void queryClient.invalidateQueries({ queryKey: ['blog'] })
    },
  })
}

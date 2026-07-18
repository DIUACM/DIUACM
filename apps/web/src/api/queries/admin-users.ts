import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../client'
import type { Permission } from '../types'

export interface AdminUserFilters {
  page?: number
  q?: string
  permission?: Permission
}

export function useAdminUsers(filters: AdminUserFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () =>
      unwrap(
        api.GET('/admin/users', {
          params: {
            query: {
              page: filters.page ?? 1,
              q: filters.q || undefined,
              permission: filters.permission,
            },
          },
        }),
      ),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useAdminUser(id: number) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () =>
      unwrap(api.GET('/admin/users/{id}', { params: { path: { id } } })),
  })
}

export interface AdminUserCreateInput {
  name: string
  email: string
  username: string
  password?: string
  studentId?: string
  maxCfRating?: number | null
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AdminUserCreateInput) =>
      unwrap(api.POST('/admin/users', { body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export interface AdminUserUpdateInput {
  name?: string
  email?: string
  username?: string
  password?: string | null
  studentId?: string | null
  maxCfRating?: number | null
}

export function useAdminUpdateUser(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AdminUserUpdateInput) =>
      unwrap(api.PATCH('/admin/users/{id}', { params: { path: { id } }, body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      unwrap(api.DELETE('/admin/users/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useAdminTogglePermission(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      permission,
      enabled,
    }: {
      permission: Permission
      enabled: boolean
    }) =>
      unwrap(
        api.PUT('/admin/users/{id}/permissions/{permission}', {
          params: { path: { id, permission } },
          body: { enabled },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../client'
import type { HandleType } from '../types'

export function useAuthConfig() {
  return useQuery({
    queryKey: ['auth', 'config'],
    queryFn: () => unwrap(api.GET('/auth/config')),
    staleTime: Infinity,
  })
}

export function useMyHandles(enabled: boolean) {
  return useQuery({
    queryKey: ['auth', 'handles'],
    queryFn: () => unwrap(api.GET('/auth/me/handles')),
    enabled,
  })
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (body: {
      name?: string
      username?: string
      studentId?: string | null
    }) => unwrap(api.PATCH('/auth/me', { body })),
  })
}

export function useUploadProfileImage() {
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData()
      body.append('image', file)
      return unwrap(
        api.PUT('/auth/me/image', {
          // openapi-fetch serializes objects to JSON by default; hand it a
          // ready FormData body so the browser sets the multipart boundary.
          body: body as unknown as { image: string },
          bodySerializer: (formData) => formData as unknown as BodyInit,
        }),
      )
    },
  })
}

export function useSetHandle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ type, handle }: { type: HandleType; handle: string }) =>
      unwrap(
        api.PUT('/auth/me/handles/{type}', {
          params: { path: { type } },
          body: { handle },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth', 'handles'] })
    },
  })
}

export function useDeleteHandle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (type: HandleType) =>
      unwrap(
        api.DELETE('/auth/me/handles/{type}', { params: { path: { type } } }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth', 'handles'] })
    },
  })
}

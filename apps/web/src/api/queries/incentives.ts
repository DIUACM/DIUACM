import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../client'
import type { IncentiveApplicationInput } from '../types'

export function useMyIncentiveApplication(enabled = true) {
  return useQuery({
    queryKey: ['incentive-application', 'me'],
    queryFn: () => unwrap(api.GET('/incentive-applications/me')),
    enabled,
  })
}

export function useSubmitIncentiveApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: IncentiveApplicationInput) =>
      unwrap(api.PUT('/incentive-applications/me', { body })),
    onSuccess: (data) => {
      // The response already carries the saved row, so seed the cache with it
      // rather than making the page wait on a refetch to leave the form.
      queryClient.setQueryData(['incentive-application', 'me'], data)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'incentive-applications'] })
    },
  })
}

/* eslint-disable react-refresh/only-export-components */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, ApiError, getToken, setOnUnauthorized, setToken, unwrap } from '@/api/client'
import type { AuthResponse, User } from '@/api/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  /** True while a stored token is being validated on first load. */
  isLoading: boolean
  login: (auth: AuthResponse) => void
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken)
  const queryClient = useQueryClient()

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => unwrap(api.GET('/auth/me')),
    enabled: token !== null,
    staleTime: 5 * 60 * 1000,
    // A definitive 401 means the token is dead (the client middleware already
    // logs out on it) — don't retry. Anything else is likely transient
    // (network, 5xx), and giving up would wrongly render the logged-out UI.
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 401) && failureCount < 2,
  })

  const logout = useCallback(() => {
    setToken(null)
    setTokenState(null)
    queryClient.removeQueries({ queryKey: ['auth'] })
  }, [queryClient])

  const login = useCallback(
    (auth: AuthResponse) => {
      setToken(auth.token)
      setTokenState(auth.token)
      queryClient.setQueryData(['auth', 'me'], { user: auth.user })
    },
    [queryClient],
  )

  const setUser = useCallback(
    (user: User) => {
      queryClient.setQueryData(['auth', 'me'], { user })
    },
    [queryClient],
  )

  useEffect(() => {
    setOnUnauthorized(logout)
    return () => setOnUnauthorized(null)
  }, [logout])

  const value: AuthContextValue = {
    user: token !== null ? (meQuery.data?.user ?? null) : null,
    isAuthenticated: token !== null,
    isLoading: token !== null && meQuery.isPending,
    login,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

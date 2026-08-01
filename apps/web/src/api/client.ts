import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './schema'

const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8787'
  : 'https://api.diuacm.com'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

const TOKEN_KEY = 'diuacm.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token === null) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
}

let onUnauthorized: (() => void) | null = null

/** Registered by AuthProvider so an expired/revoked token logs the user out. */
export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler
}

const authMiddleware: Middleware = {
  onRequest({ request }) {
    const token = getToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
  onResponse({ request, response }) {
    // A 401 on an authenticated request means the token is dead — except on
    // the login endpoints, where it just means wrong credentials (the
    // middleware attaches the stored token to those requests too).
    const isLoginRequest = /\/auth\/(login|google)$/.test(new URL(request.url).pathname)
    const isIdentityRequest = new URL(request.url).pathname === '/auth/me'
    const invalidSession =
      response.status === 401 || (response.status === 404 && isIdentityRequest)
    if (invalidSession && request.headers.has('Authorization') && !isLoginRequest) {
      onUnauthorized?.()
    }
    return response
  },
}

export const api = createClient<paths>({ baseUrl: API_BASE_URL })
api.use(authMiddleware)

/** Matches the API's validation-error shape: `{ error, issues: [{ field, message }] }`. */
export interface ApiIssue {
  field?: string
  message?: string
}

export class ApiError extends Error {
  status: number
  issues: ApiIssue[]

  constructor(status: number, body: unknown) {
    const record = (typeof body === 'object' && body !== null ? body : {}) as {
      error?: unknown
      issues?: unknown
    }
    super(
      typeof record.error === 'string'
        ? record.error
        : `Request failed with status ${status}`,
    )
    this.name = 'ApiError'
    this.status = status
    this.issues = Array.isArray(record.issues) ? (record.issues as ApiIssue[]) : []
  }

  /** Field-level message from the `issues` array, if the API returned one. */
  issueFor(field: string): string | undefined {
    // Nested paths come back dotted (e.g. "handles.codeforces"), so match the
    // exact field or its leading segment.
    return this.issues.find(
      (issue) => issue.field === field || issue.field?.startsWith(`${field}.`),
    )?.message
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

type ApiResult<T> = { data?: T; error?: unknown; response: Response }

/** Await an openapi-fetch call, throwing a typed ApiError on failure. */
export async function unwrap<T>(promise: Promise<ApiResult<T>>): Promise<T> {
  const { data, error, response } = await promise
  if (error !== undefined || data === undefined) {
    throw new ApiError(response.status, error)
  }
  return data
}

import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { api, errorMessage, unwrap } from '@/api/client'
import { useAuthConfig } from '@/api/queries/auth'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from './auth-context'
import { useTheme } from '@/components/layout/theme-provider'

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      theme: string
      size: string
      width?: number
      text?: string
      shape?: string
    },
  ) => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client'
type GsiScriptStatus = 'loading' | 'ready' | 'error'

function useGsiScript(attempt: number): GsiScriptStatus {
  const [status, setStatus] = useState<GsiScriptStatus>(() =>
    window.google?.accounts?.id ? 'ready' : 'loading',
  )

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setStatus('ready')
      return
    }

    setStatus('loading')
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`,
    )
    if (attempt > 0 && script) {
      script.remove()
      script = null
    }
    if (!script) {
      script = document.createElement('script')
      script.src = GSI_SRC
      script.async = true
      document.head.appendChild(script)
    }

    let timeout: number | undefined
    const clearLoadTimeout = () => {
      if (timeout !== undefined) window.clearTimeout(timeout)
    }
    const onLoad = () => {
      clearLoadTimeout()
      setStatus(window.google?.accounts?.id ? 'ready' : 'error')
    }
    const onError = () => {
      clearLoadTimeout()
      setStatus('error')
    }
    timeout = window.setTimeout(onError, 10_000)
    script.addEventListener('load', onLoad)
    script.addEventListener('error', onError)
    return () => {
      clearLoadTimeout()
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
    }
  }, [attempt])

  return status
}

export function GoogleSignInButton({ returnTo = '/' }: { returnTo?: string }) {
  const {
    data: config,
    isError: configError,
    isPending: configPending,
    isFetching: configFetching,
    refetch: refetchConfig,
  } = useAuthConfig()
  const [scriptAttempt, setScriptAttempt] = useState(0)
  const [buttonWidth, setButtonWidth] = useState<number>()
  const scriptStatus = useGsiScript(scriptAttempt)
  const containerRef = useRef<HTMLDivElement>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()

  const googleSignIn = useMutation({
    mutationFn: (idToken: string) =>
      unwrap(api.POST('/auth/google', { body: { idToken } })),
    onSuccess: (auth) => {
      login(auth)
      toast.success(`Welcome, ${auth.user.name}!`)
      navigate(returnTo, { replace: true })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const clientId = config?.googleClientId

  useEffect(() => {
    const container = containerRef.current
    if (scriptStatus !== 'ready' || !clientId || !container) return

    const updateWidth = () => {
      const width = Math.min(320, Math.floor(container.clientWidth))
      setButtonWidth(width > 0 ? width : undefined)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)
    return () => observer.disconnect()
  }, [scriptStatus, clientId])

  useEffect(() => {
    const google = window.google?.accounts?.id
    if (scriptStatus !== 'ready' || !google || !clientId) return

    google.initialize({
      client_id: clientId,
      callback: (response) => googleSignIn.mutate(response.credential),
    })
    // googleSignIn.mutate is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptStatus, clientId])

  useEffect(() => {
    const google = window.google?.accounts?.id
    const container = containerRef.current
    if (!google || !container || !buttonWidth) return

    container.innerHTML = ''
    google.renderButton(container, {
      theme: document.documentElement.classList.contains('dark')
        ? 'filled_black'
        : 'outline',
      size: 'large',
      shape: 'pill',
      width: buttonWidth,
      text: 'continue_with',
    })
  }, [theme, buttonWidth])

  const unavailable =
    configError ||
    scriptStatus === 'error' ||
    (!configPending && config !== undefined && !clientId)

  if (unavailable) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-2 rounded-2xl bg-muted/50 px-4 py-3 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Google sign-in is unavailable right now.
        </p>
        <button
          type="button"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
          disabled={configFetching}
          onClick={() => {
            if (configError || !clientId) void refetchConfig()
            if (scriptStatus === 'error') {
              setScriptAttempt((current) => current + 1)
            }
          }}
        >
          {configFetching ? 'Retrying…' : 'Try again'}
        </button>
      </div>
    )
  }

  if (configPending || scriptStatus === 'loading' || !clientId) {
    return <Skeleton className="mx-auto h-10 w-80 max-w-full rounded-full" />
  }

  return (
    <div
      ref={containerRef}
      className="flex w-full min-w-0 max-w-full justify-center overflow-hidden"
    />
  )
}

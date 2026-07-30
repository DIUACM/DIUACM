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

function useGsiScript(): boolean {
  const [ready, setReady] = useState(() => Boolean(window.google?.accounts?.id))

  useEffect(() => {
    if (ready) return
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`,
    )
    if (!script) {
      script = document.createElement('script')
      script.src = GSI_SRC
      script.async = true
      document.head.appendChild(script)
    }
    const onLoad = () => setReady(true)
    script.addEventListener('load', onLoad)
    return () => script.removeEventListener('load', onLoad)
  }, [ready])

  return ready
}

export function GoogleSignInButton() {
  const { data: config } = useAuthConfig()
  const scriptReady = useGsiScript()
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
      navigate('/')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const clientId = config?.googleClientId

  useEffect(() => {
    const google = window.google?.accounts?.id
    const container = containerRef.current
    if (!scriptReady || !google || !clientId || !container) return

    google.initialize({
      client_id: clientId,
      callback: (response) => googleSignIn.mutate(response.credential),
    })
    container.innerHTML = ''
    google.renderButton(container, {
      theme: document.documentElement.classList.contains('dark')
        ? 'filled_black'
        : 'outline',
      size: 'large',
      shape: 'pill',
      width: 320,
      text: 'continue_with',
    })
    // googleSignIn.mutate is stable; re-render the button when theme flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady, clientId, theme])

  if (!clientId || !scriptReady) {
    return <Skeleton className="mx-auto h-10 w-80 max-w-full rounded-full" />
  }

  return <div ref={containerRef} className="flex justify-center" />
}

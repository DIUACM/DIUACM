import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApiError } from './api/client'
import { ThemeProvider } from './components/layout/theme-provider'
import { AuthProvider } from './features/auth/auth-context'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      // Don't let a stale navigator.onLine=false pause fetches forever;
      // failures surface through our error states instead.
      networkMode: 'always',
      retry: (failureCount, error) => {
        // Client errors (404, 401, validation) won't heal on retry.
        if (error instanceof ApiError && error.status < 500) return false
        return failureCount < 2
      },
    },
    mutations: {
      networkMode: 'always',
    },
  },
})

if (import.meta.env.DEV) {
  // Handy for poking query state from the browser console during development.
  ;(window as unknown as { __queryClient?: QueryClient }).__queryClient = queryClient
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Unable to start the app: root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)

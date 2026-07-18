import { Outlet } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
      <Toaster richColors position="top-center" />
    </div>
  )
}

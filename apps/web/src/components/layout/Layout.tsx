import { Outlet, ScrollRestoration } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Without this a client-side navigation keeps the previous scroll
          offset, so opening a card from halfway down a list lands you halfway
          down the detail page. Back/forward still restore their old offset. */}
      <ScrollRestoration />
      <Navbar />
      <main className="container flex-1 py-8 sm:py-10">
        <Outlet />
      </main>
      <Footer />
      <Toaster richColors position="top-center" />
    </div>
  )
}

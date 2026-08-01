import { LogOut, Menu, Shield, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { useAuth } from '@/features/auth/auth-context'
import { isAdmin } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/events', label: 'Events' },
  { to: '/trackers', label: 'Trackers' },
  { to: '/programmers', label: 'Programmers' },
  { to: '/gallery', label: 'Gallery' },
]

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 py-3">
      <div className="container">
        <div className="flex h-14 items-center gap-4 rounded-full bg-card px-3 shadow-clay ring-1 ring-foreground/5 sm:px-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight"
          >
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-0.5 shadow-clay-sm ring-1 ring-black/5 dark:bg-foreground/5 dark:ring-white/10">
              <img
                src="/brands/diu-acm-logo.png"
                alt=""
                className="size-full object-cover dark:brightness-125"
              />
            </span>
            DIU ACM
          </Link>

          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground',
                    // The active link is stamped into the bar rather than raised
                    // off it, so it can't be mistaken for a button.
                    isActive &&
                      'bg-accent text-accent-foreground shadow-clay-inset hover:bg-accent',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />

            {isLoading ? (
              <Skeleton className="size-9 rounded-full" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full shadow-clay-sm outline-none transition-shadow hover:shadow-clay focus-visible:ring-2 focus-visible:ring-ring">
                  <UserAvatar name={user.name} image={user.image} className="size-9" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="truncate font-medium">{user.name}</div>
                    <div className="truncate text-xs font-normal text-muted-foreground">
                      @{user.username}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserIcon className="size-4" /> Profile
                  </DropdownMenuItem>
                  {isAdmin(user) && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="size-4" /> Admin panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} variant="destructive">
                    <LogOut className="size-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Button size="sm" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
              </div>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-0.5 shadow-clay-sm ring-1 ring-black/5 dark:bg-foreground/5 dark:ring-white/10">
                      <img
                        src="/brands/diu-acm-logo.png"
                        alt=""
                    className="size-full object-cover dark:brightness-125"
                      />
                    </span>
                    DIU ACM
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1.5 px-4">
                  {NAV_LINKS.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                          isActive &&
                            'bg-accent text-accent-foreground shadow-clay-inset',
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                  {!isAuthenticated && (
                    <NavLink
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="mt-2 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground shadow-clay-sm"
                    >
                      Log in
                    </NavLink>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

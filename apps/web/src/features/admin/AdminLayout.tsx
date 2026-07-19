import { CalendarDays, ChartNoAxesColumn, Images, Newspaper, ShieldAlert, Users } from 'lucide-react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/auth-context'
import { hasPermission, isAdmin } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Permission, User } from '@/api/types'

interface AdminSection {
  to: string
  label: string
  icon: typeof Users
  permission: Permission
}

const SECTIONS: AdminSection[] = [
  { to: '/admin/users', label: 'Users', icon: Users, permission: 'manage_users' },
  { to: '/admin/events', label: 'Events', icon: CalendarDays, permission: 'manage_events' },
  { to: '/admin/trackers', label: 'Trackers', icon: ChartNoAxesColumn, permission: 'manage_trackers' },
  { to: '/admin/gallery', label: 'Gallery', icon: Images, permission: 'manage_gallery' },
  { to: '/admin/blog', label: 'Blog', icon: Newspaper, permission: 'manage_blog' },
]

function visibleSections(user: User | null): AdminSection[] {
  // manage_attendance only unlocks the attendance part of event pages, so
  // the Events section is shown for it too.
  return SECTIONS.filter(
    (section) =>
      hasPermission(user, section.permission) ||
      (section.to === '/admin/events' && hasPermission(user, 'manage_attendance')),
  )
}

export function AdminLayout() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (!isAdmin(user)) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <ShieldAlert className="size-10 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">No admin access</h1>
        <p className="max-w-md text-muted-foreground">
          Your account doesn&apos;t hold any admin permissions. Ask the super
          admin if you believe this is a mistake.
        </p>
      </div>
    )
  }

  const sections = visibleSections(user)

  // Land on the first section the user can actually see.
  if (location.pathname === '/admin' && sections.length > 0) {
    return <Navigate to={sections[0].to} replace />
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      <aside className="shrink-0 md:w-44">
        <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Admin
        </p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {sections.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                  isActive && 'bg-accent text-foreground',
                )
              }
            >
              <section.icon className="size-4" />
              {section.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}

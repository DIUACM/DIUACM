import type { EventType, HandleType, ParticipationScope, Permission, User } from '@/api/types'
import type { ContestKind, ContestPlatform } from '@diuacm/contest-link'

export const PERMISSION_LABELS: Record<Permission, string> = {
  manage_users: 'Manage users',
  manage_events: 'Manage events',
  manage_attendance: 'Manage attendance',
  manage_trackers: 'Manage trackers',
  manage_gallery: 'Manage gallery',
  manage_blog: 'Manage blog',
  manage_system: 'View system health',
}

export const PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[]

/** The super admin reports every permission, so the array check suffices. */
export function hasPermission(user: User | null, permission: Permission): boolean {
  return user?.permissions.includes(permission) ?? false
}

export function isAdmin(user: User | null): boolean {
  return (user?.permissions.length ?? 0) > 0 || (user?.isSuperAdmin ?? false)
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  contest: 'Contest',
  class: 'Class',
  other: 'Other',
}

export const SCOPE_LABELS: Record<ParticipationScope, string> = {
  open_for_all: 'Open for all',
  only_girls: 'Girls only',
  junior_programmers: 'Junior programmers',
  selected_persons: 'Selected persons',
}

export const HANDLE_LABELS: Record<HandleType, string> = {
  codeforces: 'Codeforces',
  vjudge: 'VJudge',
  atcoder: 'AtCoder',
}

export const HANDLE_TYPES: HandleType[] = ['codeforces', 'vjudge', 'atcoder']

export const CONTEST_PLATFORM_LABELS: Record<ContestPlatform, string> = {
  codeforces: 'Codeforces',
  vjudge: 'VJudge',
  atcoder: 'AtCoder',
}

export const CONTEST_KIND_LABELS: Record<ContestKind, string> = {
  contest: 'Contest',
  gym: 'Gym',
  group: 'Group contest',
}

export function handleProfileUrl(type: HandleType, handle: string): string {
  switch (type) {
    case 'codeforces':
      return `https://codeforces.com/profile/${encodeURIComponent(handle)}`
    case 'vjudge':
      return `https://vjudge.net/user/${encodeURIComponent(handle)}`
    case 'atcoder':
      return `https://atcoder.jp/users/${encodeURIComponent(handle)}`
  }
}

/** Codeforces rating tiers → title + color classes (light/dark aware). */
export function cfRatingTier(rating: number): { title: string; className: string } {
  if (rating >= 3000) return { title: 'Legendary Grandmaster', className: 'text-red-600 dark:text-red-400' }
  if (rating >= 2600) return { title: 'International Grandmaster', className: 'text-red-600 dark:text-red-400' }
  if (rating >= 2400) return { title: 'Grandmaster', className: 'text-red-600 dark:text-red-400' }
  if (rating >= 2300) return { title: 'International Master', className: 'text-orange-500 dark:text-orange-400' }
  if (rating >= 2100) return { title: 'Master', className: 'text-orange-500 dark:text-orange-400' }
  if (rating >= 1900) return { title: 'Candidate Master', className: 'text-violet-600 dark:text-violet-400' }
  if (rating >= 1600) return { title: 'Expert', className: 'text-blue-600 dark:text-blue-400' }
  if (rating >= 1400) return { title: 'Specialist', className: 'text-cyan-600 dark:text-cyan-400' }
  if (rating >= 1200) return { title: 'Pupil', className: 'text-green-600 dark:text-green-400' }
  return { title: 'Newbie', className: 'text-neutral-500 dark:text-neutral-400' }
}

import type { ComponentType } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from '@/components/layout/Layout'
import { RouteError } from '@/components/layout/RouteError'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { BlogPage } from '@/features/blog/BlogPage'
import { EventDetailPage } from '@/features/events/EventDetailPage'
import { EventsPage } from '@/features/events/EventsPage'
import { GalleryAlbumPage } from '@/features/gallery/GalleryAlbumPage'
import { GalleryPage } from '@/features/gallery/GalleryPage'
import { HomePage } from '@/features/home/HomePage'
import { NotFoundPage } from '@/features/home/NotFoundPage'
import {
  ContactPage,
  PrivacyPage,
  TermsPage,
} from '@/features/info/PublicInfoPages'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ProgrammerDetailPage } from '@/features/programmers/ProgrammerDetailPage'
import { ProgrammersPage } from '@/features/programmers/ProgrammersPage'
import { TrackerDetailPage } from '@/features/trackers/TrackerDetailPage'
import { TrackersPage } from '@/features/trackers/TrackersPage'

// The admin area pulls in the heavy editor stack (TipTap, dnd-kit, …) and the
// blog post page pulls in markdown/KaTeX/highlight.js, so those routes are
// code-split: each `lazy` below becomes a separate chunk downloaded on demand.
const lazily =
  (load: () => Promise<Record<string, unknown>>, name: string) => async () => ({
    Component: (await load())[name] as ComponentType,
  })

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        // Pathless wrapper so a throw from any page below — including a failed
        // `lazy` chunk download — renders inside the Layout's outlet. Putting
        // `errorElement` on the root route instead would replace the whole
        // shell, taking the nav and footer down with the page.
        errorElement: <RouteError />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/events', element: <EventsPage /> },
          { path: '/events/:id', element: <EventDetailPage /> },
          { path: '/trackers', element: <TrackersPage /> },
          { path: '/trackers/:slug', element: <TrackerDetailPage /> },
          { path: '/programmers', element: <ProgrammersPage /> },
          { path: '/programmers/:username', element: <ProgrammerDetailPage /> },
          { path: '/gallery', element: <GalleryPage /> },
          { path: '/gallery/:slug', element: <GalleryAlbumPage /> },
          { path: '/blog', element: <BlogPage /> },
          { path: '/contact', element: <ContactPage /> },
          { path: '/privacy', element: <PrivacyPage /> },
          { path: '/terms', element: <TermsPage /> },
          {
            path: '/contests/uta',
            lazy: lazily(
              () => import('@/features/contests/ContestArchivePage'),
              'UtaContestArchivePage',
            ),
          },
          {
            path: '/contests/topc',
            lazy: lazily(
              () => import('@/features/contests/ContestArchivePage'),
              'TopcContestArchivePage',
            ),
          },
          {
            path: '/green-sheet',
            lazy: lazily(
              () => import('@/features/green-sheet/GreenSheetPage'),
              'GreenSheetPage',
            ),
          },
          {
            path: '/blog/:slug',
            lazy: lazily(() => import('@/features/blog/BlogPostPage'), 'BlogPostPage'),
          },
          { path: '/login', element: <LoginPage /> },
          {
            element: <RequireAuth />,
            children: [{ path: '/profile', element: <ProfilePage /> }],
          },
          {
            path: '/admin',
            lazy: lazily(() => import('@/features/admin/AdminLayout'), 'AdminLayout'),
            children: [
              {
                path: 'users',
                lazy: lazily(() => import('@/features/admin/users/AdminUsersPage'), 'AdminUsersPage'),
              },
              {
                path: 'users/:id',
                lazy: lazily(
                  () => import('@/features/admin/users/AdminUserDetailPage'),
                  'AdminUserDetailPage',
                ),
              },
              {
                path: 'events',
                lazy: lazily(
                  () => import('@/features/admin/events/AdminEventsPage'),
                  'AdminEventsPage',
                ),
              },
              {
                path: 'events/:id',
                lazy: lazily(
                  () => import('@/features/admin/events/AdminEventDetailPage'),
                  'AdminEventDetailPage',
                ),
              },
              {
                path: 'trackers',
                lazy: lazily(
                  () => import('@/features/admin/trackers/AdminTrackersPage'),
                  'AdminTrackersPage',
                ),
              },
              {
                path: 'trackers/:id',
                lazy: lazily(
                  () => import('@/features/admin/trackers/AdminTrackerDetailPage'),
                  'AdminTrackerDetailPage',
                ),
              },
              {
                path: 'ranklists/:id',
                lazy: lazily(
                  () => import('@/features/admin/trackers/AdminRanklistDetailPage'),
                  'AdminRanklistDetailPage',
                ),
              },
              {
                path: 'gallery',
                lazy: lazily(
                  () => import('@/features/admin/gallery/AdminGalleryPage'),
                  'AdminGalleryPage',
                ),
              },
              {
                path: 'gallery/:id',
                lazy: lazily(
                  () => import('@/features/admin/gallery/AdminGalleryAlbumDetailPage'),
                  'AdminGalleryAlbumDetailPage',
                ),
              },
              {
                path: 'blog',
                lazy: lazily(() => import('@/features/admin/blog/AdminBlogPage'), 'AdminBlogPage'),
              },
              {
                path: 'blog/:id',
                lazy: lazily(
                  () => import('@/features/admin/blog/AdminBlogPostDetailPage'),
                  'AdminBlogPostDetailPage',
                ),
              },
              {
                path: 'system',
                lazy: lazily(
                  () => import('@/features/admin/system/AdminSystemPage'),
                  'AdminSystemPage',
                ),
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App

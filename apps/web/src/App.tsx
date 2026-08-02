import type { ComponentType } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from '@/components/layout/Layout'
import { RouteError } from '@/components/layout/RouteError'
import { HomePage } from '@/features/home/HomePage'

// Keep the home shell small and route-split everything else. In particular,
// the editor, markdown renderer, data tables, and Google sign-in code should
// never be part of the first visit's JavaScript payload.
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
          {
            path: '/events',
            lazy: lazily(() => import('@/features/events/EventsPage'), 'EventsPage'),
          },
          {
            path: '/events/:id',
            lazy: lazily(() => import('@/features/events/EventDetailPage'), 'EventDetailPage'),
          },
          {
            path: '/trackers',
            lazy: lazily(() => import('@/features/trackers/TrackersPage'), 'TrackersPage'),
          },
          {
            path: '/trackers/:slug',
            lazy: lazily(() => import('@/features/trackers/TrackerDetailPage'), 'TrackerDetailPage'),
          },
          {
            path: '/programmers',
            lazy: lazily(() => import('@/features/programmers/ProgrammersPage'), 'ProgrammersPage'),
          },
          {
            path: '/programmers/:username',
            lazy: lazily(
              () => import('@/features/programmers/ProgrammerDetailPage'),
              'ProgrammerDetailPage',
            ),
          },
          {
            path: '/gallery',
            lazy: lazily(() => import('@/features/gallery/GalleryPage'), 'GalleryPage'),
          },
          {
            path: '/gallery/:slug',
            lazy: lazily(() => import('@/features/gallery/GalleryAlbumPage'), 'GalleryAlbumPage'),
          },
          {
            path: '/courses',
            lazy: lazily(() => import('@/features/courses/CoursesPage'), 'CoursesPage'),
          },
          {
            path: '/courses/:slug',
            lazy: lazily(
              () => import('@/features/courses/CourseDetailPage'),
              'CourseDetailPage',
            ),
          },
          {
            path: '/blog',
            lazy: lazily(() => import('@/features/blog/BlogPage'), 'BlogPage'),
          },
          {
            path: '/contact',
            lazy: lazily(() => import('@/features/info/PublicInfoPages'), 'ContactPage'),
          },
          {
            path: '/privacy',
            lazy: lazily(() => import('@/features/info/PublicInfoPages'), 'PrivacyPage'),
          },
          {
            path: '/terms',
            lazy: lazily(() => import('@/features/info/PublicInfoPages'), 'TermsPage'),
          },
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
          {
            path: '/login',
            lazy: lazily(() => import('@/features/auth/LoginPage'), 'LoginPage'),
          },
          {
            lazy: lazily(() => import('@/features/auth/RequireAuth'), 'RequireAuth'),
            children: [
              {
                path: '/profile',
                lazy: lazily(() => import('@/features/profile/ProfilePage'), 'ProfilePage'),
              },
            ],
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
          {
            path: '*',
            lazy: lazily(() => import('@/features/home/NotFoundPage'), 'NotFoundPage'),
          },
        ],
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App

import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from '@/components/layout/Layout'
import { AdminLayout } from '@/features/admin/AdminLayout'
import { AdminBlogPage } from '@/features/admin/blog/AdminBlogPage'
import { AdminBlogPostDetailPage } from '@/features/admin/blog/AdminBlogPostDetailPage'
import { AdminEventDetailPage } from '@/features/admin/events/AdminEventDetailPage'
import { AdminEventsPage } from '@/features/admin/events/AdminEventsPage'
import { AdminGalleryAlbumDetailPage } from '@/features/admin/gallery/AdminGalleryAlbumDetailPage'
import { AdminGalleryPage } from '@/features/admin/gallery/AdminGalleryPage'
import { AdminRanklistDetailPage } from '@/features/admin/trackers/AdminRanklistDetailPage'
import { AdminTrackerDetailPage } from '@/features/admin/trackers/AdminTrackerDetailPage'
import { AdminTrackersPage } from '@/features/admin/trackers/AdminTrackersPage'
import { AdminUserDetailPage } from '@/features/admin/users/AdminUserDetailPage'
import { AdminUsersPage } from '@/features/admin/users/AdminUsersPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { BlogPage } from '@/features/blog/BlogPage'
import { BlogPostPage } from '@/features/blog/BlogPostPage'
import { EventDetailPage } from '@/features/events/EventDetailPage'
import { EventsPage } from '@/features/events/EventsPage'
import { GalleryAlbumPage } from '@/features/gallery/GalleryAlbumPage'
import { GalleryPage } from '@/features/gallery/GalleryPage'
import { HomePage } from '@/features/home/HomePage'
import { NotFoundPage } from '@/features/home/NotFoundPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ProgrammerDetailPage } from '@/features/programmers/ProgrammerDetailPage'
import { ProgrammersPage } from '@/features/programmers/ProgrammersPage'
import { TrackerDetailPage } from '@/features/trackers/TrackerDetailPage'
import { TrackersPage } from '@/features/trackers/TrackersPage'

const router = createBrowserRouter([
  {
    element: <Layout />,
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
      { path: '/blog/:slug', element: <BlogPostPage /> },
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [{ path: '/profile', element: <ProfilePage /> }],
      },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'users/:id', element: <AdminUserDetailPage /> },
          { path: 'events', element: <AdminEventsPage /> },
          { path: 'events/:id', element: <AdminEventDetailPage /> },
          { path: 'trackers', element: <AdminTrackersPage /> },
          { path: 'trackers/:id', element: <AdminTrackerDetailPage /> },
          { path: 'ranklists/:id', element: <AdminRanklistDetailPage /> },
          { path: 'gallery', element: <AdminGalleryPage /> },
          { path: 'gallery/:id', element: <AdminGalleryAlbumDetailPage /> },
          { path: 'blog', element: <AdminBlogPage /> },
          { path: 'blog/:id', element: <AdminBlogPostDetailPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App

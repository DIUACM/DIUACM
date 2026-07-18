import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from '@/components/layout/Layout'
import { AdminLayout } from '@/features/admin/AdminLayout'
import { AdminEventDetailPage } from '@/features/admin/events/AdminEventDetailPage'
import { AdminEventsPage } from '@/features/admin/events/AdminEventsPage'
import { AdminRanklistDetailPage } from '@/features/admin/trackers/AdminRanklistDetailPage'
import { AdminTrackerDetailPage } from '@/features/admin/trackers/AdminTrackerDetailPage'
import { AdminTrackersPage } from '@/features/admin/trackers/AdminTrackersPage'
import { AdminUserDetailPage } from '@/features/admin/users/AdminUserDetailPage'
import { AdminUsersPage } from '@/features/admin/users/AdminUsersPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { EventDetailPage } from '@/features/events/EventDetailPage'
import { EventsPage } from '@/features/events/EventsPage'
import { HomePage } from '@/features/home/HomePage'
import { NotFoundPage } from '@/features/home/NotFoundPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ProgrammerDetailPage } from '@/features/programmers/ProgrammerDetailPage'
import { ProgrammersPage } from '@/features/programmers/ProgrammersPage'
import { RanklistPage } from '@/features/trackers/RanklistPage'
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
      { path: '/trackers/:slug/:keyword', element: <RanklistPage /> },
      { path: '/programmers', element: <ProgrammersPage /> },
      { path: '/programmers/:username', element: <ProgrammerDetailPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
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

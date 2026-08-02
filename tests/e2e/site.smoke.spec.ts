import path from 'node:path'

import { expect, test, type Page, type Route } from '@playwright/test'
import { createTestHarness } from 'wrangler'

const API_ORIGIN = 'https://api.diuacm.com'
const browserErrors = new WeakMap<Page, string[]>()
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

// Bindings are declared here rather than loaded from apps/api/wrangler.jsonc,
// for the same reason as apps/api/vitest.worker.config.ts: that config binds
// EMAIL with `remote: true`, and the harness has no way to force a remote
// binding local, so loading it would make CI demand a CLOUDFLARE_API_TOKEN.
// Paths below resolve against `root`. Keep this list in step with the
// production config — a binding that is missing here fails at first request.
const apiServer = createTestHarness({
  root: path.resolve(import.meta.dirname, '../../apps/api'),
  workers: [
    {
      config: {
        name: 'diuacm-api-smoke',
        main: 'src/index.ts',
        compatibility_date: '2026-06-20',
        compatibility_flags: ['nodejs_compat'],
        d1_databases: [
          {
            binding: 'DB',
            database_name: 'diuacm-db-smoke',
            database_id: 'diuacm-db-smoke',
            migrations_dir: 'drizzle',
          },
        ],
        r2_buckets: [{ binding: 'BUCKET', bucket_name: 'diuacm-files-smoke' }],
        send_email: [{ name: 'EMAIL' }],
        ratelimits: [
          {
            name: 'AUTH_RATE_LIMITER',
            namespace_id: '1001',
            simple: { limit: 10, period: 60 },
          },
        ],
        vars: {
          CORS_ORIGINS: 'https://diuacm.com',
          GOOGLE_CLIENT_ID: 'browser-smoke-test-client-id',
          SUPER_ADMIN_EMAIL: 'admin@example.test',
          ALERT_FROM_EMAIL: 'alerts@example.test',
          JWT_SECRET: 'browser-smoke-test-secret',
          MIGRATION_EXPORT_KEY: 'browser-smoke-test-export-key',
        },
      },
    },
  ],
})
const apiWorker = apiServer.getWorker()

async function proxyApiRequest(route: Route) {
  const intercepted = route.request()
  const sourceUrl = new URL(intercepted.url())
  const headers = await intercepted.allHeaders()
  delete headers.host
  delete headers['content-length']

  const body = intercepted.postDataBuffer() ?? undefined
  const response = await apiWorker.fetch(
    `http://api.test${sourceUrl.pathname}${sourceUrl.search}`,
    {
      method: intercepted.method(),
      headers,
      body,
    },
  )

  await route.fulfill({
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: Buffer.from(await response.arrayBuffer()),
  })
}

test.beforeAll(async () => {
  await apiServer.listen()
  await apiWorker.applyD1Migrations('DB')
})

test.afterAll(async () => {
  await apiServer.close()
})

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  browserErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.route(`${API_ORIGIN}/**`, proxyApiRequest)

  // The course pages reference YouTube's thumbnail host and player. Stub both:
  // a real fetch would make these tests depend on network access, and a failed
  // one surfaces as a console error that trips the assertion in `afterEach`.
  await page.route('https://i.ytimg.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: TRANSPARENT_PNG }),
  )
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>stub</title>' }),
  )
})

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), 'the browser should not report runtime errors').toEqual([])
})

test('home page loads and reads events from the local Worker', async ({ page }) => {
  const eventsRequest = page.waitForRequest(
    (request) => new URL(request.url()).pathname === '/events',
  )

  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: "DIU's home for competitive programming" }),
  ).toBeVisible()
  await eventsRequest
  await expect(page.getByText('No events yet — check back soon.')).toBeVisible()
})

test('route-split events page talks to D1 through workerd', async ({ page }) => {
  await page.goto('/events')

  await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible()
  await expect(page.getByText('No events match your filters.')).toBeVisible()
})

test('a direct visit loads a lazy informational route', async ({ page }) => {
  await page.goto('/privacy')

  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  await expect(page.getByText('Information we collect')).toBeVisible()
})

test('the courses index lists the static course without calling the API', async ({ page }) => {
  await page.goto('/courses')

  await expect(page.getByRole('heading', { name: 'Courses', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'C for Beginners' })).toBeVisible()
  await expect(page.getByText('7 lessons · 9h 50m')).toBeVisible()
})

test('a course lesson only loads the YouTube player once play is pressed', async ({ page }) => {
  await page.goto('/courses/c-for-beginners')

  await expect(page.getByRole('heading', { name: 'C for Beginners', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Introduction to C', level: 2 })).toBeVisible()

  // The facade is the point: no third-party player until someone asks for it.
  await expect(page.locator('iframe')).toHaveCount(0)

  await page.getByRole('button', { name: /^Play Lesson 1/ }).click()
  await expect(page.locator('iframe')).toHaveAttribute(
    'src',
    /youtube-nocookie\.com\/embed\/MSE6VlVt6as/,
  )
})

test('selecting a lesson is reflected in the URL and survives a reload', async ({ page }) => {
  await page.goto('/courses/c-for-beginners')

  await page.getByRole('button', { name: 'Lesson 4: Loops' }).click()
  await expect(page).toHaveURL(/\?lesson=4$/)
  await expect(page.getByRole('heading', { name: 'Loops', level: 2 })).toBeVisible()

  // The lesson is addressable, so a direct visit to the deep link works too.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Loops', level: 2 })).toBeVisible()
})

test('an unknown course slug shows a recoverable not-found state', async ({ page }) => {
  await page.goto('/courses/does-not-exist')

  await expect(page.getByText(/That course doesn't exist/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Browse all courses' })).toBeVisible()
})

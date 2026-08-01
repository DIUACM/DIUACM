import { expect, test, type Page, type Route } from '@playwright/test'
import { createTestHarness } from 'wrangler'

const API_ORIGIN = 'https://diuacm-api-prod.sourov-cse.workers.dev'
const browserErrors = new WeakMap<Page, string[]>()

const apiServer = createTestHarness({
  root: process.cwd(),
  workers: [
    {
      configPath: 'apps/api/wrangler.jsonc',
      secrets: {
        JWT_SECRET: 'browser-smoke-test-secret',
        MIGRATION_EXPORT_KEY: 'browser-smoke-test-export-key',
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

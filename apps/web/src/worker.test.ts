import { describe, expect, it, vi } from 'vitest'

import { handleRequest } from './worker'

describe('production web worker', () => {
  it('redirects HTTP to HTTPS while preserving the path and query', async () => {
    const fetchAsset = vi.fn(async () => new Response('asset'))

    const response = await handleRequest(
      new Request('http://diuacm.com/events?page=2'),
      fetchAsset,
    )

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe(
      'https://diuacm.com/events?page=2',
    )
    expect(fetchAsset).not.toHaveBeenCalled()
  })

  it('serves HTTPS requests through the static-assets binding', async () => {
    const fetchAsset = vi.fn(async () => new Response('asset'))
    const request = new Request('https://diuacm.com/events')

    const response = await handleRequest(request, fetchAsset)

    expect(await response.text()).toBe('asset')
    expect(fetchAsset).toHaveBeenCalledWith(request)
  })

  it('does not redirect the local HTTP development server', async () => {
    const fetchAsset = vi.fn(async () => new Response('local asset'))

    const response = await handleRequest(
      new Request('http://localhost:8787/events'),
      fetchAsset,
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('local asset')
  })
})

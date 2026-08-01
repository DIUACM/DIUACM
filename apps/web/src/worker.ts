const PRODUCTION_HOSTNAME = 'diuacm.com'

export async function handleRequest(
  request: Request,
  fetchAsset: (request: Request) => Promise<Response>,
): Promise<Response> {
  const url = new URL(request.url)

  if (url.hostname === PRODUCTION_HOSTNAME && url.protocol === 'http:') {
    url.protocol = 'https:'
    return Response.redirect(url, 308)
  }

  return fetchAsset(request)
}

export default {
  fetch(request, env): Promise<Response> {
    return handleRequest(request, (assetRequest) => env.ASSETS.fetch(assetRequest))
  },
} satisfies ExportedHandler<Env>

export function resolveLoginReturnPath(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) return '/'
  const from = (state as { from?: unknown }).from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
    ? from
    : '/'
}

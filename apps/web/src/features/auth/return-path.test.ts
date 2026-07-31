import { describe, expect, it } from 'vitest'

import { resolveLoginReturnPath } from './return-path'

describe('resolveLoginReturnPath', () => {
  it('keeps internal protected routes', () => {
    expect(resolveLoginReturnPath({ from: '/profile' })).toBe('/profile')
    expect(resolveLoginReturnPath({ from: '/admin/events/12' })).toBe(
      '/admin/events/12',
    )
  })

  it('rejects external, protocol-relative, and malformed destinations', () => {
    expect(resolveLoginReturnPath({ from: 'https://evil.example' })).toBe('/')
    expect(resolveLoginReturnPath({ from: '//evil.example' })).toBe('/')
    expect(resolveLoginReturnPath({ from: 42 })).toBe('/')
    expect(resolveLoginReturnPath(null)).toBe('/')
  })
})

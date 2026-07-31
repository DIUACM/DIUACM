import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PasswordInput } from './password-input'

describe('PasswordInput', () => {
  it('starts concealed with an accessible non-submit reveal control', () => {
    const html = renderToStaticMarkup(
      <form>
        <PasswordInput
          id="password"
          name="password"
          defaultValue="secret"
          autoComplete="current-password"
        />
      </form>,
    )

    expect(html).toContain('type="password"')
    expect(html).toContain('autoComplete="current-password"')
    expect(html).toContain('aria-label="Show password"')
    expect(html).toContain('aria-controls="password"')
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('type="button"')
    expect(html).toContain(
      'active:not-aria-[haspopup]:-translate-y-1/2',
    )
    expect(html).not.toContain(
      'active:not-aria-[haspopup]:translate-y-px',
    )
  })
})

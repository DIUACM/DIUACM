import { describe, expect, it } from 'vitest'

import { resolveAttendanceDisplayState } from './attendance-state'

const baseState = {
  isAuthenticated: true,
  isAttendanceEnabled: true,
  isRosterPending: false,
  attended: false,
  windowTiming: 'open' as const,
}

describe('resolveAttendanceDisplayState', () => {
  it.each(['upcoming', 'closed'] as const)(
    'shows confirmation independently when the window is %s',
    (windowTiming) => {
      expect(
        resolveAttendanceDisplayState({
          ...baseState,
          attended: true,
          windowTiming,
        }),
      ).toEqual({ confirmation: 'confirmed', window: windowTiming })
    },
  )

  it('keeps confirmed attendance visible after attendance is disabled', () => {
    expect(
      resolveAttendanceDisplayState({
        ...baseState,
        isAttendanceEnabled: false,
        attended: true,
        windowTiming: 'closed',
      }),
    ).toEqual({ confirmation: 'confirmed', window: 'hidden' })
  })

  it('keeps confirmed attendance visible while the roster refreshes', () => {
    expect(
      resolveAttendanceDisplayState({
        ...baseState,
        isRosterPending: true,
        attended: true,
      }),
    ).toEqual({ confirmation: 'confirmed', window: 'open' })
  })

  it('shows the window state while the roster is loading', () => {
    expect(
      resolveAttendanceDisplayState({
        ...baseState,
        isRosterPending: true,
        windowTiming: 'closed',
      }),
    ).toEqual({ confirmation: 'checking', window: 'closed' })
  })

  it('shows the applicable window state without confirmation', () => {
    expect(
      resolveAttendanceDisplayState({
        ...baseState,
        windowTiming: 'upcoming',
      }),
    ).toEqual({ confirmation: 'hidden', window: 'upcoming' })
    expect(
      resolveAttendanceDisplayState({
        ...baseState,
        windowTiming: 'closed',
      }),
    ).toEqual({ confirmation: 'hidden', window: 'closed' })
  })

  it('keeps confirmation hidden for signed-out visitors while showing the window', () => {
    expect(
      resolveAttendanceDisplayState({
        ...baseState,
        isAuthenticated: false,
        attended: true,
      }),
    ).toEqual({ confirmation: 'hidden', window: 'open' })
  })
})

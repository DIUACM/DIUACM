import { describe, expect, it } from 'vitest'

import {
  ATTENDANCE_WINDOW_SECONDS,
  attendanceWindowTiming,
} from './datetime'

describe('attendanceWindowTiming', () => {
  const startingAt = 10_000
  const endingAt = 20_000
  const opensAt = startingAt - ATTENDANCE_WINDOW_SECONDS
  const closesAt = endingAt + ATTENDANCE_WINDOW_SECONDS

  it('is upcoming before the opening boundary', () => {
    expect(attendanceWindowTiming(startingAt, endingAt, opensAt - 1)).toBe(
      'upcoming',
    )
  })

  it('is open at both boundaries and throughout the event', () => {
    expect(attendanceWindowTiming(startingAt, endingAt, opensAt)).toBe('open')
    expect(attendanceWindowTiming(startingAt, endingAt, startingAt)).toBe('open')
    expect(attendanceWindowTiming(startingAt, endingAt, endingAt)).toBe('open')
    expect(attendanceWindowTiming(startingAt, endingAt, closesAt)).toBe('open')
  })

  it('is closed after the closing boundary', () => {
    expect(attendanceWindowTiming(startingAt, endingAt, closesAt + 1)).toBe(
      'closed',
    )
  })
})

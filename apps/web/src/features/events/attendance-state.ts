import type { AttendanceWindowTiming } from '@/lib/datetime'

export type AttendanceConfirmationState = 'hidden' | 'checking' | 'confirmed'
export type AttendanceWindowState = 'hidden' | AttendanceWindowTiming

export function resolveAttendanceDisplayState({
  isAuthenticated,
  isAttendanceEnabled,
  isRosterPending,
  attended,
  windowTiming,
}: {
  isAuthenticated: boolean
  isAttendanceEnabled: boolean
  isRosterPending: boolean
  attended: boolean
  windowTiming: AttendanceWindowTiming
}): {
  confirmation: AttendanceConfirmationState
  window: AttendanceWindowState
} {
  const confirmation = !isAuthenticated
    ? 'hidden'
    : attended
      ? 'confirmed'
      : isRosterPending
        ? 'checking'
        : 'hidden'

  return {
    confirmation,
    window: isAttendanceEnabled ? windowTiming : 'hidden',
  }
}

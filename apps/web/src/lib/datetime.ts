const dateTime = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dateOnly = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

const timeOnly = new Intl.DateTimeFormat('en', { timeStyle: 'short' })

export function formatDateTime(epochSeconds: number): string {
  return dateTime.format(new Date(epochSeconds * 1000))
}

export function formatDate(epochSeconds: number): string {
  return dateOnly.format(new Date(epochSeconds * 1000))
}

export function formatTime(epochSeconds: number): string {
  return timeOnly.format(new Date(epochSeconds * 1000))
}

export function formatDuration(startSeconds: number, endSeconds: number): string {
  const totalMinutes = Math.max(0, Math.round((endSeconds - startSeconds) / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/** Epoch seconds → value for an <input type="datetime-local"> in the local timezone. */
export function epochToLocalInput(epochSeconds: number): string {
  const date = new Date(epochSeconds * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** <input type="datetime-local"> value → epoch seconds (interpreted in the local timezone). */
export function localInputToEpoch(value: string): number {
  return Math.floor(new Date(value).getTime() / 1000)
}

export type EventTiming = 'upcoming' | 'ongoing' | 'ended'

export function eventTiming(startSeconds: number, endSeconds: number): EventTiming {
  const now = Date.now() / 1000
  if (now < startSeconds) return 'upcoming'
  if (now <= endSeconds) return 'ongoing'
  return 'ended'
}

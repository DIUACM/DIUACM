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

export type EventTiming = 'upcoming' | 'ongoing' | 'ended'

export function eventTiming(startSeconds: number, endSeconds: number): EventTiming {
  const now = Date.now() / 1000
  if (now < startSeconds) return 'upcoming'
  if (now <= endSeconds) return 'ongoing'
  return 'ended'
}

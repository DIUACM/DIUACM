export type ContestPlatform = 'codeforces' | 'vjudge' | 'atcoder'

export interface DetectedContest {
  platform: ContestPlatform
  /** Codeforces gyms live in their own numbering, so keep them distinguishable. */
  kind: 'contest' | 'gym'
  contestId: string
}

const NUMERIC = /^\d+$/
/** AtCoder contests are slugs (abc300, agc001, tenka1-2018). */
const SLUG = /^[a-z0-9][a-z0-9_-]*$/i

function matchesHost(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

/** Index of the segment following `keyword`, or null when absent. */
function segmentAfter(segments: string[], keywords: string[]): number | null {
  const index = segments.findIndex((segment) => keywords.includes(segment.toLowerCase()))
  if (index === -1 || index + 1 >= segments.length) return null
  return index + 1
}

/**
 * Best-effort read of the judge and contest id out of an event link. Returns null
 * for anything that isn't recognisably a contest URL (including profile or
 * problemset links on a known judge).
 */
export function detectContestLink(link: string): DetectedContest | null {
  const trimmed = link.trim()
  if (trimmed === '') return null

  let url: URL
  try {
    url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const segments = url.pathname.split('/').filter(Boolean)

  // codeforces.com/contest/1234, /gym/104000, /group/<id>/contest/1234
  if (matchesHost(host, 'codeforces.com') || matchesHost(host, 'codeforc.es')) {
    const gymIndex = segmentAfter(segments, ['gym'])
    if (gymIndex !== null && NUMERIC.test(segments[gymIndex])) {
      return { platform: 'codeforces', kind: 'gym', contestId: segments[gymIndex] }
    }
    const index = segmentAfter(segments, ['contest', 'contests', 'contestregistration'])
    if (index !== null && NUMERIC.test(segments[index])) {
      return { platform: 'codeforces', kind: 'contest', contestId: segments[index] }
    }
    return null
  }

  // vjudge.net/contest/700000
  if (matchesHost(host, 'vjudge.net')) {
    const index = segmentAfter(segments, ['contest'])
    if (index !== null && NUMERIC.test(segments[index])) {
      return { platform: 'vjudge', kind: 'contest', contestId: segments[index] }
    }
    return null
  }

  // atcoder.jp/contests/abc300
  if (matchesHost(host, 'atcoder.jp')) {
    const index = segmentAfter(segments, ['contests'])
    if (index !== null && SLUG.test(segments[index])) {
      return { platform: 'atcoder', kind: 'contest', contestId: segments[index] }
    }
    return null
  }

  return null
}

import { describe, expect, it } from 'vitest'
import { cfRatingTier } from './constants'

describe('cfRatingTier', () => {
  it.each([
    [0, 'Newbie'],
    [1199, 'Newbie'],
    [1200, 'Pupil'],
    [1400, 'Specialist'],
    [1600, 'Expert'],
    [1900, 'Candidate Master'],
    [2100, 'Master'],
    [2300, 'International Master'],
    [2400, 'Grandmaster'],
    [2600, 'International Grandmaster'],
    [3000, 'Legendary Grandmaster'],
  ])('maps rating %i to %s', (rating, title) => {
    expect(cfRatingTier(rating).title).toBe(title)
  })
})

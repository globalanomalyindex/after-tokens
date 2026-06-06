import { describe, expect, it } from 'vitest'
import { standardReducedFallback } from '@/lib/diffusion/reduced-motion'

const word = (i: number) => ({
  text: `w${i}`,
  index: i,
  lineIndex: 0,
  bbox: { x: 0, y: 0, w: 10, h: 10 },
})

describe('standardReducedFallback', () => {
  it('produces a resolving then resolved event per word', () => {
    const events = standardReducedFallback([word(0), word(1), word(2)])
    expect(events.filter((e) => e.state === 'resolved')).toHaveLength(3)
  })
  it('staggers resolution times monotonically', () => {
    const events = standardReducedFallback([word(0), word(1), word(2)])
    const resolvedTimes = events.filter((e) => e.state === 'resolved').map((e) => e.t)
    expect(resolvedTimes[0]!).toBeLessThan(resolvedTimes[1]!)
    expect(resolvedTimes[1]!).toBeLessThan(resolvedTimes[2]!)
  })
  it('completes inside the reduced-motion budget (300ms)', () => {
    const events = standardReducedFallback(Array.from({ length: 20 }, (_, i) => word(i)))
    const last = events[events.length - 1]!.t
    expect(last).toBeLessThanOrEqual(300)
  })
})

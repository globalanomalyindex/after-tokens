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
  it('resolves every word in the same frame without stagger', () => {
    const events = standardReducedFallback([word(0), word(1), word(2)])
    const resolvedTimes = events.filter((e) => e.state === 'resolved').map((e) => e.t)
    expect(new Set(resolvedTimes)).toEqual(new Set([0]))
  })
  it('stays immediate for large responses', () => {
    const events = standardReducedFallback(Array.from({ length: 500 }, (_, i) => word(i)))
    const last = events[events.length - 1]!.t
    expect(last).toBe(0)
  })
})

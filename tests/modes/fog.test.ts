import { describe, expect, it } from 'vitest'
import { fog } from '@/lib/diffusion/modes/fog'

const measure = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    index: i,
    lineIndex: Math.floor(i / 4),
    bbox: { x: (i % 4) * 60, y: Math.floor(i / 4) * 30, w: 50, h: 20 },
  }))

describe('fog', () => {
  it('total duration in the diffusion-loading band (2800-3200ms)', () => {
    const t = fog.totalDuration(measure(10))
    expect(t).toBeGreaterThanOrEqual(2800)
    expect(t).toBeLessThanOrEqual(3200)
  })

  it('resolves top-left words before bottom-right words', () => {
    const events = fog.computeTimeline(measure(8))
    const resolvedT = new Map<number, number>()
    for (const e of events) if (e.state === 'resolved') resolvedT.set(e.wordIndex, e.t)
    expect(resolvedT.get(0)!).toBeLessThan(resolvedT.get(7)!)
  })
})

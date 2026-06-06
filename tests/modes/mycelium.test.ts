import { describe, expect, it } from 'vitest'
import { mycelium, computeWordLockTimes } from '@/lib/diffusion/modes/mycelium'

const measure = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    index: i,
    lineIndex: Math.floor(i / 4),
    bbox: { x: (i % 4) * 60, y: Math.floor(i / 4) * 30, w: 50, h: 20 },
  }))

describe('mycelium', () => {
  it('total duration in the breach-loading band (2800-3800ms) for 10 words', () => {
    const t = mycelium.totalDuration(measure(10))
    expect(t).toBeGreaterThanOrEqual(2800)
    expect(t).toBeLessThanOrEqual(3800)
  })

  it('emits a resolving + resolved event per word', () => {
    const events = mycelium.computeTimeline(measure(8))
    expect(events.filter((e) => e.state === 'resolving')).toHaveLength(8)
    expect(events.filter((e) => e.state === 'resolved')).toHaveLength(8)
  })

  it('lock times accelerate — first gap is the slowest, later gaps shrink', () => {
    const times = computeWordLockTimes(10)
    const gaps: number[] = []
    for (let i = 1; i < times.length; i++) {
      const prev = times[i - 1] ?? 0
      const curr = times[i] ?? 0
      gaps.push(curr - prev)
    }
    expect(gaps[0]!).toBeGreaterThan(gaps[2]!)
    expect(gaps[1]!).toBeGreaterThan(gaps[4]!)
    expect(gaps[gaps.length - 1]!).toBeLessThanOrEqual(100)
  })
})

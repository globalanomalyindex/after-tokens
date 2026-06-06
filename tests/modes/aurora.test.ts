import { describe, expect, it } from 'vitest'
import { aurora } from '@/lib/diffusion/modes/aurora'

const measure = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    index: i,
    lineIndex: Math.floor(i / 4),
    bbox: { x: (i % 4) * 60, y: Math.floor(i / 4) * 30, w: 50, h: 20 },
  }))

describe('aurora', () => {
  it('total duration in the diffusion-loading band (2800-3500ms) for 12 words on 3 lines', () => {
    const t = aurora.totalDuration(measure(12))
    expect(t).toBeGreaterThanOrEqual(2800)
    expect(t).toBeLessThanOrEqual(3500)
  })

  it('resolves line 0 words before line 1 words', () => {
    const events = aurora.computeTimeline(measure(8))
    const resolvedByLine = new Map<number, number[]>()
    for (const e of events) {
      if (e.state !== 'resolved') continue
      const w = measure(8).find((x) => x.index === e.wordIndex)!
      const arr = resolvedByLine.get(w.lineIndex) ?? []
      arr.push(e.t)
      resolvedByLine.set(w.lineIndex, arr)
    }
    const avgLine0 = average(resolvedByLine.get(0) ?? [])
    const avgLine1 = average(resolvedByLine.get(1) ?? [])
    expect(avgLine0).toBeLessThan(avgLine1)
  })
})

function average(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((s, x) => s + x, 0) / xs.length
}

import { describe, expect, it } from 'vitest'
import { mycelium, computeWordLockTimes, computeLockOrder } from '@/lib/diffusion/modes/mycelium'
import type { MeasuredAtom } from '@/lib/diffusion/types'

const measure = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    index: i,
    lineIndex: Math.floor(i / 4),
    bbox: { x: (i % 4) * 60, y: Math.floor(i / 4) * 30, w: 50, h: 20 },
  }))

// Deterministic 40-word synthetic text generator for the statistical check.
const syntheticWords = (k: number): MeasuredAtom[] =>
  Array.from({ length: 40 }, (_, i) => ({
    text: `w${i}-${k}`,
    index: i,
    lineIndex: Math.floor(i / 8),
    bbox: { x: (i % 8) * 60, y: Math.floor(i / 8) * 30, w: 50, h: 20 },
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

  it('lock times accelerate: first gap is the slowest, later gaps shrink', () => {
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

  it('computeLockOrder is deterministic for a given text and varies across texts', () => {
    const wordsA = measure(20)
    const orderA1 = computeLockOrder(wordsA)
    const orderA2 = computeLockOrder(measure(20))
    expect(orderA1).toEqual(orderA2)

    const wordsB = syntheticWords(1)
    const orderB = computeLockOrder(wordsB)
    expect(orderA1).not.toEqual(orderB)
  })

  it('every word index appears exactly once in the lock order', () => {
    const words = measure(37)
    const order = computeLockOrder(words)
    expect(order).toHaveLength(37)
    expect(new Set(order).size).toBe(37)
    for (let i = 0; i < 37; i++) {
      expect(order).toContain(i)
    }
  })

  it('the growth process matches the fitted adjacency and long-jump rates across many texts', () => {
    const trials = 120
    const wordCount = 40
    let adjacentFracSum = 0
    let farJumpFracSum = 0

    for (let k = 0; k < trials; k++) {
      const words = syntheticWords(k)
      const order = computeLockOrder(words)
      let adjacent = 0
      let far = 0
      for (let i = 1; i < order.length; i++) {
        const dist = Math.abs(order[i]! - order[i - 1]!)
        if (dist === 1) adjacent++
        if (dist >= 11) far++
      }
      adjacentFracSum += adjacent / (wordCount - 1)
      farJumpFracSum += far / (wordCount - 1)
    }

    const meanAdjacentFrac = adjacentFracSum / trials
    const meanFarJumpFrac = farJumpFracSum / trials

    expect(meanAdjacentFrac).toBeGreaterThanOrEqual(0.4)
    expect(meanAdjacentFrac).toBeLessThanOrEqual(0.62)
    expect(meanFarJumpFrac).toBeGreaterThanOrEqual(0.01)
    expect(meanFarJumpFrac).toBeLessThanOrEqual(0.12)
  })
})

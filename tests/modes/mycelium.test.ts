import { describe, expect, it } from 'vitest'
import {
  mycelium,
  computeWordLockTimes,
  computeLockOrder,
  MYCELIUM_PRE_ROLL_MS,
  MYCELIUM_MIN_GAP_MS,
  MYCELIUM_MAX_GAP_MS,
} from '@/lib/diffusion/modes/mycelium'
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
  it('total duration for 10 words matches the bounded linear cadence', () => {
    const t = mycelium.totalDuration(measure(10))
    // 320 pre-roll + 9 gaps at the 80ms ceiling (5200/10 clamps to it) + the
    // 90ms resolving beat + the 260ms tail.
    expect(t).toBeGreaterThanOrEqual(1300)
    expect(t).toBeLessThanOrEqual(1500)
  })

  it('emits a resolving + resolved event per word', () => {
    const events = mycelium.computeTimeline(measure(8))
    expect(events.filter((e) => e.state === 'resolving')).toHaveLength(8)
    expect(events.filter((e) => e.state === 'resolved')).toHaveLength(8)
  })

  it('pre-roll is 320ms', () => {
    const times = computeWordLockTimes(10)
    expect(times[0]).toBe(MYCELIUM_PRE_ROLL_MS)
    expect(MYCELIUM_PRE_ROLL_MS).toBe(320)
  })

  it('lock times are linear: every successive gap is equal', () => {
    const times = computeWordLockTimes(12)
    const gaps: number[] = []
    for (let i = 1; i < times.length; i++) {
      const prev = times[i - 1] ?? 0
      const curr = times[i] ?? 0
      gaps.push(curr - prev)
    }
    for (const gap of gaps) {
      expect(gap).toBeCloseTo(gaps[0]!, 6)
    }
  })

  it('every gap stays within [MYCELIUM_MIN_GAP_MS, MYCELIUM_MAX_GAP_MS]', () => {
    for (const n of [1, 2, 5, 10, 30, 87, 150]) {
      const times = computeWordLockTimes(n)
      for (let i = 1; i < times.length; i++) {
        const gap = (times[i] ?? 0) - (times[i - 1] ?? 0)
        expect(gap).toBeGreaterThanOrEqual(MYCELIUM_MIN_GAP_MS)
        expect(gap).toBeLessThanOrEqual(MYCELIUM_MAX_GAP_MS)
      }
    }
  })

  it('a 30-word answer locks its last word under 3000ms', () => {
    const times = computeWordLockTimes(30)
    expect(times.at(-1)!).toBeLessThan(3000)
  })

  it('an 87-word answer locks its last word under 6000ms', () => {
    const times = computeWordLockTimes(87)
    expect(times.at(-1)!).toBeLessThan(6000)
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

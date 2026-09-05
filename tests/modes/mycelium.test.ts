import { describe, expect, it } from 'vitest'
import {
  mycelium,
  computeWordLockTimes,
  computeLockOrder,
  computeLockSchedule,
  wordsPerStep,
  stepCount,
  stepInterval,
  MYCELIUM_PRE_ROLL_MS,
  MYCELIUM_STEP_MS_MIN,
  MYCELIUM_STEP_MS_MAX,
  MYCELIUM_STEP_JITTER_MS,
  MYCELIUM_TARGET_STEPS,
} from '@/lib/diffusion/modes/mycelium'
import type { MeasuredAtom } from '@/lib/diffusion/types'

const measure = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    index: i,
    lineIndex: Math.floor(i / 4),
    bbox: { x: (i % 4) * 60, y: Math.floor(i / 4) * 30, w: 50, h: 20 },
  }))

// Deterministic synthetic texts for the statistical checks.
const syntheticWords = (k: number, n = 90): MeasuredAtom[] =>
  Array.from({ length: n }, (_, i) => ({
    text: `w${i}-${k}`,
    index: i,
    lineIndex: Math.floor(i / 8),
    bbox: { x: (i % 8) * 60, y: Math.floor(i / 8) * 30, w: 50, h: 20 },
  }))

// Kendall's tau between commit rank and position: +1 is left to right.
function kendallTau(order: number[]): number {
  let concordant = 0
  let discordant = 0
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      if (order[j]! > order[i]!) concordant++
      else discordant++
    }
  }
  const pairs = concordant + discordant
  return pairs === 0 ? 0 : (concordant - discordant) / pairs
}

describe('mycelium cadence', () => {
  it('spreads an answer over about the target number of steps, one word per step at minimum', () => {
    expect(wordsPerStep(8)).toBe(1)
    expect(stepCount(8)).toBe(8)
    expect(wordsPerStep(90)).toBe(5)
    expect(stepCount(90)).toBe(18)
    expect(stepCount(200)).toBe(MYCELIUM_TARGET_STEPS)
  })

  it('keeps every step interval inside the threshold bounds', () => {
    for (const n of [1, 2, 5, 10, 30, 87, 150, 400]) {
      expect(stepInterval(n)).toBeGreaterThanOrEqual(MYCELIUM_STEP_MS_MIN)
      expect(stepInterval(n)).toBeLessThanOrEqual(MYCELIUM_STEP_MS_MAX)
    }
  })

  it('pre-roll is 320ms and the first step lands on it', () => {
    expect(MYCELIUM_PRE_ROLL_MS).toBe(320)
    expect(computeWordLockTimes(10)[0]).toBe(MYCELIUM_PRE_ROLL_MS)
  })

  it('lock times are step-batched: words of one step share a time, steps are evenly spaced', () => {
    const n = 90
    const k = wordsPerStep(n)
    const times = computeWordLockTimes(n)
    for (let i = 0; i < n; i++) {
      expect(times[i]).toBe(MYCELIUM_PRE_ROLL_MS + Math.floor(i / k) * stepInterval(n))
    }
  })

  it('a timeline lands each word within the jitter spread of its step', () => {
    const words = syntheticWords(3)
    const { order, stepOf } = computeLockSchedule(words)
    const gap = stepInterval(words.length)
    const events = mycelium.computeTimeline(words)
    order.forEach((wordIndex, rank) => {
      const e = events.find((ev) => ev.wordIndex === wordIndex && ev.state === 'resolving')!
      const stepT = MYCELIUM_PRE_ROLL_MS + stepOf[rank]! * gap
      expect(e.t).toBeGreaterThanOrEqual(stepT)
      expect(e.t).toBeLessThanOrEqual(stepT + MYCELIUM_STEP_JITTER_MS)
    })
  })

  it('a 30-word answer locks its last word under 4000ms and an 87-word one under 6000ms', () => {
    expect(computeWordLockTimes(30).at(-1)!).toBeLessThan(4000)
    expect(computeWordLockTimes(87).at(-1)!).toBeLessThan(6000)
  })

  it('emits a resolving + resolved event per word', () => {
    const events = mycelium.computeTimeline(measure(8))
    expect(events.filter((e) => e.state === 'resolving')).toHaveLength(8)
    expect(events.filter((e) => e.state === 'resolved')).toHaveLength(8)
  })
})

describe('mycelium order', () => {
  it('is deterministic for a given text and varies across texts', () => {
    expect(computeLockOrder(measure(20))).toEqual(computeLockOrder(measure(20)))
    expect(computeLockOrder(measure(20))).not.toEqual(computeLockOrder(syntheticWords(1, 20)))
  })

  it('commits every word index exactly once', () => {
    const order = computeLockOrder(measure(37))
    expect(order).toHaveLength(37)
    expect(new Set(order).size).toBe(37)
  })

  it('is out of order: commit rank is uncorrelated with reading order', () => {
    let tauSum = 0
    const trials = 60
    for (let k = 0; k < trials; k++) tauSum += Math.abs(kendallTau(computeLockOrder(syntheticWords(k))))
    expect(tauSum / trials).toBeLessThan(0.25)
  })

  it('is parallel: the first step seeds the whole span of the answer', () => {
    for (let k = 0; k < 20; k++) {
      const words = syntheticWords(k)
      const { order, stepOf } = computeLockSchedule(words)
      const first = order.filter((_, rank) => stepOf[rank] === 0)
      expect(first).toHaveLength(wordsPerStep(words.length))
      const span = Math.max(...first) - Math.min(...first)
      expect(span).toBeGreaterThan(words.length * 0.5)
    }
  })

  it('is growth: most commits attach to a word already committed, and consecutive commits mostly do not', () => {
    const trials = 60
    let attachSum = 0
    let seqAdjacentSum = 0
    let seedsPer100Sum = 0
    for (let k = 0; k < trials; k++) {
      const words = syntheticWords(k)
      const { order, stepOf } = computeLockSchedule(words)
      const committed = new Set<number>()
      let attach = 0
      let seeds = 0
      let seqAdjacent = 0
      order.forEach((pos, rank) => {
        const touching = committed.has(pos - 1) || committed.has(pos + 1)
        if (stepOf[rank]! > 0) {
          if (touching) attach++
          else seeds++
        }
        if (rank > 0 && Math.abs(pos - order[rank - 1]!) === 1) seqAdjacent++
        committed.add(pos)
      })
      const later = order.length - wordsPerStep(words.length)
      attachSum += attach / later
      seedsPer100Sum += (seeds / words.length) * 100
      seqAdjacentSum += seqAdjacent / (order.length - 1)
    }
    // growth: a clear majority of commits extend an existing cluster
    expect(attachSum / trials).toBeGreaterThan(0.6)
    // and fresh seeds keep opening, at a rate the recorded sampler could plausibly show
    expect(seedsPer100Sum / trials).toBeGreaterThan(3)
    expect(seedsPer100Sum / trials).toBeLessThan(35)
    // parallel: consecutive commits alternate between fronts, so the sequence itself is scattered
    expect(seqAdjacentSum / trials).toBeLessThan(0.4)
  })
})

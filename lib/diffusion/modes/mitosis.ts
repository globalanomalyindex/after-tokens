import type { ModeStrategy, MeasuredAtom, ResolutionEvent } from '../types'
import { standardReducedFallback } from '../reduced-motion'
import { MitosisOverlay } from '@/components/diffusion/mitosis-overlay'

// Phase timing
export const MITOSIS_PRE_ROLL_MS = 900 // single metaball drifts, cycling visible
export const MITOSIS_SPLIT_MS = 1100 // mitosis: blob fragments toward word positions
export const MITOSIS_SETTLE_MS = 220 // orbs arrive + a beat of "settling"
const PER_WORD_LOCK_MS = 130
const RESOLVING_TO_RESOLVED_MS = 90
const TAIL_MS = 320

/**
 * Locking begins after the split completes. Each word locks in a text-seeded
 * random order. Spacing is steady — calmer than mycelium's breach.
 */
export function computeMitosisLockOrder(words: MeasuredAtom[]): number[] {
  if (words.length === 0) return []
  const seedStr = words.map((w) => w.text).join('|')
  let hash = 2166136261
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const h = hash >>> 0
  const scored = words.map((w, i) => ({
    idx: w.index,
    weight: ((i * 374761393) ^ ((h + i * 668265263) >>> 0)) >>> 0,
  }))
  scored.sort((a, b) => a.weight - b.weight)
  return scored.map((x) => x.idx)
}

export function computeMitosisLockTimes(wordCount: number): number[] {
  const start = MITOSIS_PRE_ROLL_MS + MITOSIS_SPLIT_MS + MITOSIS_SETTLE_MS
  const times: number[] = []
  for (let i = 0; i < wordCount; i++) {
    times.push(start + i * PER_WORD_LOCK_MS)
  }
  return times
}

function totalDuration(words: MeasuredAtom[]): number {
  if (words.length === 0) return 0
  const times = computeMitosisLockTimes(words.length)
  const lastLock = times[times.length - 1] ?? 0
  return lastLock + RESOLVING_TO_RESOLVED_MS + TAIL_MS
}

function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const order = computeMitosisLockOrder(words)
  const times = computeMitosisLockTimes(words.length)
  const events: ResolutionEvent[] = []
  order.forEach((wordIndex, orderIdx) => {
    const t = times[orderIdx] ?? 0
    events.push({ wordIndex, state: 'resolving', t })
    events.push({ wordIndex, state: 'resolved', t: t + RESOLVING_TO_RESOLVED_MS })
  })
  return events
}

export const mitosis: ModeStrategy = {
  name: 'mitosis',
  totalDuration,
  computeTimeline,
  renderOverlay: (props) => MitosisOverlay(props),
  reducedMotionFallback: standardReducedFallback,
}

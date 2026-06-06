import type { ModeStrategy, MeasuredAtom, ResolutionEvent } from '../types'
import { standardReducedFallback } from '../reduced-motion'
import { MyceliumOverlay } from '@/components/diffusion/mycelium-overlay'

export const MYCELIUM_PRE_ROLL_MS = 1500

// Golden ratio decay — each gap is (1/φ) ≈ 0.618 of the previous.
// This is the same scale-invariant rhythm that drives nautilus shells,
// sunflower seed spirals, and pine cone phyllotaxis. Humans recognize it
// instinctively as satisfying, which keeps the eye locked on the screen
// while the "breach" plays out.
export const PHI = 1.6180339887498949
export const MYCELIUM_FIRST_GAP_MS = 720
export const MYCELIUM_MIN_GAP_MS = 45

export function goldenDecayGap(n: number): number {
  // gap_n = MYCELIUM_FIRST_GAP_MS / PHI^n, clamped to the floor.
  const gap = MYCELIUM_FIRST_GAP_MS / Math.pow(PHI, n)
  return Math.max(MYCELIUM_MIN_GAP_MS, gap)
}

const RESOLVING_TO_RESOLVED_MS = 90
const TAIL_MS = 260

export function computeWordLockTimes(wordCount: number): number[] {
  const times: number[] = []
  if (wordCount === 0) return times
  let t = MYCELIUM_PRE_ROLL_MS
  times.push(t)
  for (let i = 1; i < wordCount; i++) {
    t += goldenDecayGap(i - 1)
    times.push(t)
  }
  return times
}

/**
 * Build a deterministic, text-seeded shuffle of the word indices.
 * The order is the sequence the dots will light up in. Same input text
 * always produces the same order, so the visual feels intentional, not
 * arbitrary-on-every-replay — and different responses light up differently.
 */
export function computeLockOrder(words: MeasuredAtom[]): number[] {
  if (words.length === 0) return []
  // FNV-1a hash over the joined text
  const seedStr = words.map((w) => w.text).join('|')
  let hash = 2166136261
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const h = hash >>> 0

  const scored = words.map((w, i) => ({
    idx: w.index,
    weight: ((i * 2654435761) ^ ((h + i * 9301) >>> 0)) >>> 0,
  }))
  scored.sort((a, b) => a.weight - b.weight)
  return scored.map((x) => x.idx)
}

function totalDuration(words: MeasuredAtom[]): number {
  if (words.length === 0) return 0
  const times = computeWordLockTimes(words.length)
  const lastLock = times[times.length - 1] ?? 0
  return lastLock + RESOLVING_TO_RESOLVED_MS + TAIL_MS
}

function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const order = computeLockOrder(words)
  const times = computeWordLockTimes(words.length)
  const events: ResolutionEvent[] = []
  order.forEach((wordIndex, orderIdx) => {
    const t = times[orderIdx] ?? 0
    events.push({ wordIndex, state: 'resolving', t })
    events.push({ wordIndex, state: 'resolved', t: t + RESOLVING_TO_RESOLVED_MS })
  })
  return events
}

export const mycelium: ModeStrategy = {
  name: 'mycelium',
  totalDuration,
  computeTimeline,
  renderOverlay: (props) => MyceliumOverlay(props),
  reducedMotionFallback: standardReducedFallback,
}

import { segmentPhrases, type Phrase } from './phrases'
import { locksFromEvents } from './profile'
import type { MeasuredAtom, ModeStrategy, ResolutionEvent } from '@/lib/diffusion/types'

// The two-channel reveal. A recording contributes the sampler's order,
// timing, and confidence, and rendering every commit crisp the moment it
// lands puts crisp text to the right of the eye in an order the eye cannot
// read (parafoveal preview: Rayner, 1998). So the render splits the signal:
//
//   state channel    a word ghosts the moment its tokens commit: settled,
//                    steady, waiting
//   reading channel  a word becomes crisp only when every word before it in
//                    its phrase is crisp, at least LEGIBLE_GAP_MS after the
//                    previous one
//
// The sampler's order survives in the state channel; the reading channel
// has no inversions inside a phrase. This is a pure timeline transform, so
// it composes with any strategy.

export const LEGIBLE_GAP_MS = 40
const TAIL_MS = 260

export type ReadingOrderOptions = {
  /** keep each phrase's earliest commit crisp at its own time: the sampler's anchor, the one word a phrase may show ahead of order */
  anchor?: boolean
}

/** Legibility time per word: its own lock, or its predecessor's legibility plus a gap, whichever is later, inside each phrase. With `anchor`, the phrase's earliest commit keeps its own time: a crisp word that never changes costs the reader nothing, and it is the reason the phrase is there. */
export function readingOrderLocks(locks: number[], phrases: Phrase[], opts: ReadingOrderOptions = {}): number[] {
  const out = locks.slice()
  for (const ph of phrases) {
    let anchor = -1
    if (opts.anchor) {
      let best = Infinity
      for (let p = ph.start; p <= ph.end; p++) {
        if (locks[p]! < best) {
          best = locks[p]!
          anchor = p
        }
      }
    }
    // The chain runs through every word except the anchor: a word after the
    // anchor still waits for the words before the anchor, so only the
    // anchor ever runs ahead of reading order.
    let prev = -Infinity
    for (let p = ph.start; p <= ph.end; p++) {
      if (p === anchor) {
        if (p === ph.start) prev = out[p]!
        continue
      }
      const own = out[p]!
      out[p] = Math.max(own, prev + LEGIBLE_GAP_MS)
      prev = out[p]!
    }
  }
  return out
}

/** How long legibility trails commitment: the median and the maximum, in milliseconds, over the words that waited. */
export function readingOrderLag(locks: number[], legible: number[]): { median: number; max: number; waited: number } {
  const lags: number[] = []
  for (let i = 0; i < locks.length; i++) {
    const lag = legible[i]! - locks[i]!
    if (lag > 1e-6) lags.push(lag)
  }
  if (lags.length === 0) return { median: 0, max: 0, waited: 0 }
  lags.sort((a, b) => a - b)
  const mid = lags[Math.floor(lags.length / 2)]!
  return { median: mid, max: lags[lags.length - 1]!, waited: lags.length }
}

export function withReadingOrder(strategy: ModeStrategy, opts: ReadingOrderOptions = { anchor: true }): ModeStrategy {
  function transformed(words: MeasuredAtom[]): { events: ResolutionEvent[]; last: number } {
    const raw = strategy.computeTimeline(words)
    const n = words.length
    if (n === 0) return { events: [], last: 0 }
    // words[i].index === i for tokenized text; keep a map for safety
    const posOf = new Map<number, number>()
    words.forEach((w, i) => posOf.set(w.index, i))
    const byPos = raw.map((e) => ({ ...e, wordIndex: posOf.get(e.wordIndex) ?? e.wordIndex }))
    const locks = locksFromEvents(byPos, n)
    const forming = new Array<number>(n).fill(Number.NaN)
    for (const e of byPos) {
      if (e.state !== 'resolving') continue
      const cur = forming[e.wordIndex]
      if (cur === undefined) continue
      if (Number.isNaN(cur) || e.t < cur) forming[e.wordIndex] = e.t
    }
    const phrases = segmentPhrases(words)
    const legible = readingOrderLocks(locks, phrases, opts)
    const events: ResolutionEvent[] = []
    let last = 0
    for (let p = 0; p < n; p++) {
      const lock = locks[p]!
      const form = Number.isNaN(forming[p]!) ? lock : Math.min(forming[p]!, lock)
      const idx = words[p]!.index
      events.push({ wordIndex: idx, state: 'resolving', t: form })
      events.push({ wordIndex: idx, state: 'resolved', t: legible[p]! })
      last = Math.max(last, legible[p]!)
    }
    return { events, last }
  }
  return {
    name: strategy.name,
    totalDuration: (words) => (words.length === 0 ? 0 : Math.max(strategy.totalDuration(words), transformed(words).last + TAIL_MS)),
    computeTimeline: (words) => transformed(words).events,
    renderOverlay: strategy.renderOverlay,
    reducedMotionFallback: strategy.reducedMotionFallback,
  }
}

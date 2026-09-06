import type { MeasuredAtom, ModeStrategy, ResolutionEvent } from '@/lib/diffusion/types'
import { standardReducedFallback } from '@/lib/diffusion/reduced-motion'
import { crystal, CRYSTAL_PRE_ROLL_MS } from '@/lib/diffusion/modes/crystal'
import { tokenize } from '@/lib/diffusion/tokenize'
import { wordSalience } from '@/lib/diffusion/salience'
import { locksFromEvents } from './profile'

// Reference arrivals. The profile is only a comparison if every arrival
// carries the same words over the same clock, so each of these shares
// crystal's total duration for the same text: the typewriter types faster or
// slower to land at the same moment, the fade ends where crystal ends.

const TAIL_MS = 260

function span(words: MeasuredAtom[]): { first: number; last: number } {
  const total = crystal.totalDuration(words)
  return { first: CRYSTAL_PRE_ROLL_MS, last: Math.max(CRYSTAL_PRE_ROLL_MS, total - TAIL_MS) }
}

/** Reading order, one word per step, linear: the arrival every chat product ships. */
export const typewriter: ModeStrategy = {
  name: 'typewriter',
  totalDuration: (words) => crystal.totalDuration(words),
  computeTimeline: (words) => {
    const n = words.length
    if (n === 0) return []
    const { first, last } = span(words)
    const events: ResolutionEvent[] = []
    words.forEach((w, i) => {
      const t = n === 1 ? first : first + ((last - first) * i) / (n - 1)
      events.push({ wordIndex: w.index, state: 'resolving', t })
      events.push({ wordIndex: w.index, state: 'resolved', t })
    })
    return events
  },
  renderOverlay: () => null,
  reducedMotionFallback: standardReducedFallback,
}

/** Every word becomes legible at the end, after a uniform blur-to-crisp ramp drawn in CSS from the run's progress. */
export const fade: ModeStrategy = {
  name: 'fade',
  totalDuration: (words) => crystal.totalDuration(words),
  computeTimeline: (words) => {
    if (words.length === 0) return []
    const { last } = span(words)
    const events: ResolutionEvent[] = []
    for (const w of words) {
      events.push({ wordIndex: w.index, state: 'resolving', t: last })
      events.push({ wordIndex: w.index, state: 'resolved', t: last })
    }
    return events
  },
  renderOverlay: () => null,
  reducedMotionFallback: standardReducedFallback,
}

function fnv1a(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Uniformly random order, linear cadence: what "out of order" looks like with no structure at all. */
export const scatter: ModeStrategy = {
  name: 'scatter',
  totalDuration: (words) => crystal.totalDuration(words),
  computeTimeline: (words) => {
    const n = words.length
    if (n === 0) return []
    const rng = mulberry32(fnv1a(words.map((w) => w.text).join('|')))
    const order = words.map((w) => w.index)
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      const tmp = order[i]!
      order[i] = order[j]!
      order[j] = tmp
    }
    const { first, last } = span(words)
    const events: ResolutionEvent[] = []
    order.forEach((wordIndex, rank) => {
      const t = n === 1 ? first : first + ((last - first) * rank) / (n - 1)
      events.push({ wordIndex, state: 'resolving', t })
      events.push({ wordIndex, state: 'resolved', t })
    })
    return events
  },
  renderOverlay: () => null,
  reducedMotionFallback: standardReducedFallback,
}

/** Synthetic geometry for a text, so strategies that read positions (fog, aurora, mitosis) can be scored without a browser: ten words per visual line. */
export const SYNTHETIC_WORDS_PER_LINE = 10
export function syntheticAtoms(text: string, topic?: string): MeasuredAtom[] {
  const raw = tokenize(text)
  const sal = wordSalience(raw, topic)
  let visualLine = 0
  let col = 0
  let lastLine = -1
  return raw.map((a, i) => {
    if (a.lineIndex !== lastLine) {
      if (lastLine !== -1) visualLine++
      lastLine = a.lineIndex
      col = 0
    } else if (col >= SYNTHETIC_WORDS_PER_LINE) {
      visualLine++
      col = 0
    }
    const w = 16 + a.text.length * 8
    const atom: MeasuredAtom = {
      ...a,
      salience: sal[i],
      bbox: { x: col * 76, y: visualLine * 28, w, h: 20 },
    }
    col++
    return atom
  })
}

export type Arrival = { atoms: MeasuredAtom[]; locks: number[]; total: number }

/** One arrival of a text under a strategy, over synthetic geometry: the input the profile and the figures read. */
export function arrivalOf(strategy: ModeStrategy, text: string, topic?: string): Arrival {
  const atoms = syntheticAtoms(text, topic)
  const events = strategy.computeTimeline(atoms)
  return { atoms, locks: locksFromEvents(events, atoms.length), total: strategy.totalDuration(atoms) }
}

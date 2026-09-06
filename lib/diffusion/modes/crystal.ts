import type { ModeStrategy, MeasuredAtom, ResolutionEvent } from '../types'
import { standardReducedFallback } from '../reduced-motion'
import { segmentPhrases, type Phrase } from '@/lib/arrival/phrases'

// Crystallize: nucleation-limited growth, in steps.
//
// A supersaturated solution does not crystallize everywhere at once. A few
// sites nucleate, each crystal grows locally along its lattice, grains meet
// at boundaries, and the finished crystal is ordered and still. Each stage
// is one property of the arrival profile (lib/arrival/profile.ts):
//
//   nucleation is rate-limited   at most CRYSTAL_TENSION_BUDGET phrases are
//                                open at once (the Zeigarnik effect: one or
//                                two open loops hold attention; more overwhelm)
//   growth follows the lattice   inside a phrase, one crisp anchor (the
//                                nucleus, its most salient word) and then
//                                reading order from the phrase's first word
//                                (parafoveal preview: a word that is still
//                                noise when the eye samples it costs a
//                                fixation; a crisp word that never changes
//                                costs nothing, and arriving in order keeps
//                                every preview valid)
//   grains meet                  each step tends to complete a phrase
//                                (gestalt closure: many small wholes on the
//                                way to the whole)
//   the crystal is still         the last lock is followed by one quiet
//                                exhale, drawn in CSS (peak-end: the ending
//                                is completion)
//
// Which phrase opens next follows salience (lib/diffusion/salience.ts): the
// most salient unopened phrase, spread across the answer, so the gist opens
// first wherever it sits and the connective tissue opens last. When a phrase
// opens, its most salient word (the nucleus) locks at once as the reason
// the phrase opened; crisp legibility then proceeds from the phrase's first
// word, so a plot shows its vault before its articles and still reads left
// to right around it. `anchorFirst: false` keeps strict reading order.
//
// The cadence: about CRYSTAL_TARGET_STEPS steps per answer, each inside the
// Doherty threshold, linear on average (the recorded word cadence is linear
// within 0.119 of a straight line), with a long-short swing from the brand
// voice. Same text, same schedule.

export const CRYSTAL_PRE_ROLL_MS = 320
export const CRYSTAL_BUDGET_MS = 5200
export const CRYSTAL_TARGET_STEPS = 20
export const CRYSTAL_STEP_MS_MIN = 140
export const CRYSTAL_STEP_MS_MAX = 260
/** the voice's tempo may push an interval only this far */
export const CRYSTAL_STEP_MS_FLOOR = 100
export const CRYSTAL_STEP_MS_CEILING = 390
export const CRYSTAL_STEP_SPREAD_MS = 70
export const CRYSTAL_SWING = 0.08
export const CRYSTAL_TENSION_BUDGET = 2
/** the field quiets this long after the last lock (see globals.css, data-settled) */
export const CRYSTAL_EXHALE_MS = 420
const TAIL_MS = 260

export type CrystalOptions = {
  /** how many phrases may be open at once; 'unbounded' is the earlier mycelium behavior */
  budget?: number | 'unbounded'
  /** long-short syncopation of the step interval, 0 to 0.12 */
  swing?: number
  /** speed multiplier, 0.7 to 1.4; intervals stay inside the floor and ceiling */
  tempo?: number
  /** lock each phrase's nucleus first; false keeps strict reading order inside a phrase */
  anchorFirst?: boolean
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// A small deterministic PRNG (mulberry32) seeded from the FNV-1a hash of the
// text, so the schedule is reproducible per input.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function fnv1a(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Words committed per step: the answer spread over about CRYSTAL_TARGET_STEPS steps, and never fewer words than open fronts, so every front advances every step and no phrase reads slower than a reader reads (the reader model in lib/arrival/profile.ts). */
export function wordsPerStep(n: number, fronts = 1): number {
  if (n <= 0) return 1
  return Math.max(1, Math.min(n, Math.max(fronts, Math.ceil(n / CRYSTAL_TARGET_STEPS))))
}

export type CrystalSchedule = {
  phrases: Phrase[]
  /** word positions in commit order */
  order: number[]
  /** the step each rank commits in */
  stepOf: number[]
  /** the rank's position inside its step, 0..1, in reading order inside each open phrase */
  spread: number[]
  /** the step at which each phrase opened */
  openStep: number[]
  /** the step at which each phrase closed */
  closeStep: number[]
  /** how many steps the schedule takes */
  steps: number
}

/**
 * The growth process, deterministic per text. Phrases open under the
 * budget, in salience order with a spread bonus; every step advances every
 * open phrase by its share of the step's words, in reading order, and a
 * phrase whose remaining words fit in its share plus one takes all of them
 * so the step ends on a closure. When a phrase closes, the next opens.
 */
export function computeCrystalSchedule(words: MeasuredAtom[], opts: CrystalOptions = {}): CrystalSchedule {
  const n = words.length
  const phrases = segmentPhrases(words)
  if (n === 0) return { phrases, order: [], stepOf: [], spread: [], openStep: [], closeStep: [], steps: 0 }
  const budget = opts.budget === 'unbounded' ? Infinity : Math.max(1, Math.floor(opts.budget ?? CRYSTAL_TENSION_BUDGET))
  const rng = mulberry32(fnv1a(words.map((w) => w.text).join('|')))
  const k = wordsPerStep(n, Number.isFinite(budget) ? budget : 1)

  const order: number[] = []
  const stepOf: number[] = []
  const spread: number[] = []
  const openStep = new Array<number>(phrases.length).fill(-1)
  const closeStep = new Array<number>(phrases.length).fill(-1)
  const front = phrases.map((ph) => ph.start)
  const done = new Array<boolean>(n).fill(false)
  const touched: boolean[] = phrases.map(() => false)
  const anchorFirst = opts.anchorFirst ?? true
  // the next open position of a phrase's front, skipping its anchor
  const advance = (id: number) => {
    const ph = phrases[id]!
    while (front[id]! <= ph.end && done[front[id]!]) front[id] = front[id]! + 1
  }
  const open: number[] = []
  let unopened = phrases.length

  // The next phrase to open: the most salient one left, pulled toward the
  // part of the answer nothing has touched yet, so the first seeds spread
  // across the whole and the gist opens wherever it sits.
  const center = (ph: Phrase) => (ph.start + ph.end) / 2
  const pickSeed = (): number => {
    let best = -1
    let bestScore = -Infinity
    const anyTouched = touched.some(Boolean)
    for (const ph of phrases) {
      if (touched[ph.id]) continue
      let dist = 0
      if (anyTouched) {
        let nearest = Infinity
        for (const other of phrases) {
          if (!touched[other.id]) continue
          nearest = Math.min(nearest, Math.abs(center(ph) - center(other)))
        }
        dist = clamp((nearest / n) * 2, 0, 1)
      }
      const score = ph.salience + 0.25 * dist + rng() * 0.02
      if (score > bestScore) {
        bestScore = score
        best = ph.id
      }
    }
    return best
  }

  let step = 0
  let rotate = 0
  while (unopened > 0 || open.length > 0) {
    const batch: { pos: number; phrase: number }[] = []
    const closing: number[] = []
    while (open.length < budget && unopened > 0) {
      const id = pickSeed()
      if (id < 0) break
      touched[id] = true
      unopened--
      open.push(id)
      openStep[id] = step
      const ph = phrases[id]!
      if (anchorFirst && ph.end > ph.start) {
        // the nucleus locks the step its phrase opens: the anchor
        batch.push({ pos: ph.nucleus, phrase: id })
        done[ph.nucleus] = true
        advance(id)
      }
    }
    // Shares: k words across the open phrases, the remainder rotating so
    // every front advances at the same average rate.
    const m = open.length
    const base = Math.floor(k / m)
    const extra = k % m
    for (let i = 0; i < m; i++) {
      const id = open[i]!
      const ph = phrases[id]!
      const share = base + ((i + rotate) % m < extra ? 1 : 0)
      let remaining = 0
      for (let p = front[id]!; p <= ph.end; p++) if (!done[p]) remaining++
      let take = remaining <= share + 1 ? remaining : share
      if (take <= 0 && i === (rotate % m) && remaining > 0) take = 1
      for (let j = 0; j < take; j++) {
        advance(id)
        const pos = front[id]!
        batch.push({ pos, phrase: id })
        done[pos] = true
        front[id] = pos + 1
      }
      advance(id)
      if (front[id]! > ph.end) closing.push(id)
    }
    if (batch.length === 0 && m > 0) {
      // Every open front has a zero share this step (more fronts than
      // words per step); advance the rotating front by one word.
      const id = open[rotate % m]!
      advance(id)
      const pos = front[id]!
      batch.push({ pos, phrase: id })
      done[pos] = true
      front[id] = pos + 1
      advance(id)
      if (front[id]! > phrases[id]!.end) closing.push(id)
    }
    batch.forEach((b, r) => {
      order.push(b.pos)
      stepOf.push(step)
      spread.push(batch.length <= 1 ? 0 : r / (batch.length - 1))
    })
    for (const id of closing) {
      closeStep[id] = step
      const at = open.indexOf(id)
      if (at >= 0) open.splice(at, 1)
    }
    rotate++
    step++
  }
  return { phrases, order, stepOf, spread, openStep, closeStep, steps: step }
}

/** Milliseconds between steps for a schedule of `steps` steps at a tempo. */
export function stepIntervalFor(steps: number, tempo = 1): number {
  const base = steps <= 0 ? CRYSTAL_STEP_MS_MAX : clamp(CRYSTAL_BUDGET_MS / steps, CRYSTAL_STEP_MS_MIN, CRYSTAL_STEP_MS_MAX)
  return clamp(base / clamp(tempo, 0.7, 1.4), CRYSTAL_STEP_MS_FLOOR, CRYSTAL_STEP_MS_CEILING)
}

/** When step s lands: evenly spaced after the pre-roll, with every odd step pushed late by the swing. */
export function stepTimeFor(step: number, interval: number, swing: number): number {
  const s = clamp(swing, 0, 0.12)
  return CRYSTAL_PRE_ROLL_MS + step * interval + (step % 2 === 1 ? s * interval : 0)
}

export function crystalWith(opts: CrystalOptions = {}): ModeStrategy {
  const swing = opts.swing ?? CRYSTAL_SWING
  const tempo = opts.tempo ?? 1

  function schedule(words: MeasuredAtom[]) {
    return computeCrystalSchedule(words, opts)
  }

  function lastLockMs(words: MeasuredAtom[]): number {
    const sch = schedule(words)
    if (sch.steps === 0) return 0
    const interval = stepIntervalFor(sch.steps, tempo)
    return stepTimeFor(sch.steps - 1, interval, swing) + CRYSTAL_STEP_SPREAD_MS
  }

  function totalDuration(words: MeasuredAtom[]): number {
    if (words.length === 0) return 0
    return lastLockMs(words) + TAIL_MS
  }

  // 'resolving' is the forming stage (the word ghosts in, steady), 'resolved'
  // is the lock. A nucleus ghosts when its phrase opens; every other word
  // ghosts one step before it locks, never before its phrase has opened.
  function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
    if (words.length === 0) return []
    const sch = schedule(words)
    const interval = stepIntervalFor(sch.steps, tempo)
    const phraseOf = new Array<number>(words.length).fill(-1)
    for (const ph of sch.phrases) for (let p = ph.start; p <= ph.end; p++) phraseOf[p] = ph.id
    const events: ResolutionEvent[] = []
    sch.order.forEach((pos, rank) => {
      const lock = stepTimeFor(sch.stepOf[rank]!, interval, swing) + sch.spread[rank]! * CRYSTAL_STEP_SPREAD_MS
      const ph = sch.phrases[phraseOf[pos]!]!
      const openT = stepTimeFor(sch.openStep[ph.id]!, interval, swing)
      const isNucleus = ph.nucleus === pos && ph.end > ph.start
      const form = isNucleus ? Math.min(openT, lock) : Math.max(openT - CRYSTAL_STEP_SPREAD_MS, lock - interval)
      const wordIndex = words[pos]!.index
      events.push({ wordIndex, state: 'resolving', t: Math.max(0, Math.min(form, lock)) })
      events.push({ wordIndex, state: 'resolved', t: lock })
    })
    return events
  }

  return {
    name: 'crystal',
    totalDuration,
    computeTimeline,
    renderOverlay: () => null,
    reducedMotionFallback: standardReducedFallback,
  }
}

export const crystal: ModeStrategy = crystalWith({})

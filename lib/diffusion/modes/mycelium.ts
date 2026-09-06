import type { ModeStrategy, MeasuredAtom, ResolutionEvent } from '../types'
import { standardReducedFallback } from '../reduced-motion'
import { MyceliumOverlay } from '@/components/diffusion/mycelium-overlay'
import orderModel from '@/data/traces/derived/order-model.json'

// Mycelium: parallel growth from several seeds, committed in steps.
//
// The order. A diffusion sampler is free to commit anywhere in the field.
// The recorded default sampler reads nearly left to right only because its
// block schedule says which 32 positions are open at a time (finding 01);
// the same confidence rule with no schedule grows a few clusters at once,
// each one local (finding 02: 50% of consecutive commits adjacent, a fresh
// anchor about every 3.5 commits, see data/traces/derived/order-model.json,
// entry "lowconf-b128"). The schedule is a product decision, and the reveal
// does not inherit it: this mode performs the schedule-free order. Several
// seeds open across the whole answer, every live front grows outward with
// the recorded jump distribution, and new seeds open in the largest gap
// left, so the answer resolves in parallel from many places and closes
// where the fronts meet.
//
// The gist. Which word seeds a region, and which neighbor a front grows
// into next, follows salience (lib/diffusion/salience.ts): list markers and
// line openings, then the words that echo the prompt, proper nouns, numbers,
// and long or repeated content words, with function words and bare
// punctuation last. Step 0 seeds each slice of the answer with its most
// salient word, so the skeleton and the topic are on screen first and the
// connective tissue fills in around them: the answer reads as sculpted, the
// gist before the grammar. A word's salience is a hint the process reads;
// with no hint (or a flat one) the process is the plain growth above.
//
// The cadence. A fast diffusion decoder commits several positions per
// denoising step, so the locks here arrive in steps too: about
// MYCELIUM_TARGET_STEPS per answer, each step inside the Doherty threshold
// (no wait past MYCELIUM_STEP_MS_MAX between visible bursts) and no faster
// than MYCELIUM_STEP_MS_MIN so a burst registers as one. Within a step the
// words land across a MYCELIUM_STEP_JITTER_MS spread, which keeps a step from
// reading as a machine tick. The average rate is linear, which is what the
// recorded word cadence is (DERIVED.cadenceMaxDeviation); the phi
// acceleration that came first is retired to the comparison stimulus.
export const MYCELIUM_PRE_ROLL_MS = 320
export const MYCELIUM_BUDGET_MS = 5200
export const MYCELIUM_TARGET_STEPS = 20
export const MYCELIUM_STEP_MS_MIN = 140
export const MYCELIUM_STEP_MS_MAX = 260
export const MYCELIUM_STEP_JITTER_MS = 70
/** The forming lead: a word ghosts in (the final word, blurred and steady)
 *  this long before it locks, so every lock is preceded by a beat of
 *  expectation (reward anticipation). About one step, so each burst of
 *  locks lands as the next burst ghosts in. */
export const MYCELIUM_FORMING_MS = 300
/** The swing: alternate step intervals run long and short by this share, so
 *  the pulse has a lilt (moderate syncopation is the most pleasurable pulse,
 *  a metronome the least). The average interval is unchanged. */
export const MYCELIUM_SWING = 0.08
/** Salience at or above which an open word is seeded outright, one per step,
 *  before the fronts grow: the topic and the skeleton land first. */
export const GIST_SEED_FLOOR = 0.6

const TAIL_MS = 260

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Words committed per step: the answer spread over about
 *  MYCELIUM_TARGET_STEPS steps, never fewer than one word per step. */
export function wordsPerStep(n: number): number {
  if (n <= 0) return 1
  return Math.max(1, Math.ceil(n / MYCELIUM_TARGET_STEPS))
}

/** Steps an answer of n words takes. */
export function stepCount(n: number): number {
  if (n <= 0) return 0
  return Math.ceil(n / wordsPerStep(n))
}

/** Milliseconds between steps: the budget spread evenly over the steps,
 *  bounded by the threshold above and legibility below. */
export function stepInterval(n: number): number {
  const steps = stepCount(n)
  if (steps <= 0) return MYCELIUM_STEP_MS_MAX
  return clamp(MYCELIUM_BUDGET_MS / steps, MYCELIUM_STEP_MS_MIN, MYCELIUM_STEP_MS_MAX)
}

/** When step s lands: evenly spaced after the pre-roll, with every odd step
 *  pushed late by the swing so the pulse alternates long and short. */
export function stepTime(step: number, n: number): number {
  const gap = stepInterval(n)
  return MYCELIUM_PRE_ROLL_MS + step * gap + (step % 2 === 1 ? MYCELIUM_SWING * gap : 0)
}

/** Lock time by commit rank, before the within-step jitter: every word of a
 *  step shares the step's time. Rank i is in step floor(i / wordsPerStep). */
export function computeWordLockTimes(wordCount: number): number[] {
  const times: number[] = []
  if (wordCount === 0) return times
  const k = wordsPerStep(wordCount)
  for (let i = 0; i < wordCount; i++) {
    times.push(stepTime(Math.floor(i / k), wordCount))
  }
  return times
}

// Jump-distance histogram of the schedule-free sampler (low-confidence
// remasking, one 128-position field), fitted over its usable recorded runs:
// data/traces/derived/order-model.json, entry "lowconf-b128". A commit at
// distance 1 from the front it grows from happens 51.4% of the time; a jump
// of 11 or more, which reads as a fresh seed, 4.3%.
type JumpClass = '1' | '2' | '3-5' | '6-10' | '11+'
const JUMP_HIST = orderModel['lowconf-b128'].jump_hist as Record<JumpClass, number>
const JUMP_CLASSES: JumpClass[] = ['1', '2', '3-5', '6-10', '11+']

// A small deterministic PRNG (mulberry32) seeded from the FNV-1a hash of the
// text, so the growth process is reproducible per input and nothing else in
// the render path needs to carry random state.
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

function pickJumpClass(rng: () => number): JumpClass {
  const r = rng()
  let cum = 0
  for (const cls of JUMP_CLASSES) {
    cum += JUMP_HIST[cls]
    if (r < cum) return cls
  }
  return JUMP_CLASSES[JUMP_CLASSES.length - 1]!
}

function jumpDistance(cls: JumpClass, rng: () => number): number {
  switch (cls) {
    case '1':
      return 1
    case '2':
      return 2
    case '3-5':
      return 3 + Math.floor(rng() * 3) // 3, 4, 5
    case '6-10':
      return 6 + Math.floor(rng() * 5) // 6..10
    case '11+':
      return -1 // a fresh seed
  }
}

export type LockSchedule = {
  /** word indices in commit order */
  order: number[]
  /** the step each rank commits in, same length as order */
  stepOf: number[]
  /** within-step spread for each rank, 0..1, same length as order */
  jitter: number[]
}

/**
 * The growth process, deterministic per text. Step 0 opens one seed per
 * commit of the step, spread across the answer (one in each equal slice,
 * at a seeded spot inside it), the way a decoder's first step commits its
 * surest tokens wherever they are. Every later commit either extends a live
 * front (a committed word with an open neighbor, chosen uniformly, so every
 * cluster grows at the same rate whatever its size) by a distance drawn
 * from the recorded jump distribution, walking outward when the exact spot
 * is taken, or, on a long jump, opens a fresh seed near the middle of the
 * largest open gap. Fronts die where they meet. Same text, same schedule.
 */
export function computeLockSchedule(words: MeasuredAtom[]): LockSchedule {
  const n = words.length
  if (n === 0) return { order: [], stepOf: [], jitter: [] }

  const rng = mulberry32(fnv1a(words.map((w) => w.text).join('|')))
  const k = wordsPerStep(n)
  const sal = (p: number) => words[p]?.salience ?? 0.3

  // Work in array positions (0..n-1); words[i].index === i for every
  // tokenized atom (see lib/diffusion/tokenize.ts).
  const committed = new Array<boolean>(n).fill(false)
  const order: number[] = []
  const stepOf: number[] = []
  const jitter: number[] = []

  const isOpen = (p: number) => p >= 0 && p < n && !committed[p]
  const commit = (pos: number, step: number) => {
    committed[pos] = true
    order.push(words[pos]!.index)
    stepOf.push(step)
    jitter.push(rng())
  }
  const frontier = (): number[] => {
    const out: number[] = []
    for (let p = 0; p < n; p++) if (committed[p] && (isOpen(p - 1) || isOpen(p + 1))) out.push(p)
    return out
  }
  // The most salient open word in a range, ties broken by the seeded rng.
  const mostSalient = (lo: number, hi: number): number => {
    let best = -1
    let bestScore = -Infinity
    for (let p = lo; p <= hi; p++) {
      if (committed[p]) continue
      const score = sal(p) + rng() * 0.05
      if (score > bestScore) {
        bestScore = score
        best = p
      }
    }
    return best
  }
  // A seed in the largest run of open positions: its most salient word,
  // which in the middle of a sentence is usually a content word.
  const seedInLargestGap = (): number => {
    let bestStart = -1
    let bestLen = 0
    let p = 0
    while (p < n) {
      if (committed[p]) {
        p++
        continue
      }
      let q = p
      while (q < n && !committed[q]) q++
      if (q - p > bestLen) {
        bestLen = q - p
        bestStart = p
      }
      p = q
    }
    return mostSalient(bestStart, bestStart + bestLen - 1)
  }

  // Step 0: one seed per slice of the answer, the slice's most salient word.
  const firstK = Math.min(k, n)
  for (let i = 0; i < firstK; i++) {
    const lo = Math.floor((i * n) / firstK)
    const hi = Math.floor(((i + 1) * n) / firstK) - 1
    commit(mostSalient(lo, hi), 0)
  }

  // A gist seed: the most salient word still open anywhere in the answer,
  // when one clears GIST_SEED_FLOOR. One per step, as the step's first
  // commit, so the topic words and the skeleton land in the first few steps
  // wherever they sit, and the growth then closes around them. Growth alone
  // can only reach a word through its neighbors, which would put the words
  // between a front and a topic word on screen before the topic word.
  const gistSeed = (): number => {
    let best = -1
    let bestScore = GIST_SEED_FLOOR
    for (let p = 0; p < n; p++) {
      if (committed[p]) continue
      const score = sal(p) + rng() * 0.02
      if (score > bestScore) {
        bestScore = score
        best = p
      }
    }
    return best
  }

  let step = 1
  while (order.length < n) {
    for (let j = 0; j < k && order.length < n; j++) {
      if (j === 0) {
        const g = gistSeed()
        if (g !== -1) {
          commit(g, step)
          continue
        }
      }
      const cls = pickJumpClass(rng)
      const d = jumpDistance(cls, rng)
      const fronts = frontier()
      if (d === -1 || fronts.length === 0) {
        commit(seedInLargestGap(), step)
        continue
      }
      // Which front grows, and which way: weighted by the salience of the
      // open neighbor it would grow into, with a floor so every word is
      // reachable and function words still fill in.
      const options: { base: number; dir: number; w: number }[] = []
      for (const base of fronts) {
        for (const dir of [1, -1]) {
          if (isOpen(base + dir)) {
            // Salience squared, so a topic word pulls a front toward it well
            // before a function word does, with a floor so every word is
            // still reachable and the connective tissue fills in.
            const sv = sal(base + dir)
            options.push({ base, dir, w: 0.06 + sv * sv * 1.2 })
          }
        }
      }
      let pick = rng() * options.reduce((acc, o) => acc + o.w, 0)
      let chosen = options[options.length - 1]!
      for (const o of options) {
        pick -= o.w
        if (pick <= 0) {
          chosen = o
          break
        }
      }
      const { base, dir } = chosen
      let target = base + dir * d
      if (!isOpen(target)) {
        target = -1
        for (let q = 1; ; q++) {
          const p = base + dir * q
          if (p < 0 || p >= n) break
          if (!committed[p]) {
            target = p
            break
          }
        }
      }
      commit(target === -1 ? seedInLargestGap() : target, step)
    }
    step++
  }

  return { order, stepOf, jitter }
}

/** The commit order alone. */
export function computeLockOrder(words: MeasuredAtom[]): number[] {
  return computeLockSchedule(words).order
}

function lastLockMs(n: number): number {
  if (n === 0) return 0
  return stepTime(stepCount(n) - 1, n) + MYCELIUM_STEP_JITTER_MS
}

function totalDuration(words: MeasuredAtom[]): number {
  if (words.length === 0) return 0
  return lastLockMs(words.length) + TAIL_MS
}

// 'resolving' is the forming stage (the word ghosts in), 'resolved' is the
// lock itself. The lock lands at its step's time plus the word's share of the
// in-step spread; the forming stage leads it by MYCELIUM_FORMING_MS.
function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const { order, stepOf, jitter } = computeLockSchedule(words)
  const events: ResolutionEvent[] = []
  order.forEach((wordIndex, rank) => {
    const lock = stepTime(stepOf[rank]!, words.length) + jitter[rank]! * MYCELIUM_STEP_JITTER_MS
    events.push({ wordIndex, state: 'resolving', t: Math.max(0, lock - MYCELIUM_FORMING_MS) })
    events.push({ wordIndex, state: 'resolved', t: lock })
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

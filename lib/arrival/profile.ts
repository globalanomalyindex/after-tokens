import { segmentPhrases, type Phrase, type PhraseAtom } from './phrases'
import type { ResolutionEvent } from '@/lib/diffusion/types'

// The arrival profile. An arrival is one number per word: the time it
// becomes legible. From that vector, the phrase structure, and the words'
// salience, four properties follow, each grounded in one mechanism from the
// psychology of reading and reward:
//
//   tension   the Zeigarnik effect: how many phrases are partly settled at
//             once. Open loops hold attention; too many overwhelm.
//   closure   gestalt closure and the aha effect: how often a step completes
//             a whole, and how many wholes complete on the way.
//   peak/end  the peak-end rule: where the most intense moment falls and
//             how the run ends. The peak should be the gist; the end quiet.
//   fluency   processing fluency and parafoveal preview: whether legibility
//             arrives in reading order inside a phrase, and how far from
//             reading order the answer arrives at the phrase scale.
//
// The numbers describe an arrival. They never describe a reader; that is
// what the study is for.

export type ArrivalInput = {
  atoms: PhraseAtom[]
  /** legibility time per word, milliseconds, same order as atoms */
  locks: number[]
  /** the run's total duration, milliseconds */
  total: number
  phrases?: Phrase[]
}

export type StepPoint = { t: number; v: number }

export type ArrivalProfile = {
  words: number
  phrases: number
  total: number
  tension: {
    /** most phrases open at once */
    max: number
    /** time-weighted mean of open phrases over the active interval */
    mean: number
    /** step series of open phrases, one point per change */
    series: StepPoint[]
  }
  closure: {
    /** phrases that complete (always the phrase count for a finished run) */
    count: number
    /** lock clusters separated by more than STEP_GAP_MS */
    steps: number
    /** share of steps that complete at least one phrase */
    alignment: number
    /** the largest single closure as a share of the words */
    largestShare: number
  }
  peak: {
    /** position of the intensity peak as a share of the run */
    at: number
    /** when the top fifth of words by salience are all legible, as a share of the run */
    gistAt: number
    /** mean intensity over the last 15% of the run over the mean over the whole run */
    endWeight: number
    /** sampled intensity, locks per second weighted by salience */
    series: StepPoint[]
  }
  fluency: {
    /** share of within-phrase word pairs that become legible out of reading order */
    inversions: number
    /** share of fixations whose next word was still illegible: the reader model below */
    previewCost: number
    /** Kendall's tau between legibility order and reading order over the whole answer */
    tau: number
  }
}

/** Locks closer than this land in one step: a burst, the way a decoder commits several positions per denoising step. */
export const STEP_GAP_MS = 60
/** The attention window (Doherty and Thadhani, 1982): intensity is measured over it. */
export const INTENSITY_WINDOW_MS = 400
export const GIST_SHARE = 0.2
/** A reader's pace inside a phrase, one fixation per word (Rayner, 1998: mean fixation about a quarter second). */
export const READ_MS = 250
export const END_SHARE = 0.15
const SAMPLES = 160
const DEFAULT_SALIENCE = 0.3

function sal(atom: PhraseAtom | undefined): number {
  return atom?.salience ?? DEFAULT_SALIENCE
}

/** The legibility time per word from a strategy's events: the time of its 'resolved' event (the latest, if several). */
export function locksFromEvents(events: ResolutionEvent[], n: number): number[] {
  const locks = new Array<number>(n).fill(Number.NaN)
  for (const e of events) {
    if (e.state !== 'resolved') continue
    const cur = locks[e.wordIndex]
    if (cur === undefined) continue
    if (Number.isNaN(cur) || e.t > cur) locks[e.wordIndex] = e.t
  }
  return locks
}

/** Kendall's tau between an order (a value per position) and the positions themselves. Ties count as neither concordant nor discordant. +1 is left to right. */
export function kendallTau(values: number[]): number {
  const n = values.length
  let c = 0
  let d = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = values[i]!
      const b = values[j]!
      if (b > a) c++
      else if (b < a) d++
    }
  }
  const pairs = (n * (n - 1)) / 2
  return pairs === 0 ? 0 : (c - d) / pairs
}

export function arrivalProfile(input: ArrivalInput): ArrivalProfile {
  const { atoms, locks, total } = input
  const n = atoms.length
  const phrases = input.phrases ?? segmentPhrases(atoms)
  const empty: ArrivalProfile = {
    words: n,
    phrases: phrases.length,
    total,
    tension: { max: 0, mean: 0, series: [] },
    closure: { count: 0, steps: 0, alignment: 0, largestShare: 0 },
    peak: { at: 0, gistAt: 0, endWeight: 0, series: [] },
    fluency: { inversions: 0, previewCost: 0, tau: 0 },
  }
  if (n === 0 || locks.length !== n || total <= 0) return empty

  // Locks in time order, with the phrase each belongs to.
  const phraseOf = new Array<number>(n).fill(-1)
  for (const ph of phrases) for (let p = ph.start; p <= ph.end; p++) phraseOf[p] = ph.id
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => locks[a]! - locks[b]! || a - b)
  const firstLock = locks[order[0]!]!
  const lastLock = locks[order[n - 1]!]!

  // Tension: open phrases over time, as a step function.
  const settled = new Array<number>(phrases.length).fill(0)
  const size = phrases.map((ph) => ph.end - ph.start + 1)
  const series: StepPoint[] = [{ t: 0, v: 0 }]
  let open = 0
  let max = 0
  let area = 0
  let lastT = firstLock
  // Words that lock at the same instant land together: a phrase whose
  // words all arrive at once never reads as open.
  for (let i = 0; i < n; ) {
    const t = locks[order[i]!]!
    area += open * (t - lastT)
    lastT = t
    let j = i
    while (j < n && locks[order[j]!]! === t) {
      const ph = phraseOf[order[j]!]!
      if (ph >= 0) settled[ph] = (settled[ph] ?? 0) + 1
      j++
    }
    open = 0
    for (let ph = 0; ph < phrases.length; ph++) {
      const s = settled[ph]!
      if (s > 0 && s < size[ph]!) open++
    }
    if (open > max) max = open
    series.push({ t, v: open })
    i = j
  }
  const active = lastLock - firstLock
  const mean = active > 0 ? area / active : max

  // Closure: phrases close at their last lock; steps are lock clusters.
  const closeAt = phrases.map((ph) => {
    let m = -Infinity
    for (let p = ph.start; p <= ph.end; p++) m = Math.max(m, locks[p]!)
    return m
  })
  const steps: { from: number; to: number }[] = []
  for (const w of order) {
    const t = locks[w]!
    const cur = steps[steps.length - 1]
    if (cur && t - cur.to <= STEP_GAP_MS) cur.to = t
    else steps.push({ from: t, to: t })
  }
  let closingSteps = 0
  for (const st of steps) {
    if (closeAt.some((c) => c >= st.from - 1e-6 && c <= st.to + 1e-6)) closingSteps++
  }
  const largest = Math.max(0, ...size) / n

  // Peak and end: salience-weighted locks per second in the attention window.
  const intensity: StepPoint[] = []
  let peakV = -1
  let peakT = 0
  let sum = 0
  let endSum = 0
  let endCount = 0
  for (let s = 0; s <= SAMPLES; s++) {
    const t = (s / SAMPLES) * total
    let v = 0
    for (let i = 0; i < n; i++) {
      const lt = locks[i]!
      if (lt > t - INTENSITY_WINDOW_MS && lt <= t) v += 0.5 + sal(atoms[i])
    }
    v = v / (INTENSITY_WINDOW_MS / 1000)
    intensity.push({ t, v })
    sum += v
    if (t >= total * (1 - END_SHARE)) {
      endSum += v
      endCount++
    }
    if (v > peakV) {
      peakV = v
      peakT = t
    }
  }
  const meanAll = sum / (SAMPLES + 1)
  const meanEnd = endCount > 0 ? endSum / endCount : 0
  const endWeight = meanAll > 0 ? meanEnd / meanAll : 0
  const bySal = Array.from({ length: n }, (_, i) => i).sort((a, b) => sal(atoms[b]) - sal(atoms[a]) || a - b)
  const gistCount = Math.max(1, Math.ceil(n * GIST_SHARE))
  let gistT = 0
  for (let i = 0; i < gistCount; i++) gistT = Math.max(gistT, locks[bySal[i]!]!)

  // Fluency: inversions inside phrases, tau across the answer, and the
  // reader model. The parafoveal cost of a reveal is a preview the eye
  // cannot take: while fixating one word the eye samples the next, and a
  // word that is still noise when the eye is ready to move to it costs a
  // wait. A reader starts each phrase when its first word is legible,
  // fixates one word per READ_MS, and waits when the next word is not there
  // yet. A fixation is charged when the word to its right was still
  // illegible at the end of the fixation.
  let pairs = 0
  let inv = 0
  let fixations = 0
  let invalid = 0
  for (const ph of phrases) {
    for (let i = ph.start; i <= ph.end; i++) {
      for (let j = i + 1; j <= ph.end; j++) {
        pairs++
        if (locks[j]! < locks[i]! - 1e-6) inv++
      }
    }
    let f = locks[ph.start]!
    for (let i = ph.start; i < ph.end; i++) {
      f = Math.max(f, locks[i]!)
      fixations++
      if (locks[i + 1]! > f + READ_MS + 1e-6) invalid++
      f += READ_MS
    }
  }

  return {
    words: n,
    phrases: phrases.length,
    total,
    tension: { max, mean, series },
    closure: {
      count: phrases.length,
      steps: steps.length,
      alignment: steps.length > 0 ? closingSteps / steps.length : 0,
      largestShare: largest,
    },
    peak: { at: peakT / total, gistAt: gistT / total, endWeight, series: intensity },
    fluency: {
      inversions: pairs > 0 ? inv / pairs : 0,
      previewCost: fixations > 0 ? invalid / fixations : 0,
      tau: kendallTau(locks),
    },
  }
}

/** Round every scalar in a profile for a report; the series are dropped. */
export function profileSummary(p: ArrivalProfile) {
  const r = (x: number, d = 2) => Number(x.toFixed(d))
  return {
    words: p.words,
    phrases: p.phrases,
    totalMs: Math.round(p.total),
    tensionMax: p.tension.max,
    tensionMean: r(p.tension.mean),
    closures: p.closure.count,
    steps: p.closure.steps,
    alignment: r(p.closure.alignment),
    largestShare: r(p.closure.largestShare),
    peakAt: r(p.peak.at),
    gistAt: r(p.peak.gistAt),
    endWeight: r(p.peak.endWeight),
    inversions: r(p.fluency.inversions, 3),
    previewCost: r(p.fluency.previewCost, 3),
    tau: r(p.fluency.tau),
  }
}
export type ProfileSummary = ReturnType<typeof profileSummary>

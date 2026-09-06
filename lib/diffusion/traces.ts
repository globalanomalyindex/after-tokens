import type { MeasuredAtom, ModeStrategy, ResolutionEvent } from './types'
import { standardReducedFallback } from './reduced-motion'

// A recorded denoising trajectory from a real masked diffusion language model,
// in the compact shape the site loads (see data/traces/README.md for the full
// schema and how it was captured). This is the one signal source in the piece
// that is not authored: every lock time below comes from the step at which the
// sampler actually committed that word.

export type TraceSamplerConfig = {
  id: string
  remasking: 'low_confidence' | 'random'
  block_size: number
  steps: number
  max_new_tokens: number
  temperature: number
  note: string
}

export type TraceWord = {
  index: number
  text: string
  /** generated token positions that overlap this whitespace word */
  tokens: number[]
  /** the denoising step at which the LAST of its tokens committed */
  lock_step: number
  /** the step at which the FIRST of its tokens committed */
  first_step: number
  /** the lowest commit confidence among its tokens */
  conf: number
  /** the provisional text the model would have shown for this word, as
   *  [step, text, p] triples at every step where it changed, where p is the
   *  probability of the guess (its weakest uncommitted token's max-prob at that
   *  step). The last entry is the committed word. These are the model's real
   *  mind changes. Most of them are the corpus prior at p around 0.06, which
   *  decodes as "the"; see PROVISIONAL_FLOOR. */
  changes: [number, string, number][]
}

export type TraceToken = {
  pos: number
  text: string
  step: number
  /** softmax probability of the committed token at the moment it committed */
  conf: number
  /** how many times the provisional argmax changed before this position committed */
  flips: number
  /** end-of-sequence / padding positions after the content */
  tail: boolean
}

export type TraceStats = Record<string, number | boolean | null>

export type TraceCompact = {
  id: string
  prompt_id: string
  prompt: string
  model: string
  sampler: TraceSamplerConfig
  answer: string
  words: TraceWord[]
  tokens: TraceToken[]
  /** wall-clock milliseconds per denoising step on the capture machine */
  step_ms: number[]
  /** the step at which every end-of-sequence position had committed, i.e. the
   *  answer's length became fixed; null when the answer filled every position */
  tail_done_step: number | null
  stats: TraceStats
}

/** Replay pace when not playing at recorded speed. 40ms per step makes a
 *  128-step trajectory land in ~5 seconds, which is a chat-plausible wait. */
export const TRACE_DEFAULT_MS_PER_STEP = 40

/** How a replay paces its steps: a fixed number of milliseconds per step,
 *  the recorded wall clock, or 'shaped', which spends the time where the
 *  words are. Under the schedule-free sampler most steps commit only
 *  end-of-sequence positions (the answer's length settling, nothing to read
 *  yet), then the words land in the last stretch. Shaped pace plays a
 *  tail-only step at SHAPED_TAIL_STEP_MS and a step that commits a content
 *  token at SHAPED_CONTENT_STEP_MS, so the length settles quickly and every
 *  visible lock gets a full beat (Doherty on both ends: no wait past the
 *  threshold with nothing to see, no lock faster than the eye takes it in).
 *  The order is untouched; only the clock is reshaped, and the stage says so. */
export type TracePace = number | 'recorded' | 'shaped'
export const SHAPED_TAIL_STEP_MS = 14
export const SHAPED_CONTENT_STEP_MS = 120

/** The forming stage in the recorded mode: a word enters 'resolving' when its
 *  first token commits and 'resolved' this long after its last token does, so
 *  even a one-token word ghosts in for a beat before it snaps crisp. */
export const TRACE_FORMING_MS = 160
export const TRACE_TAIL_MS = 260

/** The text the interface should render for a trace: its whitespace words
 *  joined by single spaces, so tokenize() yields exactly one atom per word
 *  and atom.index lines up with word.index. */
export function traceAnswerText(trace: TraceCompact): string {
  return trace.words.map((w) => w.text).join(' ')
}

/** Recorded total, with the first step's one-time warmup clamped to the
 *  median so a replay at recorded speed does not open with a spurious pause. */
export function traceRealTotalMs(trace: TraceCompact): number {
  return traceStepEnds(trace).at(-1) ?? 0
}

/** Milliseconds each step takes under a pace. */
export function traceStepDurations(trace: TraceCompact, pace: TracePace): number[] {
  const n = trace.step_ms.length
  if (n === 0) return []
  if (typeof pace === 'number') return Array.from({ length: n }, () => pace)
  if (pace === 'recorded') {
    const sorted = [...trace.step_ms].sort((a, b) => a - b)
    const median = sorted[Math.floor(n / 2)] ?? 0
    return trace.step_ms.map((ms, i) => (i === 0 ? Math.min(ms, median) : ms))
  }
  const contentSteps = new Set(trace.tokens.filter((t) => !t.tail && t.step >= 0).map((t) => t.step))
  return trace.step_ms.map((_, i) => (contentSteps.has(i) ? SHAPED_CONTENT_STEP_MS : SHAPED_TAIL_STEP_MS))
}

/** Cumulative time at which each step has completed under a pace. */
export function traceStepEndsFor(trace: TraceCompact, pace: TracePace): number[] {
  const ends: number[] = []
  let acc = 0
  for (const ms of traceStepDurations(trace, pace)) {
    acc += ms
    ends.push(acc)
  }
  return ends
}

/** Cumulative step ends. Uniform when msPerStep is given; otherwise the
 *  recorded wall-clock pace (warmup clamped). */
export function traceStepEnds(trace: TraceCompact, msPerStep?: number): number[] {
  return traceStepEndsFor(trace, msPerStep ?? 'recorded')
}

/** The step a replay is on `elapsedMs` into a run with these step ends: the
 *  number of steps that have completed, clamped to the last step. Correct
 *  under any pace, where a share of the run would only be right for a
 *  uniform one. */
export function traceStepAtElapsed(ends: number[], elapsedMs: number): number {
  const n = ends.length
  if (n === 0) return 0
  let lo = 0
  let hi = n
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if ((ends[mid] ?? Infinity) <= elapsedMs) lo = mid + 1
    else hi = mid
  }
  return Math.min(n - 1, lo)
}

/** The replay's total duration under a pace: the last step end plus the
 *  forming beat and the closing tail. */
export function traceTotalMsFor(trace: TraceCompact, pace: TracePace): number {
  const ends = traceStepEndsFor(trace, pace)
  const last = ends.at(-1) ?? 0
  return last + TRACE_FORMING_MS + TRACE_TAIL_MS
}

export type TraceStrategyOptions = {
  /** replay pace; omit to play at the recorded wall-clock pace */
  msPerStep?: number
  /** a pace by name; takes precedence over msPerStep */
  pace?: TracePace
}

/**
 * Build a ModeStrategy from a recorded trajectory. A word enters `resolving`
 * when its first token commits and `resolved` when its last token commits.
 * That is literally the sampler's state rather than a metaphor for it. Atoms past the
 * end of the trace (which cannot happen when the text came from
 * traceAnswerText) are locked at the end so the contract still holds.
 */
export function traceStrategy(
  trace: TraceCompact,
  opts: TraceStrategyOptions = { msPerStep: TRACE_DEFAULT_MS_PER_STEP },
): ModeStrategy {
  const pace: TracePace = opts.pace ?? (opts.msPerStep != null ? opts.msPerStep : 'recorded')
  const ends = traceStepEndsFor(trace, pace)
  const last = ends.at(-1) ?? 0
  const at = (step: number) => ends[Math.max(0, Math.min(ends.length - 1, step))] ?? last

  function totalDuration(words: MeasuredAtom[]): number {
    if (words.length === 0) return 0
    return last + TRACE_FORMING_MS + TRACE_TAIL_MS
  }

  // 'resolving' is the forming stage (first token committed, the word ghosts
  // in); 'resolved' is the lock, a forming beat after the last token commits.
  function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
    if (words.length === 0) return []
    const events: ResolutionEvent[] = []
    for (const atom of words) {
      const w = trace.words[atom.index]
      const tFirst = w ? at(w.first_step) : last
      const tLock = w ? at(w.lock_step) : last
      events.push({ wordIndex: atom.index, state: 'resolving', t: Math.min(tFirst, tLock) })
      events.push({ wordIndex: atom.index, state: 'resolved', t: tLock + TRACE_FORMING_MS })
    }
    return events
  }

  return {
    name: 'trace',
    totalDuration,
    computeTimeline,
    // The lock signal lives on the word, as in mycelium: no overlay.
    renderOverlay: () => null,
    reducedMotionFallback: standardReducedFallback,
  }
}

/** Replay speed relative to the recorded pace, for an honest on-screen label. */
export function traceSpeedup(trace: TraceCompact, msPerStep: number): number {
  return traceSpeedupFor(trace, msPerStep)
}

/** The same, for any pace. */
export function traceSpeedupFor(trace: TraceCompact, pace: TracePace): number {
  const real = traceRealTotalMs(trace)
  const replay = traceStepEndsFor(trace, pace).at(-1) ?? 0
  return replay > 0 ? real / replay : 1
}

/**
 * Typed boundary for a trace loaded from JSON. A JSON module infers
 * `sampler.remasking` as `string`, which cannot assign to the union above, so
 * everything that imports a trajectory passes it through here. The checks are
 * the invariants the strategy actually depends on; anything else is trusted.
 */
export function asTrace(json: unknown): TraceCompact {
  const t = json as TraceCompact
  if (!t || !Array.isArray(t.words) || !Array.isArray(t.tokens) || !Array.isArray(t.step_ms)) {
    throw new Error('asTrace: not a compact trajectory')
  }
  if (t.sampler.remasking !== 'low_confidence' && t.sampler.remasking !== 'random') {
    throw new Error(`asTrace: unknown remasking "${String(t.sampler.remasking)}"`)
  }
  return t
}

/** The step a replay is on at progress p (0..1) over the strategy's timeline.
 *  The strategy adds a resolving beat and a tail after the last step, so the
 *  step clamps at the last one once the run is over. */
export function traceStepAt(trace: TraceCompact, p: number): number {
  const n = trace.step_ms.length
  return Math.max(0, Math.min(n - 1, Math.floor(p * (n + 1))))
}

/**
 * A prediction earns rendering only when it is a prediction. Before a masked
 * position is anywhere near commitment the model's argmax is the corpus prior
 * (median probability 0.065 across the recorded runs, decoding as "the"), and
 * an interface that showed it would show the same word in every slot. Above
 * this floor the guess is the model's real current belief and is shown; below
 * it the slot falls back to the authored noise. About one change in thirty
 * clears the floor under the default sampler, so a typical answer shows a
 * handful of real guesses and noise the rest of the time.
 */
export const PROVISIONAL_FLOOR = 0.25

/** How a belief that the answer ends here is drawn. Late in a run the model's
 *  best guess for a still-open position is often its end-of-text token: the
 *  answer's extent settling before its last words do (finding 03). That is a
 *  real belief worth showing, and its literal form ("<|endoftext|>",
 *  "<|im_end|>") is tokenizer plumbing, so it renders as the pilcrow, the
 *  typographic mark for where text stops. */
export const END_BELIEF_GLYPH = '¶'
// A guess can span tokens, so a word's guess may be several special tokens
// run together, or a word piece with an end token after it.
const SPECIAL_TOKEN = /<\|[^|]*\|>/g

/** What the interface should show for a word at a given step: the committed
 *  word once it is committed; before that, the latest recorded guess at or
 *  before that step if its probability clears PROVISIONAL_FLOOR; otherwise
 *  undefined, which tells the engine to show its authored noise instead. A
 *  guess that is a special token (an end-of-text belief) renders as
 *  END_BELIEF_GLYPH. */
export function traceProvisionalText(
  trace: TraceCompact,
  wordIndex: number,
  step: number,
  floor: number = PROVISIONAL_FLOOR,
): string | undefined {
  const w = trace.words[wordIndex]
  if (!w) return undefined
  if (step >= w.lock_step) return w.text
  let out: string | undefined
  for (const [s, text, p] of w.changes) {
    if (s > step) break
    out = p >= floor ? text : undefined
  }
  if (out !== undefined && out.includes('<|')) {
    const stripped = out.replace(SPECIAL_TOKEN, '').trim()
    return stripped.length > 0 ? stripped : END_BELIEF_GLYPH
  }
  return out
}

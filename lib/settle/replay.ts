import type { TraceCompact } from '@/lib/diffusion/traces'
import { createSettleState, reduceSettle } from './reader'
import type { Commit, Draft, Policy, Replay, SettleEvent, SettleState } from './types'

/** Recorded tokenizer end spellings, interpreted only on a committed token. */
const EOS = new Set(['<|endoftext|>', '<|im_end|>'])

/** How a replay paces the recorded steps: the raw forward-pass clock, a
 *  uniform synthetic clock in milliseconds per step, or the recorded clock
 *  divided by a factor (what a faster model changes, without inventing a clock). */
export type Pace = 'recorded' | number | { scale: number }

export function paceLabel(pace: Pace): string {
  if (pace === 'recorded') return 'recorded forward-pass clock'
  if (typeof pace === 'number') return `synthetic clock, ${pace} ms per step`
  return `${pace.scale}× recorded playback speed`
}

/**
 * Turns a completed capture into a causal event recording. It reads only the
 * token positions, texts and commit steps, the step clock, the request bound,
 * the drafts and the labels. It never reads the answer, the word table, the
 * tail flags or the tail statistic; a throwing-getter test proves it. A
 * step's drafts are the guesses the model held after that step's commitment,
 * so they follow it at the same instant. Raw step_ms measures forward passes
 * on the capture machine and is not end-to-end latency.
 */
export function replayTrace(trace: TraceCompact, pace: Pace): Replay {
  const scale = pace === 'recorded' ? 1 : typeof pace === 'number' ? 0 : pace.scale
  if (typeof pace === 'number' && (!Number.isFinite(pace) || pace <= 0)) throw new RangeError('A synthetic pace must be a positive number of milliseconds per step.')
  if (typeof pace === 'object' && (!Number.isFinite(scale) || scale <= 0)) throw new RangeError('A scaled pace must have a positive scale.')
  const stepEnds: number[] = []
  let durationMs = 0
  for (const recordedMs of trace.step_ms) {
    const ms = typeof pace === 'number' ? pace : recordedMs / scale
    if (!Number.isFinite(ms) || ms < 0) throw new RangeError('Recorded timing must be finite and nonnegative.')
    durationMs += ms
    stepEnds.push(durationMs)
  }
  const byStep = new Map<number, Commit[]>()
  for (const token of trace.tokens) {
    // a missing or invalid step supplies no token; finality then fails unless
    // an earlier contiguous end already closed the answer
    if (!Number.isSafeInteger(token.step) || token.step < 0 || token.step >= stepEnds.length) continue
    const commits = byStep.get(token.step) ?? []
    commits.push({ position: token.pos, text: token.text, ...(EOS.has(token.text) ? { end: true } : {}) })
    byStep.set(token.step, commits)
  }
  const drafts = trace.drafts ?? []
  const spins = trace.spins ?? []
  const guessesOf = (entries: unknown[] | undefined): Draft[] => {
    const guesses: Draft[] = []
    for (const entry of entries ?? []) {
      if (!Array.isArray(entry) || entry.length < 3) continue
      const [position, text, p] = entry as [unknown, unknown, unknown]
      if (!Number.isSafeInteger(position) || typeof text !== 'string' || typeof p !== 'number' || !Number.isFinite(p)) continue
      guesses.push({ position: position as number, text, p })
    }
    return guesses
  }
  const events: SettleEvent[] = []
  for (let step = 0; step < stepEnds.length; step += 1) {
    const tokens = byStep.get(step)
    if (tokens) events.push({ type: 'commit', atMs: stepEnds[step]!, tokens })
    // a step's guesses follow its commitment at the same instant: the
    // drafts above the floor, then the reel below it
    const drafted = guessesOf(drafts[step])
    if (drafted.length) events.push({ type: 'draft', atMs: stepEnds[step]!, guesses: drafted })
    const spun = guessesOf(spins[step])
    if (spun.length) events.push({ type: 'spin', atMs: stepEnds[step]!, guesses: spun })
  }
  events.push({ type: 'finish', atMs: durationMs, tokenCount: trace.sampler.max_new_tokens })
  return {
    id: trace.id,
    label: `${trace.prompt_id} · ${trace.sampler.id}`,
    provenance: `recorded ${trace.model} commitments · ${paceLabel(pace)}; not end-to-end latency`,
    events,
    durationMs,
    bound: trace.sampler.max_new_tokens,
  }
}

/** Pure seeking: no event after the elapsed time reaches the reducer. */
export function settleAt(replay: Replay, elapsedMs: number, policy: Policy = 'sentence'): SettleState {
  let state = createSettleState(policy, replay.bound ?? null)
  for (const event of replay.events) {
    if (event.atMs <= elapsedMs) state = reduceSettle(state, event)
  }
  return state
}

/** The state after every event: the reducer's final word on a recording. */
export function settleEnd(replay: Replay, policy: Policy = 'sentence'): SettleState {
  return settleAt(replay, Infinity, policy)
}

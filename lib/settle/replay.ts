import type { TraceCompact } from '@/lib/diffusion/traces'
import { createSettleState, reduceSettle } from './reader'
import type { Commit, Policy, Replay, SettleEvent, SettleState } from './types'

/** Recorded tokenizer end spellings, interpreted only on a committed token. */
const EOS = new Set(['<|endoftext|>', '<|im_end|>'])

/** How a replay paces the recorded steps: the raw forward-pass clock, a
 *  uniform synthetic clock in milliseconds per step, or the recorded clock
 *  divided by a factor (what a faster model changes, without inventing a clock). */
export type Pace = 'recorded' | number | { scale: number }

export function paceLabel(pace: Pace): string {
  if (pace === 'recorded') return 'recorded forward-pass clock'
  if (typeof pace === 'number') return `synthetic clock, ${pace} ms per step`
  return `recorded clock at 1/${pace.scale}`
}

/**
 * Turns a completed capture into a causal event recording. It reads only the
 * token positions, texts and commit steps, the step clock, the request bound
 * and the labels. It never reads the answer, the word table, the tail flags or
 * the tail statistic; a throwing-getter test proves it. Raw step_ms measures
 * forward passes on the capture machine and is not end-to-end latency.
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
  const events: SettleEvent[] = [...byStep].sort(([a], [b]) => a - b).map(([step, tokens]) => ({ type: 'commit', atMs: stepEnds[step]!, tokens }))
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

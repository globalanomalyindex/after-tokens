import type { TraceCompact } from '@/lib/diffusion/traces'
import { replayTrace, type Pace } from './replay'

export type ExperimentalTrace = TraceCompact & { step_wall_ms: number[] }

export const EXPERIMENTS = [
  { id: 'sleep', label: 'a numbered list', note: 'Three numbered items, including the incorrect phrase “Avoid enough caffeine.” Model output is retained unedited.', load: () => import('@/data/experiments/parallel-qwen-2026-09-09/compact/sleep-tips__lowconf-b128-s32.json') },
  { id: 'sky', label: 'an explanation', note: 'Repetition and grammatical errors are retained. This tests presentation, not answer quality.', load: () => import('@/data/experiments/parallel-qwen-2026-09-09/compact/sky-blue__lowconf-b128-s32.json') },
  { id: 'weather', label: 'a short refusal', note: 'A short refusal from the model. The loading composition does not predict that the result will be short.', load: () => import('@/data/experiments/parallel-qwen-2026-09-09/compact/weather__lowconf-b128-s32.json') },
  { id: 'random', label: 'a failed answer', note: 'Random remasking produces mostly repeated numerals. Wider commitment spread does not guarantee useful text.', load: () => import('@/data/experiments/parallel-qwen-random-2026-09-09/compact/sleep-tips__random-b128-s32.json') },
] as const

/** Override only the clock, without reading retrospective answer, word,
 * tail or statistics properties merely to supply observed source timing. */
export function replayExperiment(trace: ExperimentalTrace, pace: Pace = 'recorded') {
  const input = Object.create(trace) as TraceCompact
  Object.defineProperty(input, 'step_ms', { value: trace.step_wall_ms })
  const replay = replayTrace(input, pace)
  return { ...replay, provenance: 'observed capture-loop replay · 32 evaluations, four committed positions per evaluation; not API latency' }
}

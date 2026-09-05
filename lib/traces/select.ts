import { TRACE_META, type TraceId, type TraceLoop } from './index'

/** Sampler configurations in the order a product demo prefers them: the
 *  model card default first, then the random-order run of the same prompt. */
export const CODA_CONFIG_ORDER = ['lowconf-b32', 'random-b32'] as const

/** The repetition loop a trajectory fell into, when it did. */
export function traceLoop(id: TraceId): TraceLoop | undefined {
  return TRACE_META[id]?.loop
}

/** The recorded trajectory a product demo replays for a prompt. The default
 *  sampler's run, unless that run looped, in which case the random-order run
 *  of the same prompt stands in. The looped run is still shown, marked, in
 *  the research section, and it stays in every statistic. */
export function codaTraceIdFor(promptId: string): TraceId {
  for (const config of CODA_CONFIG_ORDER) {
    const id = `${promptId}__${config}` as TraceId
    if (id in TRACE_META && !TRACE_META[id].loop) return id
  }
  return `${promptId}__lowconf-b32` as TraceId
}

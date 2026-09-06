import { TRACE_META, type TraceAudit, type TraceId, type TraceLoop } from './index'

/** The repetition loop a trajectory fell into, when it did. */
export function traceLoop(id: TraceId): TraceLoop | undefined {
  return TRACE_META[id]?.loop
}

/** The audit verdict for a recorded answer (AUDIT_RULE in scripts/gen-trace-index.mjs). */
export function traceAudit(id: TraceId): TraceAudit {
  return TRACE_META[id].audit
}

/** The recorded run a product demo replays for a prompt: the model card
 *  default (low-confidence remasking, four blocks), always. The product demos
 *  replay a run's order, timing, and confidence over pre-written words, so
 *  the text of the run never reaches them and a looped or rough answer is no
 *  reason to switch runs. The model's own words stay in the research section,
 *  with every run's audit verdict beside them. */
export function codaTraceIdFor(promptId: string): TraceId {
  return `${promptId}__lowconf-b32` as TraceId
}

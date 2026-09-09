import { mkdirSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { traceProvisionalText, type TraceCompact } from '@/lib/diffusion/traces'
import { measureReplay, type PolicyCost } from '@/lib/settle/cost'
import { replayTrace } from '@/lib/settle/replay'
import type { Policy } from '@/lib/settle/types'
import { TRACE_IDS, TRACE_META, loadTrace } from '@/lib/traces/index'

// The cost of each policy on every recording, and the causal audit of the
// retrospective reveal, computed here so the case study's numbers are
// reproducible. With SETTLE_REPORT=1 (pnpm traces:settle) the summaries are
// written to lib/traces/settle.json, which lib/traces/findings.ts reads;
// otherwise the run asserts the invariants the contract promises.

// This historical report remains the original three-policy comparison.
type HistoricalPolicy = Exclude<Policy, 'answer'>
const POLICIES: HistoricalPolicy[] = ['word', 'sentence', 'paragraph']

function median(xs: number[]): number | null {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const r2 = (x: number | null) => (x === null ? null : Number(x.toFixed(2)))
const r3 = (x: number | null) => (x === null ? null : Number(x.toFixed(3)))

type Row = { id: string; curated: boolean; characters: number } & Record<HistoricalPolicy, { uniform: PolicyCost; recorded: PolicyCost }>

function summarize(rows: Row[], policy: HistoricalPolicy, clock: 'uniform' | 'recorded') {
  const costs = rows.map((r) => r[policy][clock])
  const nonempty = costs.filter((c) => c.characters > 0)
  return {
    traces: rows.length,
    nonemptyTraces: nonempty.length,
    exactFinalOutputs: costs.filter((c) => c.exactFinal).length,
    precommitExposure: costs.reduce((a, c) => a + c.precommitExposure, 0),
    characters: costs.reduce((a, c) => a + c.characters, 0),
    medianFirstPassageAt: r2(median(nonempty.map((c) => c.firstPassageAt!).filter((x) => x !== null))),
    medianCompletionAt: r2(median(nonempty.map((c) => c.completionAt!).filter((x) => x !== null))),
    meanExtraHold: r2(mean(nonempty.map((c) => c.meanExtraHold!).filter((x) => x !== null))),
    medianExtraHold: r2(median(nonempty.map((c) => c.meanExtraHold!).filter((x) => x !== null))),
    meanWordSafeLag: r2(mean(nonempty.map((c) => c.meanWordSafeLag!).filter((x) => x !== null))),
    medianMaxQueued: r2(median(nonempty.map((c) => c.maxQueued))),
    maxQueued: Math.max(0, ...costs.map((c) => c.maxQueued)),
    medianPassages: r2(median(nonempty.map((c) => c.passages))),
    medianPassageChars: r2(median(nonempty.map((c) => c.medianPassageChars!).filter((x) => x !== null))),
    medianFormingShare: r3(median(nonempty.map((c) => c.formingShare!).filter((x) => x !== null))),
  }
}

/** The causal audit of the old reveal, on the word table it used. */
function auditTrace(trace: TraceCompact) {
  const words = trace.words.length
  const multi = trace.words.filter((w) => w.first_step !== w.lock_step)
  const matched = multi.filter((w) => traceProvisionalText(trace, w.index, w.first_step, 0) === w.text).length
  // the causal length: the step by which every position up to and including
  // the first end token has committed
  const byPos = new Map(trace.tokens.map((t) => [t.pos, t]))
  let firstEnd = -1
  for (let p = 0; p < trace.sampler.max_new_tokens; p += 1) {
    const t = byPos.get(p)
    if (t && (t.text === '<|im_end|>' || t.text === '<|endoftext|>')) { firstEnd = p; break }
  }
  let causalLengthStep: number | null = null
  if (firstEnd >= 0) {
    causalLengthStep = 0
    for (let p = 0; p <= firstEnd; p += 1) causalLengthStep = Math.max(causalLengthStep, byPos.get(p)?.step ?? Infinity)
    if (!Number.isFinite(causalLengthStep)) causalLengthStep = null
  }
  const tailStatEarly = trace.tail_done_step !== null && causalLengthStep !== null && trace.tail_done_step < causalLengthStep
  return { words, multiStepWords: multi.length, matchedAtFirst: matched, tailStatEarly, tailDoneStep: trace.tail_done_step, causalLengthStep }
}

describe('the cost of settling, over every recording', () => {
  it('draws nothing early, reproduces every output, and reports the wait', async () => {
    const rows: Row[] = []
    const audits: (ReturnType<typeof auditTrace> & { id: string; curated: boolean })[] = []
    for (const id of TRACE_IDS) {
      const trace = await loadTrace(id)
      const curated = TRACE_META[id].curated === true
      const uniform = replayTrace(trace, 1)
      const recorded = replayTrace(trace, 'recorded')
      const row = { id, curated, characters: trace.answer.length } as Row
      for (const policy of POLICIES) {
        row[policy] = { uniform: measureReplay(uniform, policy, trace.answer), recorded: measureReplay(recorded, policy, trace.answer) }
        expect(row[policy].uniform.exactFinal, `${id} ${policy}`).toBe(true)
        expect(row[policy].uniform.precommitExposure, `${id} ${policy}`).toBe(0)
        expect(row[policy].recorded.precommitExposure, `${id} ${policy}`).toBe(0)
      }
      rows.push(row)
      audits.push({ id, curated, ...auditTrace(trace) })
    }
    const curated = rows.filter((r) => r.curated)
    const summary = {
      note: 'generated by tests/settle/report.test.ts (pnpm traces:settle); a step is one completed forward pass; recorded is the raw forward-pass clock in ms; characters are UTF-16 code units including whitespace; these are properties of the reducer on this corpus, never reader outcomes',
      all60: Object.fromEntries(POLICIES.map((p) => [p, { uniform: summarize(rows, p, 'uniform'), recorded: summarize(rows, p, 'recorded') }])),
      curated18: Object.fromEntries(POLICIES.map((p) => [p, { uniform: summarize(curated, p, 'uniform'), recorded: summarize(curated, p, 'recorded') }])),
      audit: {
        all60: {
          words: audits.reduce((a, x) => a + x.words, 0),
          multiStepWords: audits.reduce((a, x) => a + x.multiStepWords, 0),
          matchedAtFirst: audits.reduce((a, x) => a + x.matchedAtFirst, 0),
          tailStatEarly: audits.filter((x) => x.tailStatEarly).length,
          traces: audits.length,
        },
        curated18: {
          words: audits.filter((x) => x.curated).reduce((a, x) => a + x.words, 0),
          multiStepWords: audits.filter((x) => x.curated).reduce((a, x) => a + x.multiStepWords, 0),
          matchedAtFirst: audits.filter((x) => x.curated).reduce((a, x) => a + x.matchedAtFirst, 0),
          tailStatEarly: audits.filter((x) => x.curated && x.tailStatEarly).length,
          traces: audits.filter((x) => x.curated).length,
        },
      },
      rows: rows.map((r) => ({
        id: r.id, curated: r.curated, characters: r.characters,
        ...Object.fromEntries(POLICIES.map((p) => [p, r[p]])),
      })),
    }
    // the audit numbers the copy cites, verified here against the data
    expect(summary.audit.all60.words).toBe(3880)
    expect(summary.audit.all60.multiStepWords).toBe(700)
    expect(summary.audit.curated18.words).toBe(1205)
    expect(summary.audit.curated18.multiStepWords).toBe(188)
    expect(summary.all60.sentence!.uniform.exactFinalOutputs).toBe(60)
    expect(summary.all60.word!.uniform.precommitExposure).toBe(0)
    if (process.env.SETTLE_REPORT) {
      mkdirSync('lib/traces', { recursive: true })
      writeFileSync('lib/traces/settle.json', JSON.stringify(summary, null, 2) + '\n')
    }
  }, 120_000)
})

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import historical from '@/lib/traces/settle.json'
import { passageBoundary } from '@/lib/settle/boundary'
import { measureReplay, type PolicyCost } from '@/lib/settle/cost'
import { createSettleState, formingText, heldText, pageText, reduceSettle } from '@/lib/settle/reader'
import { replayTrace } from '@/lib/settle/replay'
import type { Policy, SettleEvent } from '@/lib/settle/types'
import { TRACE_IDS, TRACE_META, loadTrace } from '@/lib/traces/index'

const policies: Policy[] = ['word', 'sentence', 'paragraph', 'answer']
type CostRow = {
  id: string
  curated: boolean
  characters: number
  sourceFile: string
  sourceSha256: string
  recordedReplayDurationMs: number
  costs: Record<Policy, PolicyCost>
  answerMinusSentence: { firstPassageMs: number | null; meanExtraHoldMs: number | null }
}
const run = (events: SettleEvent[], bound: number | null = null) => events.reduce(reduceSettle, createSettleState('answer', bound))
const median = (values: number[]) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}
const numbers = (values: (number | null)[]) => values.filter((value): value is number => value !== null)
const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
const round = (value: number | null) => value === null ? null : Number(value.toFixed(4))
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

describe('whole-answer release policy', () => {
  it('holds through sentence punctuation, lists, paragraphs and word boundaries', () => {
    const text = 'Ready. \n1. Review\n2. Save\n\nStill forming '
    const state = run([{ type: 'commit', atMs: 100, tokens: [{ position: 0, text }] }])
    expect(state.prefix).toBe(text)
    expect(state.wordSafeLength).toBe(text.length)
    expect(state.status).toBe('receiving')
    expect(state.passages).toEqual([])
    expect(state.releasedLength).toBe(0)
    expect(pageText(state)).toBe('')
    expect(formingText(state)).toBe('')
    expect(heldText(state)).toBe(text)
    expect(passageBoundary(text, 'answer')).toBe(0)
  })

  it('requires the prefix to reach a committed end, not a guessed or disjoint end', () => {
    let state = run([
      { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'Ready. ' }] },
      { type: 'draft', atMs: 200, guesses: [{ position: 1, text: '<|endoftext|>', p: 1 }] },
      { type: 'spin', atMs: 250, guesses: [{ position: 1, text: '<|im_end|>', p: 1 }] },
      { type: 'commit', atMs: 300, tokens: [{ position: 2, text: '<|im_end|>', end: true }] },
    ], 3)
    expect(state.status).toBe('receiving')
    expect(state.passages).toEqual([])
    state = reduceSettle(state, { type: 'commit', atMs: 400, tokens: [{ position: 1, text: 'After review.' }] })
    expect(state.status).toBe('complete')
    expect(state.passages).toEqual([{ id: 'v0-p0', text: 'Ready. After review.', availableAtMs: 400 }])
    expect(heldText(state)).toBe('')
  })

  it.each(['stop', 'error'] as const)('does not manufacture an answer after a source %s', (type) => {
    const terminal: SettleEvent = type === 'stop' ? { type, atMs: 200 } : { type, atMs: 200, message: 'transport failed' }
    const state = run([
      { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'An available sentence. ' }] },
      terminal,
      { type: 'finish', atMs: 300, tokenCount: 1 },
    ])
    expect(state.status).toBe(type === 'stop' ? 'stopped' : 'error')
    expect(state.releasedLength).toBe(0)
    expect(state.passages).toEqual([])
    expect(heldText(state)).toBe('An available sentence. ')
  })

  it('releases a valid finish immediately as one exact answer, including incomplete final words', () => {
    const text = '  One.\r\n\r\nTwo.\t🙂 incomple'
    const state = run([
      { type: 'commit', atMs: 100, tokens: [{ position: 0, text }] },
      { type: 'finish', atMs: 200, tokenCount: 1 },
    ])
    expect(state.status).toBe('complete')
    expect(state.passages).toEqual([{ id: 'v0-p0', text, availableAtMs: 200 }])
    expect(pageText(state)).toBe(text)
  })

  it('rejects a contradictory finish without releasing its available prefix', () => {
    const state = run([
      { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'First. ' }, { position: 2, text: 'Third. ' }] },
      { type: 'finish', atMs: 200, tokenCount: 3 },
    ])
    expect(state.status).toBe('error')
    expect(state.passages).toEqual([])
    expect(pageText(state)).toBe('')
  })

  it('holds snapshots and releases only the explicitly final snapshot as one passage', () => {
    const initial = run([{ type: 'snapshot', atMs: 100, text: 'Old guess.\n\nAnother guess.', final: false }])
    expect(initial.passages).toEqual([])
    const text = 'One.\n\nTwo. Three.'
    const complete = reduceSettle(initial, { type: 'snapshot', atMs: 200, text, final: true })
    expect(complete.passages).toEqual([{ id: 'v0-p0', text, availableAtMs: 200 }])
  })

  it('keeps an applied revision whole and an empty completed source empty', () => {
    const initial = run([{ type: 'snapshot', atMs: 100, text: 'Original.', final: true }])
    const proposed = reduceSettle(initial, { type: 'revision', atMs: 200, text: 'Revised.\n\nSecond paragraph.' })
    expect(pageText(proposed)).toBe('Original.')
    const applied = reduceSettle(proposed, { type: 'apply-revision', atMs: 300 })
    expect(applied.passages).toEqual([{ id: 'v1-p0', text: 'Revised.\n\nSecond paragraph.', availableAtMs: 300 }])
    expect(applied.previousPassages).toEqual(initial.passages)
    const empty = run([{ type: 'finish', atMs: 100, tokenCount: 0 }])
    expect(empty.status).toBe('complete')
    expect(empty.passages).toEqual([])
  })

  it('preserves all 60 outputs, exposes no passage early, and measures the separate cost', async () => {
    const rows: CostRow[] = []
    expect(TRACE_IDS).toHaveLength(60)
    for (const id of TRACE_IDS) {
      const trace = await loadTrace(id)
      const replay = replayTrace(trace, 'recorded')
      let state = createSettleState('answer', replay.bound ?? null)
      for (const event of replay.events) {
        state = reduceSettle(state, event)
        if (state.status !== 'complete') {
          expect(state.releasedLength, `${id} at ${event.atMs}`).toBe(0)
          expect(state.passages, `${id} at ${event.atMs}`).toEqual([])
        }
      }
      expect(state.status, id).toBe('complete')
      expect(pageText(state), id).toBe(trace.answer)
      expect(state.passages, id).toHaveLength(trace.answer.length ? 1 : 0)
      const costs = Object.fromEntries(policies.map((policy) => [policy, measureReplay(replay, policy, trace.answer)])) as Record<Policy, PolicyCost>
      for (const policy of policies) {
        expect(costs[policy].exactFinal, `${id} ${policy}`).toBe(true)
        expect(costs[policy].precommitExposure, `${id} ${policy}`).toBe(0)
      }
      // Existing policy behavior is checked against the frozen old report;
      // this test never rewrites that report to make a changed result pass.
      const baseline = historical.rows.find((row) => row.id === id)!
      for (const policy of ['word', 'sentence', 'paragraph'] as const) expect(costs[policy], `${id} ${policy}`).toEqual(baseline[policy].recorded)
      expect(costs.answer.formingShare, id).toBe(0)
      if (trace.answer.length) expect(costs.answer.firstPassageAt, id).toBe(costs.answer.completionAt)
      const sourceFile = `data/traces/compact/${id}.json`
      rows.push({
        id, curated: TRACE_META[id].curated, characters: trace.answer.length,
        sourceFile, sourceSha256: sha256(sourceFile), recordedReplayDurationMs: replay.durationMs,
        costs,
        answerMinusSentence: {
          firstPassageMs: costs.answer.firstPassageAt === null || costs.sentence.firstPassageAt === null ? null : costs.answer.firstPassageAt - costs.sentence.firstPassageAt,
          meanExtraHoldMs: costs.answer.meanExtraHold === null || costs.sentence.meanExtraHold === null ? null : costs.answer.meanExtraHold - costs.sentence.meanExtraHold,
        },
      })
    }
    const summarize = (selected: typeof rows, policy: Policy) => {
      const costs = selected.map((row) => row.costs[policy])
      const nonempty = costs.filter((cost) => cost.characters > 0)
      const totalChars = nonempty.reduce((sum, cost) => sum + cost.characters, 0)
      return {
        traces: selected.length, nonemptyTraces: nonempty.length,
        exactFinalOutputs: costs.filter((cost) => cost.exactFinal).length,
        precommitExposure: costs.reduce((sum, cost) => sum + cost.precommitExposure, 0),
        characters: totalChars,
        medianFirstPassageAtMs: round(median(numbers(nonempty.map((cost) => cost.firstPassageAt)))),
        medianCompletionAtMs: round(median(numbers(nonempty.map((cost) => cost.completionAt)))),
        meanOfTraceMeanExtraHoldMs: round(mean(numbers(nonempty.map((cost) => cost.meanExtraHold)))),
        characterWeightedMeanExtraHoldMs: totalChars ? round(nonempty.reduce((sum, cost) => sum + (cost.meanExtraHold ?? 0) * cost.characters, 0) / totalChars) : null,
        medianPassages: median(nonempty.map((cost) => cost.passages)),
        medianMaxQueuedCharacters: median(nonempty.map((cost) => cost.maxQueued)),
        maximumQueuedCharacters: Math.max(0, ...costs.map((cost) => cost.maxQueued)),
        medianFormingShare: round(median(numbers(nonempty.map((cost) => cost.formingShare)))),
      }
    }
    const report = {
      generatedAtUtc: new Date().toISOString(),
      generator: 'ANSWER_POLICY_REPORT=1 pnpm exec vitest run tests/settle/answer-policy.test.ts',
      status: 'reducer-cost comparison; no motion-performance or reader-outcome measurements',
      definitions: {
        corpus: 'The original TRACE_IDS 60 captures only; excludes the newer parallel-model experiments. Three empty answers are retained for exact-output audits and excluded from latency summaries.',
        clock: 'Raw cumulative recorded step_ms: synchronized forward-pass timings on the capture machine, in milliseconds. Playback scale is 1. This is not request-to-answer latency, network latency, or a current model speed estimate.',
        finality: 'First committed EOS reached by the contiguous prefix, valid explicit finish, or explicitly final snapshot. Source stop/error and guessed EOS do not release an answer.',
        answerPolicy: 'Releases no passages or forming text before finality. At finality, the exact nonempty answer becomes one passage immediately. This deliberately sacrifices early reading; it does not accelerate inference.',
        firstPassageAt: 'Reducer eligibility time of the first released passage, not measured browser paint or legibility time. For answer policy it equals source finality on every nonempty completed capture.',
        completionAt: 'First terminal source state time retained by the reducer; may precede the end of the stored recording when the contiguous prefix reaches EOS early.',
        meanExtraHold: 'Per trace, character-mean passage release time minus time that UTF-16 code unit joined the contiguous committed prefix. It is not measured relative to an out-of-order token commitment.',
        meanOfTraceMeanExtraHoldMs: 'Arithmetic mean of each nonempty trace meanExtraHold; traces receive equal weight.',
        characterWeightedMeanExtraHoldMs: 'Total hold over UTF-16 code units divided by total code units across nonempty traces.',
        meanWordSafeLag: 'Per trace, character-mean word-safe time minus contiguous-prefix join time; underlying word-safety accounting is unchanged by answer policy.',
        formingShare: 'Share of stored replay duration for which formingText(state) is nonempty. Answer policy returns no forming text; this is a logical presentation contract, not an observed viewport exposure metric.',
        maxQueued: 'Largest prefix.length minus releasedLength at an event boundary, measured in UTF-16 code units including whitespace.',
        exactFinalAndPrecommitExposure: 'Final decoded text is used only by the retrospective instrument as an equality oracle; the reducer and release decision never receive it.',
      },
      implementation: ['lib/settle/types.ts', 'lib/settle/boundary.ts', 'lib/settle/reader.ts', 'lib/settle/cost.ts', 'lib/settle/replay.ts'].map((path) => ({ path, sha256: sha256(path) })),
      all60: Object.fromEntries(policies.map((policy) => [policy, summarize(rows, policy)])),
      curated18: Object.fromEntries(policies.map((policy) => [policy, summarize(rows.filter((row) => row.curated), policy)])),
      pairedAnswerMinusSentence: {
        nonemptyPairs: rows.filter((row) => row.answerMinusSentence.firstPassageMs !== null).length,
        medianFirstPassageDelayMs: round(median(numbers(rows.map((row) => row.answerMinusSentence.firstPassageMs)))),
        meanAdditionalTraceMeanHoldMs: round(mean(numbers(rows.map((row) => row.answerMinusSentence.meanExtraHoldMs)))),
      },
      rows,
    }
    if (process.env.ANSWER_POLICY_REPORT === '1') {
      mkdirSync('data/experiments', { recursive: true })
      writeFileSync('data/experiments/answer-policy-cost-2026-09-09.json', JSON.stringify(report, null, 2) + '\n')
    }
  }, 120_000)
})

/** Audit the real experimental captures through the current causal reducer.
 * Run with the project's Node runtime; no browser, inference, or final bounds.
 */
import assert from 'node:assert/strict'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(root, 'package.json'))
const viteRequire = createRequire(require.resolve('vitest/package.json'))
const { createServer } = await import(viteRequire.resolve('vite'))
const server = await createServer({ configFile: false, root, resolve: { alias: { '@': root } }, server: { middlewareMode: true } })
const { replayTrace } = await server.ssrLoadModule('/lib/settle/replay.ts')
const { createSettleState, reduceSettle } = await server.ssrLoadModule('/lib/settle/reader.ts')
const { carve } = await server.ssrLoadModule('/lib/settle/carve.ts')
const histogram = (values) => Object.fromEntries([...new Set(values)].sort((a, b) => a - b).map((value) => [value, values.filter((candidate) => candidate === value).length]))
const rows = []
try {
  const originalRows = []
  for (const file of (await readdir(path.join(root, 'data/traces/compact'))).filter((name) => name.endsWith('.json')).sort()) {
    const trace = JSON.parse(await readFile(path.join(root, 'data/traces/compact', file), 'utf8'))
    const batches = Array.from({ length: trace.step_ms.length }, (_, step) => trace.tokens.filter((token) => token.step === step).length)
    originalRows.push({ id: trace.id, steps: batches.length, committedPositions: trace.tokens.length, maxCommitmentsPerStep: Math.max(...batches), multiTokenSteps: batches.filter((count) => count > 1).length })
  }
  for (const directory of ['parallel-qwen-2026-09-09', 'parallel-qwen-random-2026-09-09']) {
    const files = (await readdir(path.join(root, 'data/experiments', directory, 'compact'))).filter((name) => name.endsWith('.json')).sort()
    for (const file of files) {
      const trace = JSON.parse(await readFile(path.join(root, 'data/experiments', directory, 'compact', file), 'utf8'))
      // Explicit experimental observed clock: the standard adapter receives
      // these source intervals in its ordinary step_ms field.
      const causal = { ...trace, step_ms: trace.step_wall_ms }
      for (const field of ['answer', 'words', 'stats', 'tail_done_step']) Object.defineProperty(causal, field, { get() { throw Error(`Forbidden retrospective read: ${field}`) } })
      causal.tokens = trace.tokens.map((token) => {
        const copy = { ...token }
        Object.defineProperty(copy, 'tail', { get() { throw Error('Forbidden retrospective tail read') } })
        return copy
      })
      const replay = replayTrace(causal, 'recorded')
      const byTime = new Map()
      for (const event of replay.events) {
        const group = byTime.get(event.atMs) ?? []
        group.push(event)
        byTime.set(event.atMs, group)
      }
      let state = createSettleState('sentence', replay.bound)
      const eligible = new Set()
      const samples = []
      for (const [atMs, events] of byTime) {
        const previousPassages = state.passages.length
        for (const event of events) state = reduceSettle(state, event)
        const chunks = carve({ ...state, releasedLength: 0 }).filter((item) => item.kind === 'word' && /\S/.test(item.text))
        const newChunks = []
        for (const chunk of chunks) {
          const key = `${chunk.position}:${chunk.span}:${chunk.text}`
          if (eligible.has(key)) continue
          eligible.add(key)
          newChunks.push({ position: chunk.position, span: chunk.span, text: chunk.text, whitespaceRuns: (chunk.text.match(/\S+/g) ?? []).length })
        }
        const newPositions = newChunks.map((chunk) => chunk.position)
        samples.push({
          atMs: Math.round(atMs * 1000) / 1000,
          committedPositions: events.flatMap((event) => event.type === 'commit' ? event.tokens.map((token) => token.position) : []),
          newCompleteChunks: newChunks,
          newCompleteWhitespaceRuns: newChunks.reduce((sum, chunk) => sum + chunk.whitespaceRuns, 0),
          requestQuartilesWithNewCompleteChunks: new Set(newPositions.map((position) => Math.floor(position / 32))).size,
          newCompleteChunkStartSpan: newPositions.length > 1 ? Math.max(...newPositions) - Math.min(...newPositions) : 0,
          newlyReleasedPassages: state.passages.length - previousPassages,
          prefixLength: state.prefix.length,
          releasedLength: state.releasedLength,
          status: state.status,
        })
      }
      assert.equal(state.status, 'complete')
      assert.equal(state.prefix, trace.answer)
      rows.push({
        id: trace.id,
        exactCausalReplayFinalText: true,
        retrospectiveReadsThrow: true,
        durationMs: replay.durationMs,
        firstCompleteChunkAtMs: samples.find((sample) => sample.newCompleteChunks.length)?.atMs ?? null,
        firstReleasedPassageAtMs: samples.find((sample) => sample.newlyReleasedPassages)?.atMs ?? null,
        firstCompleteAtMs: samples.find((sample) => sample.status === 'complete')?.atMs ?? null,
        completeChunkBatchHistogram: histogram(samples.map((sample) => sample.newCompleteChunks.length)),
        whitespaceRunBatchHistogram: histogram(samples.map((sample) => sample.newCompleteWhitespaceRuns)),
        maxNewCompleteChunkStartSpan: Math.max(...samples.map((sample) => sample.newCompleteChunkStartSpan)),
        maxRequestQuartilesWithNewCompleteChunks: Math.max(...samples.map((sample) => sample.requestQuartilesWithNewCompleteChunks)),
        samples,
      })
    }
  }
  const report = {
    originalCorpus: {
      traceCount: originalRows.length,
      steps: originalRows.reduce((total, row) => total + row.steps, 0),
      committedPositions: originalRows.reduce((total, row) => total + row.committedPositions, 0),
      maxCommitmentsPerStep: Math.max(...originalRows.map((row) => row.maxCommitmentsPerStep)),
      multiTokenSteps: originalRows.reduce((total, row) => total + row.multiTokenSteps, 0),
      traces: originalRows,
    },
    definitions: {
      policy: 'Sentence policy; these measure its causal readability/release opportunities, not the display timing of a whole-answer renderer that deliberately holds them.',
      clock: 'Observed capture-loop intervals (step_wall_ms), explicitly supplied to replayTrace. Includes forward, selection and online draft capture; excludes model loading and file serialization. Not end-to-end network latency.',
      chunk: 'Current carve word item with both boundaries causally established. A chunk can contain multiple whitespace runs; neither is a validated semantic unit. A missing boundary can unlock already committed pieces.',
      spread: 'Integer source token positions, not measured screen geometry. Quartiles are of the known 128-position request bound, never inferred final answer length.',
      finalText: 'The adapter and reducer run while getters on answer/words/tail/stats throw. Their terminal prefix is compared to the stored answer only after replay finishes.',
    },
    traces: rows,
  }
  await writeFile(path.join(root, 'data/experiments/parallel-replay-audit-2026-09-09.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(rows.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'samples'))), null, 2))
} finally {
  await server.close()
}

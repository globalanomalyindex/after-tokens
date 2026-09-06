import { mkdirSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { arrivalProfile, locksFromEvents, profileSummary, type ProfileSummary } from '@/lib/arrival/profile'
import { fade, scatter, syntheticAtoms, typewriter } from '@/lib/arrival/references'
import { readingOrderLag, readingOrderLocks, withReadingOrder } from '@/lib/arrival/reading-order'
import { segmentPhrases } from '@/lib/arrival/phrases'
import { crystal, crystalWith } from '@/lib/diffusion/modes/crystal'
import { mycelium } from '@/lib/diffusion/modes/mycelium'
import { fog } from '@/lib/diffusion/modes/fog'
import { aurora } from '@/lib/diffusion/modes/aurora'
import { mitosis } from '@/lib/diffusion/modes/mitosis'
import { traceAnswerText, traceStrategy } from '@/lib/diffusion/traces'
import { TRACE_IDS, TRACE_META, loadTrace } from '@/lib/traces/index'
import { codaPrompts } from '@/lib/coda/fixtures'
import type { ModeStrategy } from '@/lib/diffusion/types'

// The arrival profile, computed for every arrival over the same stimuli, so
// the case study's numbers describe a fair comparison: same words, same
// clock. With ARRIVAL_REPORT=1 (pnpm traces:arrival) the medians are written
// to lib/traces/arrival.json, which lib/traces/findings.ts reads; otherwise
// the run only asserts the invariants the grammar promises.

const ARRIVALS: Record<string, ModeStrategy> = {
  typewriter,
  fade,
  scatter,
  fog,
  aurora,
  mitosis,
  mycelium,
  crystal,
  'crystal-unbounded': crystalWith({ budget: 'unbounded' }),
  'crystal-1': crystalWith({ budget: 1 }),
  'crystal-3': crystalWith({ budget: 3 }),
  'crystal-strict': crystalWith({ anchorFirst: false }),
}

type Summary = ProfileSummary
const KEYS = [
  'tensionMax',
  'tensionMean',
  'alignment',
  'steps',
  'largestShare',
  'peakAt',
  'gistAt',
  'endWeight',
  'inversions',
  'previewCost',
  'tau',
  'totalMs',
] as const

function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

function medians(rows: Summary[]): Record<(typeof KEYS)[number], number> & { n: number } {
  const out = { n: rows.length } as Record<(typeof KEYS)[number], number> & { n: number }
  for (const k of KEYS) out[k] = Number(median(rows.map((r) => r[k])).toFixed(k === 'inversions' || k === 'previewCost' ? 3 : 2))
  return out
}

function scoreText(strategy: ModeStrategy, text: string, topic?: string): Summary {
  const atoms = syntheticAtoms(text, topic)
  const events = strategy.computeTimeline(atoms)
  const locks = locksFromEvents(events, atoms.length)
  return profileSummary(arrivalProfile({ atoms, locks, total: strategy.totalDuration(atoms) }))
}

describe('the arrival profile over the fixtures', () => {
  const rows: Record<string, Summary[]> = {}
  for (const [name, strategy] of Object.entries(ARRIVALS)) {
    rows[name] = codaPrompts.map((p) => scoreText(strategy, p.response, p.prompt))
  }
  const med: Record<string, ReturnType<typeof medians>> = {}
  for (const [name, list] of Object.entries(rows)) med[name] = medians(list)

  it('crystal keeps the tension budget, reads in order inside phrases, and stays out of order at the phrase scale', () => {
    for (const r of rows.crystal!) expect(r.tensionMax).toBeLessThanOrEqual(2)
    for (const r of rows['crystal-strict']!) expect(r.inversions).toBe(0)
    // a reader waits less often under crystal than under a scatter, and never inside a phrase the typewriter reads at its pace
    expect(med.crystal!.previewCost).toBeLessThan(med.scatter!.previewCost)
    expect(med.crystal!.previewCost).toBeLessThanOrEqual(0.1)
    expect(med.crystal!.tau).toBeLessThan(0.9)
  })

  it('the typewriter holds one loop and reads in order; the fade holds none and lands everything at the end', () => {
    for (const r of rows.typewriter!) {
      expect(r.tensionMax).toBe(1)
      expect(r.inversions).toBe(0)
      expect(r.tau).toBe(1)
    }
    for (const r of rows.fade!) {
      expect(r.tensionMax).toBe(0)
      expect(r.gistAt).toBeGreaterThan(0.85)
    }
  })

  it('the earlier modes exceed the budget or scatter inside phrases', () => {
    expect(med['crystal-unbounded']!.tensionMax).toBeGreaterThan(2)
    expect(med.mycelium!.tensionMax).toBeGreaterThan(2)
    expect(med.scatter!.inversions).toBeGreaterThan(0.3)
    expect(Math.max(med.fog!.tensionMax, med.aurora!.tensionMax, med.mitosis!.tensionMax)).toBeGreaterThan(2)
  })

  it('every arrival of the same text shares the clock', () => {
    for (const name of ['typewriter', 'fade', 'scatter']) {
      rows[name]!.forEach((r, i) => expect(r.totalMs).toBe(rows.crystal![i]!.totalMs))
    }
  })

  it('writes the report when asked', async () => {
    // The recorded runs: the eighteen the hand audit kept, at the shaped
    // pace, plain and through the reading-order transform.
    const curated = TRACE_IDS.filter((id) => TRACE_META[id].curated)
    const recordedRows: { config: string; plain: Summary; ordered: Summary; lag: { median: number; max: number; waitedShare: number } }[] = []
    for (const id of curated) {
      const trace = await loadTrace(id)
      const atoms = syntheticAtoms(traceAnswerText(trace), trace.prompt)
      const base = traceStrategy(trace, { pace: 'shaped' })
      const ordered = withReadingOrder(base)
      const plainLocks = locksFromEvents(base.computeTimeline(atoms), atoms.length)
      const orderedLocks = locksFromEvents(ordered.computeTimeline(atoms), atoms.length)
      const lag = readingOrderLag(plainLocks, readingOrderLocks(plainLocks, segmentPhrases(atoms), { anchor: true }))
      recordedRows.push({
        config: TRACE_META[id].config,
        plain: profileSummary(arrivalProfile({ atoms, locks: plainLocks, total: base.totalDuration(atoms) })),
        ordered: profileSummary(arrivalProfile({ atoms, locks: orderedLocks, total: ordered.totalDuration(atoms) })),
        lag: { median: lag.median, max: lag.max, waitedShare: atoms.length > 0 ? lag.waited / atoms.length : 0 },
      })
    }
    // The transform removes inversions by construction. It can add waits: a
    // phrase whose first word commits late holds its later words, so the
    // report carries both numbers rather than asserting the trade away.
    for (const r of recordedRows) expect(r.ordered.inversions).toBeLessThanOrEqual(r.plain.inversions)

    const byConfig: Record<string, { plain: ReturnType<typeof medians>; ordered: ReturnType<typeof medians>; lagMedianMs: number; lagMaxMs: number; waitedShare: number }> = {}
    const configs = ['all', ...new Set(recordedRows.map((r) => r.config))]
    for (const c of configs) {
      const rs = recordedRows.filter((r) => c === 'all' || r.config === c)
      byConfig[c] = {
        plain: medians(rs.map((r) => r.plain)),
        ordered: medians(rs.map((r) => r.ordered)),
        lagMedianMs: Math.round(median(rs.map((r) => r.lag.median))),
        lagMaxMs: Math.round(median(rs.map((r) => r.lag.max))),
        waitedShare: Number(median(rs.map((r) => r.lag.waitedShare)).toFixed(2)),
      }
    }

    const report = {
      note: 'generated by pnpm traces:arrival (tests/arrival/report.test.ts). medians over the eight coda fixtures for the authored arrivals, and over the eighteen curated recorded runs at the shaped pace. every number describes an arrival, never a reader.',
      stimuli: { fixtures: codaPrompts.length, curatedRuns: curated.length },
      arrivals: med,
      recorded: byConfig,
    }
    if (process.env.ARRIVAL_REPORT === '1') {
      mkdirSync('lib/traces', { recursive: true })
      writeFileSync('lib/traces/arrival.json', JSON.stringify(report, null, 2) + '\n')
    }
    expect(Object.keys(report.arrivals)).toContain('crystal')
  })
})

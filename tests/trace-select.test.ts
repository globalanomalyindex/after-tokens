import { describe, expect, it } from 'vitest'
import { TRACE_IDS, TRACE_META } from '@/lib/traces'
import { codaTraceIdFor, traceAudit, traceLoop } from '@/lib/traces/select'
import { TRACE_NUMBERS } from '@/lib/traces/findings'

describe('looped trajectories', () => {
  const looped = TRACE_IDS.filter((id) => TRACE_META[id].loop)

  it('flags exactly the default-sampler runs the findings cite, and none under the other samplers', () => {
    expect(looped.filter((id) => TRACE_META[id].config === 'lowconf-b32')).toHaveLength(TRACE_NUMBERS.loopedAnswersDefault)
    expect(looped.filter((id) => TRACE_META[id].config !== 'lowconf-b32')).toHaveLength(TRACE_NUMBERS.loopedAnswersOther)
  })

  it('names a phrase repeated many times that covers most of the answer', () => {
    for (const id of looped) {
      const loop = TRACE_META[id].loop!
      expect(loop.phrase.split(' ').length).toBeGreaterThanOrEqual(2)
      expect(loop.reps).toBeGreaterThanOrEqual(TRACE_NUMBERS.loopRepsRange[0])
      expect(loop.reps).toBeLessThanOrEqual(TRACE_NUMBERS.loopRepsRange[1])
      expect(loop.cover).toBeGreaterThanOrEqual(TRACE_NUMBERS.loopCoverRange[0])
      expect(loop.cover).toBeLessThanOrEqual(TRACE_NUMBERS.loopCoverRange[1])
    }
  })
})

describe('the audit of every recorded answer', () => {
  const count = (config: string, verdict: string) =>
    TRACE_IDS.filter((id) => TRACE_META[id].config === config && TRACE_META[id].audit.verdict === verdict).length

  it('matches the tallies the findings cite, per sampler', () => {
    const a = TRACE_NUMBERS.audit
    expect(count('lowconf-b32', 'complete')).toBe(a.lowconfB32.complete)
    expect(count('lowconf-b32', 'looped')).toBe(a.lowconfB32.looped)
    expect(count('random-b32', 'complete')).toBe(a.randomB32.complete)
    expect(count('lowconf-b128', 'complete')).toBe(a.lowconfB128.complete)
    expect(count('lowconf-b128', 'short')).toBe(a.lowconfB128.short)
    expect(count('lowconf-b128', 'empty')).toBe(a.lowconfB128.empty)
  })

  it('gives every run a verdict and a note', () => {
    for (const id of TRACE_IDS) {
      expect(['complete', 'looped', 'short', 'empty', 'cut']).toContain(traceAudit(id).verdict)
      expect(traceAudit(id).note.length).toBeGreaterThan(10)
    }
    expect(traceLoop('heron-poem__lowconf-b32')).toBeDefined()
    expect(traceAudit('heron-poem__lowconf-b32').verdict).toBe('looped')
  })

  it('the product demos always replay the model card default run, since its words never reach them', () => {
    expect(codaTraceIdFor('heron-poem')).toBe('heron-poem__lowconf-b32')
    expect(codaTraceIdFor('weather')).toBe('weather__lowconf-b32')
  })
})

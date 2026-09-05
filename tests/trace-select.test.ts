import { describe, expect, it } from 'vitest'
import { TRACE_IDS, TRACE_META } from '@/lib/traces'
import { codaTraceIdFor, traceLoop } from '@/lib/traces/select'
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

  it('the product demo steps past a looped run to the random-order run of the same prompt', () => {
    expect(traceLoop('heron-poem__lowconf-b32')).toBeDefined()
    expect(codaTraceIdFor('heron-poem')).toBe('heron-poem__random-b32')
    expect(traceLoop(codaTraceIdFor('heron-poem'))).toBeUndefined()
  })

  it('keeps the default sampler for every prompt that did not loop', () => {
    expect(codaTraceIdFor('weather')).toBe('weather__lowconf-b32')
    expect(codaTraceIdFor('diffusion-explain')).toBe('diffusion-explain__lowconf-b32')
  })
})

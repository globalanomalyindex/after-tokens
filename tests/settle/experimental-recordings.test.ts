import { describe, expect, it } from 'vitest'
import { EXPERIMENTS, replayExperiment, type ExperimentalTrace } from '@/lib/settle/experimental-recordings'
import { pageText } from '@/lib/settle/reader'
import { settleEnd } from '@/lib/settle/replay'

describe('observed-loop experiment adapter', () => {
  it.each(EXPERIMENTS)('replays $id without reading retrospective geometry or answer metadata', async ({ load }) => {
    const trace = (await load()).default as unknown as ExperimentalTrace
    const answer = trace.answer
    const guarded = Object.create(trace) as ExperimentalTrace
    for (const key of ['answer', 'words', 'tail_done_step', 'stats']) {
      Object.defineProperty(guarded, key, { get: () => { throw new Error(`future metadata read: ${key}`) } })
    }
    Object.defineProperty(guarded, 'tokens', { value: trace.tokens.map((token) => {
      const causal = Object.create(token)
      Object.defineProperty(causal, 'tail', { get: () => { throw new Error('retrospective tail read') } })
      return causal
    }) })
    const replay = replayExperiment(guarded)
    expect(replay.durationMs).toBeCloseTo(trace.step_wall_ms.reduce((sum, value) => sum + value, 0), 6)
    expect(replay.events.filter((event) => event.type === 'commit')).toHaveLength(32)
    expect(replay.events.filter((event) => event.type === 'commit').every((event) => event.tokens.length === 4)).toBe(true)
    const final = settleEnd(replay, 'answer')
    expect(final.status).toBe('complete')
    expect(pageText(final)).toBe(answer)
    expect(final.passages).toHaveLength(answer.length ? 1 : 0)
  })
})

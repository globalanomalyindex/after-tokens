import { describe, expect, it } from 'vitest'
import { pageText } from '@/lib/settle/reader'
import { settleAt, settleEnd } from '@/lib/settle/replay'
import { SHOWCASE_ANSWER, SHOWCASE_REPLAY } from '@/lib/settle/showcase-replay'

describe('the illustrative showcase source', () => {
  it('exposes a split word and a real committed gap before sentence eligibility', () => {
    const first = settleAt(SHOWCASE_REPLAY, 700, 'sentence')
    expect(first.prefix).toBe('Start with a little room to bre')
    expect(first.prefix.slice(first.wordSafeLength)).toBe('bre')
    expect(pageText(first)).toBe('')
    const gap = settleAt(SHOWCASE_REPLAY, 1250, 'sentence')
    expect(gap.prefix).toBe(first.prefix)
    expect(gap.receivedCount).toBeGreaterThan(first.receivedCount)
    expect(pageText(gap)).toBe('')
    const sentence = settleAt(SHOWCASE_REPLAY, 2050, 'sentence')
    expect(pageText(sentence)).toBe('Start with a little room to breathe. ')
    expect(sentence.prefix).toContain('Let a complete thought arrive')
  })

  it('shares the same prefix and final text across presentation policies', () => {
    for (const event of SHOWCASE_REPLAY.events) {
      const sentence = settleAt(SHOWCASE_REPLAY, event.atMs, 'sentence')
      const whole = settleAt(SHOWCASE_REPLAY, event.atMs, 'answer')
      expect(sentence.prefix).toBe(whole.prefix)
      if (event.type !== 'finish') expect(pageText(whole)).toBe('')
    }
    for (const policy of ['sentence', 'answer'] as const) {
      const final = settleEnd(SHOWCASE_REPLAY, policy)
      expect(final.status).toBe('complete')
      expect(pageText(final)).toBe(SHOWCASE_ANSWER)
    }
    expect(settleEnd(SHOWCASE_REPLAY, 'sentence').passages).toHaveLength(3)
    expect(SHOWCASE_REPLAY.provenance).toMatch(/authored.*not a model recording/)
    expect(SHOWCASE_REPLAY.events.every((event) => event.type === 'commit' || event.type === 'finish')).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import brainstormJson from '@/data/traces/compact/brainstorm__lowconf-b128.json'
import { asTrace } from '@/lib/diffusion/traces'
import { carve, wordSafeTokens } from '@/lib/settle/carve'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'
import { replayTrace, settleAt, settleEnd } from '@/lib/settle/replay'
import type { SettleEvent } from '@/lib/settle/types'

const commit = (atMs: number, ...tokens: { position: number; text: string; end?: boolean }[]): SettleEvent => ({ type: 'commit', atMs, tokens })

describe('the carved zone', () => {
  it('is all open slots before anything commits, as long as the bound', () => {
    const items = carve(createSettleState('sentence', 6))
    expect(items).toHaveLength(6)
    expect(items.every((i) => i.kind === 'slot' && i.state === 'open')).toBe(true)
  })

  it('draws a scattered word only when its pieces and boundaries are in', () => {
    let s = createSettleState('sentence', 8)
    s = reduceSettle(s, commit(100, { position: 3, text: ' Sapp' }))
    expect(carve(s)[3]).toEqual({ kind: 'slot', position: 3, state: 'held' })
    s = reduceSettle(s, commit(200, { position: 4, text: 'hire' }))
    expect(carve(s).filter((i) => i.kind === 'word')).toHaveLength(0)
    s = reduceSettle(s, commit(300, { position: 5, text: ' Blue' }))
    const words = carve(s).filter((i) => i.kind === 'word')
    expect(words).toEqual([{ kind: 'word', position: 3, span: 2, text: ' Sapphire' }])
    // ' Blue' itself waits for its successor
    expect(carve(s).find((i) => i.position === 5)).toEqual({ kind: 'slot', position: 5, state: 'held' })
  })

  it('holds a run whose start could be the tail of a word', () => {
    let s = createSettleState('sentence', 6)
    s = reduceSettle(s, commit(100, { position: 2, text: 'hire' }, { position: 3, text: ' is' }, { position: 4, text: ' blue ' }))
    const items = carve(s)
    // 'hire' cannot be shown: position 1 is open and 'hire' does not start with whitespace
    expect(items[2]).toEqual({ kind: 'slot', position: 2, state: 'held' })
    expect(items[3]).toEqual({ kind: 'word', position: 3, span: 1, text: ' is' })
    expect(items[4]).toEqual({ kind: 'word', position: 4, span: 1, text: ' blue ' })
  })

  it('cuts the zone at the lowest committed end and collapses the run there', () => {
    let s = createSettleState('sentence', 8)
    s = reduceSettle(s, commit(100, ...[4, 5, 6, 7].map((position) => ({ position, text: '<|endoftext|>', end: true }))))
    expect(carve(s).at(-1)).toEqual({ kind: 'end', position: 4, span: 4 })
    expect(carve(s)).toHaveLength(5)
    // an end token far out cuts the field even with open positions before it and commits after it
    let u = createSettleState('sentence', 10)
    u = reduceSettle(u, commit(100, { position: 6, text: '<|im_end|>', end: true }, { position: 8, text: ' late' }))
    expect(carve(u).map((i) => i.kind)).toEqual(['slot', 'slot', 'slot', 'slot', 'slot', 'slot', 'end'])
    s = reduceSettle(s, commit(200, { position: 0, text: 'Yes. ' }, { position: 1, text: 'No. ' }, { position: 2, text: 'Maybe.' }, { position: 3, text: '<|im_end|>', end: true }))
    expect(s.status).toBe('complete')
    expect(carve(s)).toEqual([{ kind: 'end', position: 3, span: 5 }])
  })

  it('begins where the word-safe prefix ends', () => {
    let s = createSettleState('sentence', 6)
    s = reduceSettle(s, commit(100, { position: 0, text: 'The' }, { position: 1, text: ' sun' }))
    expect(wordSafeTokens(s)).toBe(1)
    expect(carve(s)[0]).toEqual({ kind: 'slot', position: 1, state: 'held' })
  })

  it('shortens from the tail on a schedule-free recording, then fills with words', () => {
    const replay = replayTrace(asTrace(brainstormJson), 1)
    const early = carve(settleAt(replay, 60))
    const end = early.find((i) => i.kind === 'end')
    expect(end && end.kind === 'end' ? end.span : 0).toBeGreaterThan(50)
    expect(early.filter((i) => i.kind === 'slot' && i.state === 'open').length).toBeLessThan(70)
    const late = carve(settleAt(replay, 127))
    expect(late.some((i) => i.kind === 'word')).toBe(true)
    // a newline token sits between the first end token and the rest, so the run there is one
    expect(carve(settleEnd(replay))).toEqual([{ kind: 'end', position: 8, span: 1 }])
  })
})

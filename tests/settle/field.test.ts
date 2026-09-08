import { describe, expect, it } from 'vitest'
import { FIELD_HORIZON, fieldCells, fieldExtent } from '@/lib/settle/field'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'
import type { SettleEvent } from '@/lib/settle/types'

const commit = (atMs: number, ...tokens: { position: number; text: string; end?: boolean }[]): SettleEvent => ({ type: 'commit', atMs, tokens })

describe('the field', () => {
  it('spans the bound before anything commits, all open', () => {
    const cells = fieldCells(createSettleState('sentence', 8))
    expect(cells).toHaveLength(8)
    expect(cells.every((c) => c.state === 'open')).toBe(true)
  })

  it('reaches a horizon past the last commit when no bound is known', () => {
    const s = reduceSettle(createSettleState(), commit(100, { position: 3, text: 'x' }))
    expect(fieldExtent(fieldCells(s))).toBe(4 + FIELD_HORIZON)
  })

  it('classes positions by page, forming, held, committed, end and open', () => {
    let s = createSettleState('sentence', 8)
    s = reduceSettle(s, commit(100, { position: 0, text: 'One. ' }, { position: 1, text: 'Two' }, { position: 2, text: ' thr' }, { position: 5, text: 'six' }, { position: 7, text: '<|im_end|>', end: true }))
    const states = fieldCells(s).map((c) => c.state)
    expect(states).toEqual(['released', 'forming', 'held', 'open', 'open', 'committed', 'open', 'end'])
  })

  it('cuts everything past the lowest committed end, which bounds the answer', () => {
    let s = createSettleState('sentence', 12)
    s = reduceSettle(s, commit(100, ...[6, 7, 8, 9, 10, 11].map((position) => ({ position, text: '<|endoftext|>', end: true }))))
    const before = fieldCells(s)
    expect(before.map((c) => c.state)).toEqual(['open', 'open', 'open', 'open', 'open', 'open', 'end', 'beyond'])
    expect(before[7]).toEqual({ position: 7, state: 'beyond', span: 5 })
    expect(fieldExtent(before)).toBe(12)
    s = reduceSettle(s, commit(200, ...[0, 1, 2, 3, 4, 5].map((position) => ({ position, text: `w${position} ` }))))
    expect(s.status).toBe('complete')
    expect(fieldCells(s).map((c) => c.state)).toEqual(['released', 'released', 'released', 'released', 'released', 'released', 'end', 'beyond'])
    // an end token committed early, out of order, bounds the answer at once
    let t = createSettleState('sentence', 6)
    t = reduceSettle(t, commit(100, { position: 0, text: 'Yes. ' }, { position: 3, text: '<|endoftext|>', end: true }, { position: 5, text: 'x' }))
    expect(fieldCells(t).map((c) => c.state)).toEqual(['released', 'open', 'open', 'end', 'beyond'])
  })

  it('is empty for a snapshot source', () => {
    const s = reduceSettle(createSettleState(), { type: 'snapshot', atMs: 100, text: 'a', final: false })
    expect(fieldCells(s)).toEqual([])
  })
})

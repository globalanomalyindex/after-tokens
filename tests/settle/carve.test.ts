import { describe, expect, it } from 'vitest'
import brainstormJson from '@/data/traces/compact/brainstorm__lowconf-b128.json'
import { asTrace } from '@/lib/diffusion/traces'
import { carve, wordSafeTokens } from '@/lib/settle/carve'
import { createSettleState, pageText, reduceSettle } from '@/lib/settle/reader'
import { replayTrace, settleAt, settleEnd } from '@/lib/settle/replay'
import type { SettleEvent } from '@/lib/settle/types'

const commit = (atMs: number, ...tokens: { position: number; text: string; end?: boolean }[]): SettleEvent => ({ type: 'commit', atMs, tokens })
const draft = (atMs: number, ...guesses: { position: number; text: string; p: number }[]): SettleEvent => ({ type: 'draft', atMs, guesses })

describe('the zone after the page', () => {
  it('draws only the part of a token the page has not taken when a boundary falls inside it', () => {
    let s = createSettleState('sentence', 6)
    s = reduceSettle(s, commit(100, { position: 0, text: 'Yes' }, { position: 1, text: '.' }, { position: 2, text: ' If' }, { position: 3, text: ' so ' }))
    // the page took the space that begins ' If'
    expect(pageText(s)).toBe('Yes. ')
    expect(carve(s)[0]).toEqual({ kind: 'word', position: 2, span: 1, text: 'If', forming: true })
  })

  it('draws nothing after a revised page', () => {
    let s = createSettleState('sentence', 4)
    s = reduceSettle(s, commit(100, { position: 0, text: 'One.' }, { position: 1, text: '<|im_end|>', end: true }))
    s = reduceSettle(s, { type: 'revision', atMs: 200, text: 'Two.' })
    s = reduceSettle(s, { type: 'apply-revision', atMs: 300 })
    expect(pageText(s)).toBe('Two.')
    expect(carve(s)).toEqual([])
    expect(s.tokens).toEqual({})
  })
})

describe('the drafts in the zone', () => {
  it('draws a guess above the floor as a draft, never as a word, and clears it when the position commits', () => {
    let s = createSettleState('sentence', 6)
    s = reduceSettle(s, draft(100, { position: 2, text: ' sky', p: 0.6 }, { position: 4, text: ' blue', p: 0.1 }))
    expect(carve(s)[2]).toEqual({ kind: 'draft', position: 2, text: ' sky', p: 0.6, end: false })
    expect(carve(s)[4]).toEqual({ kind: 'slot', position: 4, state: 'open' })
    expect(carve(s).filter((i) => i.kind === 'word')).toHaveLength(0)
    s = reduceSettle(s, commit(200, { position: 2, text: ' sea' }))
    expect(carve(s)[2]).toEqual({ kind: 'piece', position: 2, text: ' sea' })
    expect(s.drafts[2]).toBeUndefined()
  })

  it('draws a word tail only where it can attach to letters', () => {
    let s = createSettleState('sentence', 6)
    s = reduceSettle(s, draft(100, { position: 3, text: 'phor', p: 0.8 }))
    // nothing before it draws letters: a stray tail stays blank
    expect(carve(s)[3]).toEqual({ kind: 'slot', position: 3, state: 'open' })
    s = reduceSettle(s, draft(200, { position: 2, text: ' meta', p: 0.5 }))
    expect(carve(s)[2]).toEqual({ kind: 'draft', position: 2, text: ' meta', p: 0.5, end: false })
    expect(carve(s)[3]).toEqual({ kind: 'draft', position: 3, text: 'phor', p: 0.8, end: false })
    // a committed piece before it will do as well
    let u = createSettleState('sentence', 6)
    u = reduceSettle(u, commit(100, { position: 2, text: ' meta' }))
    u = reduceSettle(u, draft(100, { position: 3, text: 'phor', p: 0.8 }))
    expect(carve(u)[2]).toEqual({ kind: 'piece', position: 2, text: ' meta' })
    expect(carve(u)[3]).toEqual({ kind: 'draft', position: 3, text: 'phor', p: 0.8, end: false })
  })

  it('draws a guessed end as an end belief, a guessed line break as a break, and nothing for other whitespace or special tokens', () => {
    let s = createSettleState('sentence', 6)
    s = reduceSettle(s, draft(100, { position: 4, text: '<|endoftext|>', p: 0.7 }, { position: 1, text: '\n', p: 0.9 }, { position: 2, text: '<|im_start|>', p: 0.9 }, { position: 3, text: ' ', p: 0.9 }))
    expect(carve(s)[4]).toEqual({ kind: 'draft', position: 4, text: '', p: 0.7, end: true })
    expect(carve(s)[1]).toEqual({ kind: 'draft', position: 1, text: '\n', p: 0.9, end: false })
    expect(carve(s)[2]).toEqual({ kind: 'slot', position: 2, state: 'open' })
    expect(carve(s)[3]).toEqual({ kind: 'slot', position: 3, state: 'open' })
  })

  it('never draws a draft past the cut', () => {
    let s = createSettleState('sentence', 8)
    s = reduceSettle(s, draft(100, { position: 6, text: ' late', p: 0.9 }))
    s = reduceSettle(s, commit(200, { position: 4, text: '<|endoftext|>', end: true }))
    expect(carve(s).filter((i) => i.kind === 'draft')).toHaveLength(0)
  })
})

describe('the carved zone', () => {
  it('is all open slots before anything commits, as long as the bound', () => {
    const items = carve(createSettleState('sentence', 6))
    expect(items).toHaveLength(6)
    expect(items.every((i) => i.kind === 'slot' && i.state === 'open')).toBe(true)
  })

  it('draws a scattered word only when its pieces and boundaries are in', () => {
    let s = createSettleState('sentence', 8)
    s = reduceSettle(s, commit(100, { position: 3, text: ' Sapp' }))
    expect(carve(s)[3]).toEqual({ kind: 'piece', position: 3, text: ' Sapp' })
    s = reduceSettle(s, commit(200, { position: 4, text: 'hire' }))
    expect(carve(s).filter((i) => i.kind === 'word')).toHaveLength(0)
    s = reduceSettle(s, commit(300, { position: 5, text: ' Blue' }))
    const words = carve(s).filter((i) => i.kind === 'word')
    expect(words).toEqual([{ kind: 'word', position: 3, span: 2, text: ' Sapphire', forming: false }])
    // ' Blue' itself waits for its successor
    expect(carve(s).find((i) => i.position === 5)).toEqual({ kind: 'piece', position: 5, text: ' Blue' })
  })

  it('holds a run whose start could be the tail of a word', () => {
    let s = createSettleState('sentence', 6)
    s = reduceSettle(s, commit(100, { position: 2, text: 'hire' }, { position: 3, text: ' is' }, { position: 4, text: ' blue ' }))
    const items = carve(s)
    // 'hire' cannot be shown: position 1 is open and 'hire' does not start with whitespace
    expect(items[2]).toEqual({ kind: 'piece', position: 2, text: 'hire' })
    expect(items[3]).toEqual({ kind: 'word', position: 3, span: 1, text: ' is', forming: false })
    expect(items[4]).toEqual({ kind: 'word', position: 4, span: 1, text: ' blue ', forming: false })
  })

  it('cuts the zone at the lowest committed end and collapses the run there', () => {
    let s = createSettleState('sentence', 8)
    s = reduceSettle(s, commit(100, ...[4, 5, 6, 7].map((position) => ({ position, text: '<|endoftext|>', end: true }))))
    const live = (items: ReturnType<typeof carve>) => items.filter((i) => !(i.kind === 'slot' && i.state === 'beyond'))
    expect(live(carve(s)).at(-1)).toEqual({ kind: 'end', position: 4, span: 4 })
    expect(live(carve(s))).toHaveLength(5)
    // positions past the cut are kept as beyond, so a surface can close them smoothly
    expect(carve(s).filter((i) => i.kind === 'slot' && i.state === 'beyond').map((i) => i.position)).toEqual([5, 6, 7])
    // an end token far out cuts the field even with open positions before it and commits after it
    let u = createSettleState('sentence', 10)
    u = reduceSettle(u, commit(100, { position: 6, text: '<|im_end|>', end: true }, { position: 8, text: ' late' }))
    expect(live(carve(u)).map((i) => i.kind)).toEqual(['slot', 'slot', 'slot', 'slot', 'slot', 'slot', 'end'])
    s = reduceSettle(s, commit(200, { position: 0, text: 'Yes. ' }, { position: 1, text: 'No. ' }, { position: 2, text: 'Maybe.' }, { position: 3, text: '<|im_end|>', end: true }))
    expect(s.status).toBe('complete')
    expect(carve(s).filter((i) => !(i.kind === 'slot' && i.state === 'beyond'))).toEqual([{ kind: 'end', position: 3, span: 5 }])
  })

  it('begins where the page ends, with in-order words marked forming', () => {
    let s = createSettleState('sentence', 6)
    s = reduceSettle(s, commit(100, { position: 0, text: 'The' }, { position: 1, text: ' sun' }))
    expect(wordSafeTokens(s)).toBe(1)
    expect(carve(s)[0]).toEqual({ kind: 'word', position: 0, span: 1, text: 'The', forming: true })
    expect(carve(s)[1]).toEqual({ kind: 'piece', position: 1, text: ' sun' })
    s = reduceSettle(s, commit(200, { position: 2, text: ' rises. ' }))
    // a released sentence leaves the zone
    expect(carve(s).map((i) => i.position)[0]).toBe(3)
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
    expect(carve(settleEnd(replay)).filter((i) => !(i.kind === 'slot' && i.state === 'beyond'))).toEqual([{ kind: 'end', position: 8, span: 1 }])
  })
})

describe('the reel below the floor', () => {
  it('draws a spin as a spin only where a draft is not shown, never for a break, whitespace, punctuation, an end or a special token, and never continuing a word from blank space', () => {
    let s = createSettleState('sentence', 8)
    s = reduceSettle(s, { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'The' }] })
    s = reduceSettle(s, { type: 'draft', atMs: 200, guesses: [{ position: 2, text: ' sea', p: 0.6 }] })
    s = reduceSettle(s, { type: 'spin', atMs: 200, guesses: [
      { position: 1, text: ' sky', p: 0.1 },
      { position: 2, text: ' sea', p: 0.6 },
      { position: 3, text: '\n', p: 0.1 },
      { position: 4, text: ' ', p: 0.1 },
      { position: 5, text: '<|im_end|>', p: 0.1 },
      { position: 6, text: 'ing', p: 0.1 },
      { position: 7, text: ' is', p: 0.2 },
    ] })
    s = reduceSettle(s, { type: 'spin', atMs: 250, guesses: [{ position: 4, text: '.', p: 0.1 }] })
    const items = carve(s)
    const at = (position: number) => items.find((item) => 'position' in item && item.position === position)
    expect(at(1)).toEqual({ kind: 'spin', position: 1, text: ' sky', p: 0.1 })
    expect(at(2)?.kind).toBe('draft')
    expect(at(3)).toEqual({ kind: 'slot', position: 3, state: 'open' })
    expect(at(4)).toEqual({ kind: 'slot', position: 4, state: 'open' })
    expect(at(5)).toEqual({ kind: 'slot', position: 5, state: 'open' })
    expect(at(6)).toEqual({ kind: 'slot', position: 6, state: 'open' })
    expect(at(7)).toEqual({ kind: 'spin', position: 7, text: ' is', p: 0.2 })
    // a spin that continues a word attaches to letters before it
    s = reduceSettle(s, { type: 'spin', atMs: 300, guesses: [{ position: 1, text: 'ir', p: 0.1 }] })
    expect(carve(s).find((item) => 'position' in item && item.position === 1)).toEqual({ kind: 'spin', position: 1, text: 'ir', p: 0.1 })
  })
})

describe('the prior', () => {
  it('draws a guess made at four or more open positions at once as blank, whatever its spacing or case, and keeps a guess specific to its position', () => {
    let s = createSettleState('sentence', 10)
    s = reduceSettle(s, { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'Rain' }] })
    s = reduceSettle(s, { type: 'spin', atMs: 200, guesses: [
      { position: 1, text: ' the', p: 0.06 },
      { position: 2, text: ' The', p: 0.05 },
      { position: 3, text: ' falls', p: 0.12 },
      { position: 4, text: ' the', p: 0.07 },
      { position: 5, text: 'the', p: 0.04 },
      { position: 6, text: ' sky', p: 0.1 },
      { position: 7, text: ' sky', p: 0.1 },
      { position: 8, text: ' sky', p: 0.1 },
    ] })
    expect(s.prior).toEqual(['the'])
    const items = carve(s)
    const at = (position: number) => items.find((item) => 'position' in item && item.position === position)
    for (const position of [1, 2, 4, 5]) expect(at(position)).toEqual({ kind: 'slot', position, state: 'open' })
    expect(at(3)?.kind).toBe('spin')
    expect(at(6)?.kind).toBe('spin')
    // a committed position no longer counts toward the prior, but the prior
    // holds while two positions still make the guess, and lets go below that
    s = reduceSettle(s, { type: 'commit', atMs: 300, tokens: [{ position: 1, text: ' the' }] })
    expect(s.prior).toEqual(['the'])
    expect(carve(s).find((item) => 'position' in item && item.position === 4)?.kind).toBe('slot')
    s = reduceSettle(s, { type: 'commit', atMs: 400, tokens: [{ position: 2, text: ' the' }, { position: 5, text: 'the' }] })
    expect(s.prior).toEqual([])
    expect(carve(s).find((item) => 'position' in item && item.position === 4)?.kind).toBe('spin')
  })

  it('does not blink: a guess that reaches four positions stays the prior while it keeps two', () => {
    let s = createSettleState('sentence', 10)
    const at = (n: number, text: string) => Array.from({ length: n }, (_, i) => ({ position: 1 + i, text, p: 0.05 }))
    s = reduceSettle(s, { type: 'spin', atMs: 100, guesses: at(3, ' sea') })
    expect(s.prior).toEqual([])
    s = reduceSettle(s, { type: 'spin', atMs: 200, guesses: at(4, ' sea') })
    expect(s.prior).toEqual(['sea'])
    s = reduceSettle(s, { type: 'spin', atMs: 300, guesses: [{ position: 3, text: ' sky', p: 0.05 }, { position: 4, text: ' sky', p: 0.05 }] })
    expect(s.prior).toEqual(['sea'])
    s = reduceSettle(s, { type: 'spin', atMs: 400, guesses: [{ position: 2, text: ' sky', p: 0.05 }] })
    expect(s.prior).toEqual([])
  })
})


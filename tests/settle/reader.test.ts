import { describe, expect, it } from 'vitest'
import { passageBoundary, wordSafeLength } from '@/lib/settle/boundary'
import { createSettleState, formingText, heldText, pageText, reduceSettle } from '@/lib/settle/reader'
import type { SettleEvent, SettleState } from '@/lib/settle/types'

function run(events: SettleEvent[], policy: 'word' | 'sentence' | 'paragraph' = 'sentence', bound: number | null = null): SettleState {
  return events.reduce(reduceSettle, createSettleState(policy, bound))
}

const commit = (atMs: number, ...tokens: { position: number; text: string; end?: boolean }[]): SettleEvent => ({ type: 'commit', atMs, tokens })
const draft = (atMs: number, ...guesses: { position: number; text: string; p: number }[]): SettleEvent => ({ type: 'draft', atMs, guesses })

describe('the drafts', () => {
  it('change nothing the reader can count on', () => {
    const before = run([commit(100, { position: 0, text: 'The sky. ' })])
    const after = reduceSettle(before, draft(200, { position: 1, text: ' It', p: 0.9 }, { position: 2, text: ' is', p: 0.4 }))
    expect(pageText(after)).toBe(pageText(before))
    expect(formingText(after)).toBe(formingText(before))
    expect(heldText(after)).toBe(heldText(before))
    expect(after.passages).toEqual(before.passages)
    expect(after.receivedCount).toBe(before.receivedCount)
    expect(after.status).toBe('receiving')
    expect(after.drafts[1]).toEqual({ text: ' It', p: 0.9, shown: true })
  })

  it('shows a guess only above the floor, keeps it while its text holds, and drops it when withdrawn', () => {
    let s = run([draft(100, { position: 3, text: ' sea', p: 0.2 })])
    expect(s.status).toBe('receiving')
    expect(s.drafts[3]?.shown).toBe(false)
    s = reduceSettle(s, draft(200, { position: 3, text: ' sea', p: 0.3 }))
    expect(s.drafts[3]?.shown).toBe(true)
    s = reduceSettle(s, draft(300, { position: 3, text: ' sea', p: 0.2 }))
    expect(s.drafts[3]?.shown).toBe(true)
    s = reduceSettle(s, draft(400, { position: 3, text: ' sky', p: 0.2 }))
    expect(s.drafts[3]?.shown).toBe(false)
    s = reduceSettle(s, draft(500, { position: 3, text: '', p: 0 }))
    expect(s.drafts[3]).toBeUndefined()
  })

  it('ignores a guess at a committed position, and a commitment ends the guess at its position', () => {
    let s = run([commit(100, { position: 0, text: 'Yes' })])
    s = reduceSettle(s, draft(200, { position: 0, text: 'No', p: 0.9 }, { position: 1, text: ', after', p: 0.9 }))
    expect(s.drafts[0]).toBeUndefined()
    expect(s.drafts[1]?.shown).toBe(true)
    s = reduceSettle(s, commit(300, { position: 1, text: ', now' }))
    expect(s.drafts[1]).toBeUndefined()
    expect(pageText(s)).toBe('')
    expect(heldText(s)).toBe('Yes, now')
  })

  it('leaves no draft on a completed answer and none after a terminal event', () => {
    const done = run([draft(100, { position: 2, text: ' more', p: 0.9 }), commit(200, { position: 0, text: 'Yes.' }, { position: 1, text: '<|im_end|>', end: true })])
    expect(done.status).toBe('complete')
    expect(done.drafts).toEqual({})
    const stopped = run([commit(100, { position: 0, text: 'a ' }), { type: 'stop', atMs: 200 }, draft(300, { position: 1, text: ' b', p: 0.9 })])
    expect(stopped.drafts).toEqual({})
  })

  it('rejects a draft on a snapshot stream as the contract does any commitment', () => {
    const s = run([{ type: 'snapshot', atMs: 100, text: 'x', final: false }, draft(200, { position: 0, text: 'y', p: 0.9 })])
    expect(s.status).toBe('error')
  })
})

describe('the word rule', () => {
  it('holds a token whose successor is uncommitted', () => {
    expect(wordSafeLength([{ position: 0, text: 'The answer is' }, { position: 1, text: ' Sapp' }], false)).toBe('The answer is'.length)
  })
  it('releases a token once the next committed token starts with whitespace', () => {
    expect(wordSafeLength([{ position: 0, text: ' Sapp' }, { position: 1, text: 'hire' }, { position: 2, text: ' Blue' }], false)).toBe(' Sapphire'.length)
  })
  it('treats trailing whitespace as a boundary', () => {
    expect(wordSafeLength([{ position: 0, text: 'sky,\n' }], false)).toBe(5)
  })
  it('releases everything at finality', () => {
    expect(wordSafeLength([{ position: 0, text: 'Yes' }, { position: 1, text: ', after review.' }], true)).toBe('Yes, after review.'.length)
  })
})

describe('the passage boundary', () => {
  it('ends a sentence only at terminal punctuation followed by whitespace', () => {
    expect(passageBoundary('One. Two', 'sentence')).toBe(5)
    expect(passageBoundary('One.', 'sentence')).toBe(0)
    expect(passageBoundary('Dr. Who arrived. Then', 'sentence')).toBe('Dr. Who arrived. '.length)
  })
  it('holds lists and code until a blank line', () => {
    expect(passageBoundary('1. Save. Then\n2. Check.\n', 'sentence')).toBe(0)
    expect(passageBoundary('1. Save.\n2. Check.\n\nDone. ', 'sentence')).toBe('1. Save.\n2. Check.\n\n'.length)
    expect(passageBoundary('```js\nconst a = 1;\n```\n\n', 'sentence')).toBe('```js\nconst a = 1;\n```\n\n'.length)
    expect(passageBoundary('use `a.b. c` here. Next', 'sentence')).toBe('use `a.b. c` here. '.length)
  })
  it('under paragraph, waits for a blank line', () => {
    expect(passageBoundary('One. Two. Three.', 'paragraph')).toBe(0)
    expect(passageBoundary('One. Two.\n\nThree.', 'paragraph')).toBe('One. Two.\n\n'.length)
  })
  it('under word, the whole safe text is a passage', () => {
    expect(passageBoundary('One two', 'word')).toBe(7)
  })
})

describe('the reducer', () => {
  it('draws nothing from a batch behind a hole, then everything when the hole fills', () => {
    const s1 = run([commit(100, { position: 0, text: 'Do not ' }, { position: 2, text: 'the file. ' })])
    expect(pageText(s1)).toBe('')
    expect(formingText(s1)).toBe('Do not ')
    expect(s1.tokens[2]?.text).toBe('the file. ')
    const s2 = reduceSettle(s1, commit(200, { position: 1, text: 'delete ' }))
    expect(pageText(s2)).toBe('Do not delete the file. ')
    expect(s2.passages).toHaveLength(1)
    expect(s2.passages[0]?.availableAtMs).toBe(200)
  })

  it('never puts a partial word in the forming text', () => {
    const s = run([commit(100, { position: 0, text: 'The answer is' }, { position: 1, text: ' Sapp' })])
    expect(formingText(s)).toBe('The answer is')
    expect(heldText(s)).toBe(' Sapp')
    const s2 = reduceSettle(s, commit(200, { position: 3, text: ' Blue' }))
    expect(heldText(s2)).toBe(' Sapp')
    const s3 = reduceSettle(s2, commit(300, { position: 2, text: 'hire' }))
    expect(formingText(s3)).toBe('The answer is Sapphire')
    expect(heldText(s3)).toBe(' Blue')
  })

  it('under the word policy, each safe span lands on the page and nothing forms', () => {
    const s = run([commit(100, { position: 0, text: 'The answer is' }, { position: 1, text: ' Sapp' })], 'word')
    expect(pageText(s)).toBe('The answer is')
    expect(formingText(s)).toBe('')
    expect(heldText(s)).toBe(' Sapp')
  })

  it('completes at an end token reached by the prefix, and ignores later events', () => {
    const s = run([
      commit(100, { position: 1, text: '<|im_end|>', end: true }),
      commit(200, { position: 0, text: 'Yes.' }),
      commit(300, { position: 5, text: 'late' }),
    ])
    expect(s.status).toBe('complete')
    expect(s.endAt).toBe(1)
    expect(pageText(s)).toBe('Yes.')
    expect(s.tokens[5]).toBeUndefined()
  })

  it('does not complete on an end token behind a hole', () => {
    const s = run([commit(100, { position: 0, text: 'Yes' }, { position: 2, text: '<|im_end|>', end: true })])
    expect(s.status).toBe('receiving')
    expect(s.endAt).toBeNull()
  })

  it('fails a finish with a hole, and a commitment outside the bound', () => {
    const holed = run([commit(100, { position: 0, text: 'a ' }, { position: 2, text: 'c' }), { type: 'finish', atMs: 200, tokenCount: 3 }])
    expect(holed.status).toBe('error')
    const outside = run([commit(100, { position: 4, text: 'x' })], 'sentence', 4)
    expect(outside.status).toBe('error')
  })

  it('validates a whole batch before releasing any of it', () => {
    const s = run([
      commit(100, { position: 0, text: 'a ' }),
      commit(200, { position: 1, text: 'b ' }, { position: 0, text: 'A ' }),
    ])
    expect(s.status).toBe('error')
    expect(pageText(s)).toBe('')
    expect(s.tokens[1]).toBeUndefined()
  })

  it('keeps released passages after a stop or an error, and holds the rest', () => {
    const s = run([
      commit(100, { position: 0, text: 'The first check passed. ' }),
      commit(200, { position: 1, text: 'The second check is still' }),
      { type: 'stop', atMs: 300 },
    ])
    expect(s.status).toBe('stopped')
    expect(pageText(s)).toBe('The first check passed. ')
    expect(heldText(s)).toBe('The second check is still')
  })

  it('lets the first terminal event win', () => {
    const s = run([commit(100, { position: 0, text: 'a. ' }), { type: 'stop', atMs: 200 }, { type: 'error', atMs: 300, message: 'late' }])
    expect(s.status).toBe('stopped')
  })

  it('rejects decreasing timestamps', () => {
    const s = run([commit(200, { position: 0, text: 'a ' }), commit(100, { position: 1, text: 'b ' })])
    expect(s.status).toBe('error')
  })

  it('holds snapshots until an explicitly final one, then releases exactly that text', () => {
    const s1 = run([{ type: 'snapshot', atMs: 100, text: 'The review is complete.', final: false }, { type: 'snapshot', atMs: 200, text: 'The review is complete.', final: false }])
    expect(pageText(s1)).toBe('')
    expect(s1.status).toBe('receiving')
    const s2 = reduceSettle(s1, { type: 'snapshot', atMs: 300, text: 'The review is complete. Two items are approved.', final: true })
    expect(s2.status).toBe('complete')
    expect(pageText(s2)).toBe('The review is complete. Two items are approved.')
    expect(s2.passages.map((p) => p.text)).toEqual(['The review is complete. ', 'Two items are approved.'])
  })

  it('cannot switch a stream between commitments and snapshots', () => {
    expect(run([commit(100, { position: 0, text: 'a ' }), { type: 'snapshot', atMs: 200, text: 'b', final: true }]).status).toBe('error')
    expect(run([{ type: 'snapshot', atMs: 100, text: 'a', final: false }, commit(200, { position: 0, text: 'b' })]).status).toBe('error')
  })

  it('keeps the previous page through a revision until it is applied', () => {
    const base = run([{ type: 'snapshot', atMs: 100, text: 'One. ', final: true }])
    const revised = reduceSettle(base, { type: 'revision', atMs: 200, text: 'Two. Three.' })
    expect(revised.status).toBe('revision')
    expect(pageText(revised)).toBe('One. ')
    const applied = reduceSettle(revised, { type: 'apply-revision', atMs: 300 })
    expect(applied.status).toBe('complete')
    expect(pageText(applied)).toBe('Two. Three.')
    expect(applied.previousPassages?.map((p) => p.text)).toEqual(['One. '])
    expect(applied.version).toBe(1)
    expect(applied.passages[0]?.id).toBe('v1-p0')
  })

  it('refuses a revision before completion', () => {
    expect(run([commit(100, { position: 0, text: 'a ' }), { type: 'revision', atMs: 200, text: 'b' }]).status).toBe('error')
  })

  it('releases the exact remainder at finality even mid-thought', () => {
    const s = run([commit(100, { position: 0, text: 'The upload has' }), { type: 'finish', atMs: 200, tokenCount: 1 }])
    expect(s.status).toBe('complete')
    expect(pageText(s)).toBe('The upload has')
    expect(s.bound).toBe(1)
  })

  it('completes an empty answer without manufacturing a passage', () => {
    const s = run([commit(100), { type: 'finish', atMs: 200, tokenCount: 0 }])
    expect(s.status).toBe('complete')
    expect(s.passages).toHaveLength(0)
  })

  it('is a pure function of its event history', () => {
    const events = [commit(100, { position: 0, text: 'One. ' }, { position: 2, text: 'Three.' }), commit(200, { position: 1, text: 'Two. ' })]
    const a = run(events)
    const b = run(events)
    expect(a).toEqual(b)
    const prefixOnly = run(events.slice(0, 1))
    expect(prefixOnly.passages).toEqual(a.passages.slice(0, 1))
  })
})

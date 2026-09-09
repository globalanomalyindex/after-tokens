import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { createSettleState, formingText, heldText, pageText, reduceSettle } from '@/lib/settle/reader'
import type { SettleEvent } from '@/lib/settle/types'

afterEach(cleanup)

describe('provisional whole-snapshot compatibility', () => {
  it('retains the latest 39 → 36 → 39 candidate without releasing any of its text', () => {
    let state = createSettleState('answer')
    expect(state.snapshotCandidate).toBeNull()
    const { container, rerender } = render(<SettleAnswer state={state} motion={false} />)
    const candidates = ['**Answer** = 39', '**Answer** = 36\n\nA revised explanation.', '**Answer** = 39']
    for (const [index, text] of candidates.entries()) {
      state = reduceSettle(state, { type: 'snapshot', atMs: (index + 1) * 100, text, final: false })
      rerender(<SettleAnswer state={state} motion={false} />)
      expect(state.snapshotCandidate).toBe(text)
      expect(state.status).toBe('receiving')
      expect(state.tokens).toEqual({})
      expect(state.prefix).toBe('')
      expect(state.passages).toEqual([])
      expect([pageText(state), formingText(state), heldText(state)]).toEqual(['', '', ''])
      expect(container.querySelector('.settle-page')?.textContent).toBe('')
      expect(container.textContent).not.toContain('39')
      expect(container.textContent).not.toContain('36')
      expect(container.querySelector('.settle-answer-arrival')).toBeNull()
    }
    const text = '  **Answer** = 39\r\n\r\nFinal explanation. 🙂'
    state = reduceSettle(state, { type: 'snapshot', atMs: 400, text, final: true })
    rerender(<SettleAnswer state={state} motion={false} />)
    expect(state.snapshotCandidate).toBeNull()
    expect(state.status).toBe('complete')
    expect(state.passages).toEqual([{ id: 'v0-p0', text, availableAtMs: 400 }])
    expect(container.querySelector('.settle-answer-text')?.childNodes).toHaveLength(1)
    expect(container.querySelector('.settle-page')?.textContent).toBe(text)
    expect(reduceSettle(state, { type: 'snapshot', atMs: 500, text: 'late replacement', final: true })).toBe(state)
    expect(reduceSettle(state, { type: 'snapshot', atMs: 600, text: 'late candidate', final: false })).toBe(state)
    const proposed = reduceSettle(state, { type: 'revision', atMs: 700, text: 'Reviewed replacement.' })
    expect(proposed.snapshotCandidate).toBeNull()
    expect(pageText(proposed)).toBe(text)
    expect(reduceSettle(proposed, { type: 'apply-revision', atMs: 800 }).snapshotCandidate).toBeNull()
  })

  const terminalEvents: SettleEvent[] = [
    { type: 'stop', atMs: 200 },
    { type: 'error', atMs: 200, message: 'transport failed' },
    { type: 'snapshot', atMs: 50, text: 'out of order', final: false },
    { type: 'revision', atMs: 200, text: 'premature revision' },
    { type: 'commit', atMs: 200, tokens: [{ position: 0, text: 'wrong source' }] },
  ]
  it.each(terminalEvents)('clears a candidate when a $type event terminates or invalidates its stream', (event) => {
    const waiting = reduceSettle(createSettleState('answer'), { type: 'snapshot', atMs: 100, text: 'Unreleased draft.', final: false })
    const terminal = reduceSettle(waiting, event)
    expect(terminal.snapshotCandidate).toBeNull()
    expect(terminal.status).toBe(event.type === 'stop' ? 'stopped' : 'error')
    expect(pageText(terminal)).toBe('')
    expect(terminal.passages).toEqual([])
  })

  it('treats an empty provisional snapshot as the latest candidate, never as completion', () => {
    const previous = reduceSettle(createSettleState('answer'), { type: 'snapshot', atMs: 100, text: 'Earlier candidate.', final: false })
    const empty = reduceSettle(previous, { type: 'snapshot', atMs: 200, text: '', final: false })
    expect(empty.snapshotCandidate).toBe('')
    expect(empty.status).toBe('receiving')
    expect(pageText(empty)).toBe('')
    expect(createSettleState('answer').snapshotCandidate).toBeNull()
  })
})

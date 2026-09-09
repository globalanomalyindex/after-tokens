import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'
import { replayTrace, settleEnd } from '@/lib/settle/replay'
import { TRACE_IDS, loadTrace } from '@/lib/traces/index'

afterEach(cleanup)

describe('the gathering surface', () => {
  it('preserves a candidate cell and its ambient layer when preceding whitespace changes', () => {
    let state = createSettleState('sentence', 5)
    state = reduceSettle(state, { type: 'draft', atMs: 100, guesses: [{ position: 1, text: ' blue', p: 0.8 }, { position: 2, text: ' sky', p: 0.8 }] })
    const { container, rerender } = render(<SettleAnswer state={state} />)
    const cell = container.querySelector('[data-pos="2"]')
    const ambient = cell?.querySelector('.settle-ambient')
    expect(cell).not.toBeNull()
    state = reduceSettle(state, { type: 'draft', atMs: 200, guesses: [{ position: 2, text: 'ness', p: 0.8 }] })
    rerender(<SettleAnswer state={state} />)
    expect(container.querySelector('[data-pos="2"]')).toBe(cell)
    expect(ambient).not.toBeNull()
    expect(cell?.querySelector('.settle-ambient')).toBe(ambient)
  })

  it('does not give guessed newlines authority over line layout', () => {
    let state = createSettleState('sentence', 3)
    state = reduceSettle(state, { type: 'draft', atMs: 100, guesses: [{ position: 1, text: '\n', p: 0.9 }] })
    const { container } = render(<SettleAnswer state={state} />)
    expect(container.querySelector('.settle-page br')).toBeNull()
    expect(container.querySelector('[data-pos="1"]')).not.toBeNull()
  })

  it('keeps a word mounted through passage release and preserves exact final whitespace', () => {
    let state = createSettleState('sentence', 5)
    state = reduceSettle(state, { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'Hello' }, { position: 1, text: ' world' }] })
    const { container, rerender } = render(<SettleAnswer state={state} />)
    const hello = container.querySelector('[data-pos="0"]')
    state = reduceSettle(state, { type: 'commit', atMs: 200, tokens: [{ position: 2, text: '.\n\n' }, { position: 3, text: 'Again.' }, { position: 4, text: '', end: true }] })
    state = reduceSettle(state, { type: 'finish', atMs: 250, tokenCount: 5 })
    rerender(<SettleAnswer state={state} />)
    expect(container.querySelector('[data-pos="0"]')).toBe(hello)
    expect(container.querySelector('.settle-page')?.textContent).toBe('Hello world.\n\nAgain.')
    expect(container.querySelector('[data-pos="0"]')).toHaveAttribute('data-released', 'true')
  })

  it('keeps explicit motion off and a terminal source inactive without hiding committed text', () => {
    let state = createSettleState('sentence', 2)
    state = reduceSettle(state, { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'Ready.' }, { position: 1, text: '', end: true }] })
    state = reduceSettle(state, { type: 'finish', atMs: 200, tokenCount: 2 })
    const { container } = render(<SettleAnswer state={state} motion={false} />)
    expect(container.querySelector('.settle')).toHaveAttribute('data-motion', 'off')
    expect(container.querySelector('.settle')).toHaveAttribute('data-active', 'false')
    expect(container.querySelector('.settle-page')?.textContent).toBe('Ready.')
  })

  it('keeps every committed fragment mounted when a multi-token word completes', () => {
    let state = createSettleState('sentence', 4)
    state = reduceSettle(state, { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'inter' }, { position: 1, text: 'nation' }] })
    const { container, rerender } = render(<SettleAnswer state={state} />)
    const fragment = container.querySelector('[data-pos="1"]')
    const ink = fragment?.querySelector('.settle-ink')
    state = reduceSettle(state, { type: 'commit', atMs: 200, tokens: [{ position: 2, text: 'al ' }] })
    rerender(<SettleAnswer state={state} />)
    expect(container.querySelector('[data-pos="1"]')).toBe(fragment)
    expect(fragment?.querySelector('.settle-ink')).toBe(ink)
    expect(fragment).toHaveAttribute('data-state', 'word')
    expect(container.querySelector('.settle-page')?.textContent).toBe('international ')
  })

  it('does not leak the rest of a multi-word token through held mode', () => {
    let state = createSettleState('sentence', 2)
    state = reduceSettle(state, { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'Ready. More ' }] })
    const { container } = render(<SettleAnswer state={state} forming="held" />)
    expect(container.querySelector('.settle-page')?.textContent).toBe('Ready. ')
  })

  it('renders every recorded final answer exactly under all three policies', async () => {
    const { container, rerender } = render(<SettleAnswer state={createSettleState()} motion={false} />)
    for (const id of TRACE_IDS) {
      const trace = await loadTrace(id)
      for (const policy of ['word', 'sentence', 'paragraph'] as const) {
        const state = settleEnd(replayTrace(trace, 'recorded'), policy)
        rerender(<SettleAnswer state={state} runId={`${id}:${policy}`} motion={false} />)
        expect(container.querySelector('.settle-page')?.textContent, `${id}:${policy}`).toBe(trace.answer)
      }
    }
  }, 20000)
})

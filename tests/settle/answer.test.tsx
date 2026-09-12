import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'
import { replayTrace, settleEnd } from '@/lib/settle/replay'
import { TRACE_IDS, loadTrace } from '@/lib/traces/index'

afterEach(cleanup)

describe('the unified reading surface', () => {
  it('keeps changing guesses out of the reading page while preserving its modern ornament', () => {
    let state = createSettleState('sentence', 5)
    state = reduceSettle(state, { type: 'draft', atMs: 100, guesses: [{ position: 1, text: ' blue', p: 0.8 }, { position: 2, text: ' sky', p: 0.8 }] })
    const { container, rerender } = render(<SettleAnswer state={state} motion={false} />)
    const ambient = container.querySelector('.ambient-composition')
    expect(ambient).not.toBeNull()
    state = reduceSettle(state, { type: 'draft', atMs: 200, guesses: [{ position: 2, text: 'ness', p: 0.8 }] })
    rerender(<SettleAnswer state={state} motion={false} />)
    expect(container.querySelector('.ambient-composition')).toBe(ambient)
    expect(container.querySelector('.settle-page')?.textContent).toBe('')
    expect(container.querySelectorAll('.settle-candidate, .settle-draft, .settle-ambient, .settle-unit, .settle-field')).toHaveLength(0)
  })

  it('does not give guessed newlines authority over reading layout', () => {
    let state = createSettleState('sentence', 3)
    state = reduceSettle(state, { type: 'draft', atMs: 100, guesses: [{ position: 1, text: '\n', p: 0.9 }] })
    const { container } = render(<SettleAnswer state={state} motion={false} />)
    expect(container.querySelector('.settle-page br')).toBeNull()
    expect(container.querySelector('.settle-page')?.textContent).toBe('')
  })

  it('keeps an earlier released passage mounted as another passage arrives', () => {
    let state = createSettleState('sentence', 5)
    state = reduceSettle(state, { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'Hello world.\n\n' }] })
    const { container, rerender } = render(<SettleAnswer state={state} motion={false} />)
    const hello = container.querySelector('[data-passage]')
    expect(hello).not.toBeNull()
    state = reduceSettle(state, { type: 'commit', atMs: 200, tokens: [{ position: 1, text: 'Again.' }, { position: 2, text: '', end: true }] })
    state = reduceSettle(state, { type: 'finish', atMs: 250, tokenCount: 3 })
    rerender(<SettleAnswer state={state} motion={false} />)
    expect(container.querySelector('[data-passage]')).toBe(hello)
    expect(container.querySelector('.settle-page')?.textContent).toBe('Hello world.\n\nAgain.')
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

  it('withholds a multi-token word until its boundary is released', () => {
    let state = createSettleState('word', 4)
    state = reduceSettle(state, { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'inter' }, { position: 1, text: 'nation' }] })
    const { container, rerender } = render(<SettleAnswer state={state} motion={false} />)
    expect(container.querySelector('.settle-page')?.textContent).toBe('')
    state = reduceSettle(state, { type: 'commit', atMs: 200, tokens: [{ position: 2, text: 'al ' }] })
    rerender(<SettleAnswer state={state} motion={false} />)
    expect(container.querySelector('.settle-page')?.textContent).toBe('international ')
  })

  it('does not leak the rest of a multi-word token through held mode', () => {
    let state = createSettleState('sentence', 2)
    state = reduceSettle(state, { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'Ready. More ' }] })
    const { container } = render(<SettleAnswer state={state} forming="held" />)
    expect(container.querySelector('.settle-page')?.textContent).toBe('Ready. ')
  })

  it.each(['word', 'sentence', 'paragraph', 'answer'] as const)('uses modern reshape material under %s without exposing a revisable snapshot', (policy) => {
    const state = reduceSettle(createSettleState(policy), { type: 'snapshot', atMs: 100, final: false, text: 'A complete-looking answer.\n\nStill provisional.' })
    const { container } = render(<SettleAnswer state={state} motion={false} />)
    expect(container.querySelector('.settle')).toHaveAttribute('data-material', 'growing-cell-skeleton-v8')
    expect(container.querySelector('.settle')).toHaveAttribute('data-ambient-condition', 'reshape')
    expect(container.querySelector('.settle-page')?.textContent).toBe('')
    expect(container.querySelector('.ambient-composition')).not.toBeNull()
    expect(container.querySelectorAll('.settle-candidate, .settle-draft, .settle-ambient, .settle-unit, .settle-field')).toHaveLength(0)
  })

  // Each independent recording gets its own deadline and failure identity.
  // Preserve all 60 × 3 DOM comparisons without one aggregate wall-clock limit.
  it.each(TRACE_IDS)('renders %s exactly under all three policies', async (id) => {
    const { container, rerender } = render(<SettleAnswer state={createSettleState()} motion={false} />)
    const trace = await loadTrace(id)
    const replay = replayTrace(trace, 'recorded')
    for (const policy of ['word', 'sentence', 'paragraph'] as const) {
      const state = settleEnd(replay, policy)
      rerender(<SettleAnswer state={state} runId={`${id}:${policy}`} motion={false} />)
      expect(container.querySelector('.settle-page')?.textContent, `${id}:${policy}`).toBe(trace.answer)
    }
  })
})

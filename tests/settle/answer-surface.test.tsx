import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'

const forming = () => reduceSettle(createSettleState('answer', 6), {
  type: 'commit', atMs: 100, tokens: [
    { position: 0, text: 'A complete early sentence. ' },
    { position: 4, text: 'Future fragment' },
  ],
})

describe('whole-answer reading surface', () => {
  it('keeps available text out of the reading DOM while the answer is forming', () => {
    const { container, rerender } = render(<SettleAnswer state={forming()} />)
    expect(screen.getByRole('region', { name: 'answer' }).textContent).toBe('')
    expect(container.querySelectorAll('.settle-candidate, .settle-ink, .settle-unit')).toHaveLength(0)
    expect(container.querySelector('.ambient-composition')).not.toBeNull()
    const ornament = container.querySelector('.ambient-composition')
    const next = reduceSettle(forming(), { type: 'draft', atMs: 200, guesses: [{ position: 1, text: 'a much longer next guess', p: .99 }] })
    rerender(<SettleAnswer state={next} />)
    expect(container.querySelector('.ambient-composition')).toBe(ornament)
    expect(screen.getByRole('region', { name: 'answer' }).textContent).toBe('')
  })

  it('puts the entire exact answer in one passage at finality, without candidate geometry', () => {
    const text = '  1. First line.\n2. Second line.\n\nA longer final thought. 🙂'
    const initial = createSettleState('answer')
    const { container, rerender } = render(<SettleAnswer state={initial} motion={false} />)
    const final = reduceSettle(initial, { type: 'snapshot', atMs: 100, final: true, text })
    rerender(<SettleAnswer state={final} motion={false} />)
    const page = screen.getByRole('region', { name: 'answer' })
    expect(page.textContent).toBe(text)
    expect(container.querySelector('.settle-answer-text')?.childNodes).toHaveLength(1)
    expect(container.querySelector('[data-passage]')?.firstChild?.nodeType).toBe(Node.TEXT_NODE)
    expect(container.querySelectorAll('.settle-candidate, .settle-unit')).toHaveLength(0)
    expect(page).toHaveAttribute('aria-busy', 'false')
  })

  it.each(['stop', 'error'] as const)('makes a %s distinguishable and permits inspection of the unfinished prefix', (type) => {
    const state = reduceSettle(forming(), type === 'stop' ? { type, atMs: 200 } : { type, atMs: 200, message: 'Connection lost' })
    const { container } = render(<SettleAnswer state={state} />)
    expect(screen.getByRole('region', { name: 'answer' }).textContent).toBe('')
    expect(screen.getByText('inspect unfinished text')).toBeInTheDocument()
    expect(container.querySelector('.settle-partial-text')?.textContent).toBe('A complete early sentence. ')
    expect(container.querySelector('.bubble-transfer, [data-pending], [data-arriving]')).toBeNull()
  })

  it('identifies an empty completed answer outside its exact-text region', () => {
    const state = reduceSettle(createSettleState('answer'), { type: 'finish', atMs: 100, tokenCount: 0 })
    render(<SettleAnswer state={state} />)
    expect(screen.getByRole('region', { name: 'answer' }).textContent).toBe('')
    expect(screen.getByText('the source returned an empty answer')).toBeInTheDocument()
  })

  it('consumes completion decoration once and never replays it for a motion toggle', () => {
    const initial = createSettleState('answer')
    const final = reduceSettle(initial, { type: 'snapshot', atMs: 100, final: true, text: 'An answer.' })
    const { container, rerender } = render(<SettleAnswer state={initial} />)
    rerender(<SettleAnswer state={final} />)
    const cue = container.querySelector('.bubble-transfer')
    expect(cue).not.toBeNull()
    fireEvent.animationEnd(cue!)
    expect(container.querySelector('.bubble-transfer, [data-arriving]')).toBeNull()
    rerender(<SettleAnswer state={final} motion={false} />)
    rerender(<SettleAnswer state={final} motion />)
    expect(container.querySelector('.bubble-transfer, [data-arriving]')).toBeNull()
    expect(screen.getByRole('region', { name: 'answer' }).textContent).toBe('An answer.')
  })

  it('does not play a delayed finish cue when motion is enabled after completion', () => {
    const initial = createSettleState('answer')
    const final = reduceSettle(initial, { type: 'snapshot', atMs: 100, final: true, text: 'Still readable.' })
    const { container, rerender } = render(<SettleAnswer state={initial} motion={false} />)
    rerender(<SettleAnswer state={final} motion={false} />)
    expect(container.querySelector('.bubble-transfer, [data-arriving]')).toBeNull()
    rerender(<SettleAnswer state={final} motion />)
    expect(container.querySelector('.bubble-transfer, [data-arriving]')).toBeNull()
  })
})

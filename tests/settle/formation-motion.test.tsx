import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'

beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

const sentence = () => reduceSettle(createSettleState('sentence', 4), {
  type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'One. ' }],
})
function finish(container: HTMLElement) {
  const transfer = container.querySelector('.bubble-transfer')
  expect(transfer).not.toBeNull()
  fireEvent.animationEnd(transfer!)
}

describe('released-batch material handover lifecycle', () => {
  it('hands over a released batch once despite later guesses and unrelated renders', () => {
    let state = sentence()
    const { container, rerender } = render(<SettleAnswer state={state} runId="first" />)
    const first = container.querySelector('[data-passage]')
    expect(first).toHaveAttribute('data-arriving', 'true')
    finish(container)
    expect(first).not.toHaveAttribute('data-arriving')
    state = reduceSettle(state, { type: 'draft', atMs: 200, guesses: [{ position: 2, text: ' blue', p: .9 }] })
    rerender(<SettleAnswer state={state} runId="first" />)
    rerender(<SettleAnswer state={state} runId="first" label="updated answer label" />)
    expect(container.querySelector('[data-passage]')).toBe(first)
    expect(first).not.toHaveAttribute('data-arriving')
    expect(first).not.toHaveAttribute('data-pending')
    expect(container.querySelector('.bubble-transfer')).toBeNull()
  })

  it('hands over simultaneous releases as one batch and keeps exact whitespace', () => {
    const state = reduceSettle(createSettleState('sentence', 4), {
      type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'One. ' }, { position: 1, text: 'Two. ' }],
    })
    const { container } = render(<SettleAnswer state={state} />)
    expect(container.querySelectorAll('[data-passage][data-arriving="true"]')).toHaveLength(2)
    expect(container.querySelectorAll('.bubble-transfer')).toHaveLength(1)
    expect(container.querySelector('.settle-page')?.textContent).toBe('One. Two. ')
    finish(container)
    expect(container.querySelectorAll('[data-arriving], [data-pending]')).toHaveLength(0)
  })

  it('a newer release settles the interrupted batch and animates only its own new passage', () => {
    let state = sentence()
    const { container, rerender } = render(<SettleAnswer state={state} />)
    const first = container.querySelector('[data-passage]'), firstTransfer = container.querySelector('.bubble-transfer')
    state = reduceSettle(state, { type: 'commit', atMs: 200, tokens: [{ position: 1, text: 'Two. ' }] })
    rerender(<SettleAnswer state={state} />)
    const passages = container.querySelectorAll('[data-passage]')
    expect(passages[0]).toBe(first)
    expect(first).not.toHaveAttribute('data-arriving')
    expect(first).not.toHaveAttribute('data-pending')
    expect(passages[1]).toHaveAttribute('data-arriving', 'true')
    expect(container.querySelector('.bubble-transfer')).not.toBe(firstTransfer)
    fireEvent.animationEnd(first!, { animationName: 'reading-ink-arrive' })
    expect(passages[1]).toHaveAttribute('data-arriving', 'true')
    finish(container)
    expect(container.querySelectorAll('[data-arriving], [data-pending]')).toHaveLength(0)
  })

  it.each(['paused', 'motion off'] as const)('reveals eligible text immediately under %s without replaying a handover on resume', (mode) => {
    let state = sentence()
    const { container, rerender } = render(<SettleAnswer state={state} />)
    expect(container.querySelector('.bubble-transfer')).not.toBeNull()
    rerender(<SettleAnswer state={state} paused={mode === 'paused'} motion={mode !== 'motion off'} />)
    expect(container.querySelectorAll('.bubble-transfer, [data-arriving], [data-pending]')).toHaveLength(0)
    state = reduceSettle(state, { type: 'commit', atMs: 200, tokens: [{ position: 1, text: 'Two. ' }] })
    rerender(<SettleAnswer state={state} paused={mode === 'paused'} motion={mode !== 'motion off'} />)
    expect(container.querySelector('.settle-page')?.textContent).toBe('One. Two. ')
    expect(container.querySelectorAll('[data-pending], [data-arriving]')).toHaveLength(0)
    rerender(<SettleAnswer state={state} />)
    expect(container.querySelector('.bubble-transfer')).toBeNull()
  })

  it.each(['word', 'sentence', 'paragraph'] as const)('keeps earlier %s passages stationary during a later release', (policy) => {
    let state = reduceSettle(createSettleState(policy), { type: 'commit', atMs: 1, tokens: [{ position: 0, text: 'One.\n\n' }] })
    const { container, rerender } = render(<SettleAnswer state={state} />)
    const first = [...container.querySelectorAll('[data-passage]')]
    finish(container)
    state = reduceSettle(state, { type: 'commit', atMs: 2, tokens: [{ position: 1, text: 'Two.\n\n' }] })
    rerender(<SettleAnswer state={state} />)
    for (const [index, passage] of first.entries()) {
      expect(container.querySelectorAll('[data-passage]')[index]).toBe(passage)
      expect(passage).not.toHaveAttribute('data-arriving')
      expect(passage).not.toHaveAttribute('data-pending')
    }
    expect(container.querySelectorAll('[data-arriving]').length).toBeGreaterThan(0)
  })

  it('starts a fresh handover for an explicit new run at the same source time', () => {
    const state = sentence()
    const { container, rerender } = render(<SettleAnswer state={state} runId="first" />)
    const original = container.querySelector('[data-passage]')
    finish(container)
    rerender(<SettleAnswer state={state} runId="second" />)
    expect(container.querySelector('[data-passage]')).not.toBe(original)
    expect(container.querySelector('[data-passage]')).toHaveAttribute('data-arriving', 'true')
    expect(container.querySelectorAll('.bubble-transfer')).toHaveLength(1)
  })

  it('a final source event with no new words fades only the remaining material', () => {
    let state = sentence()
    const { container, rerender } = render(<SettleAnswer state={state} />)
    const passage = container.querySelector('[data-passage]')
    finish(container)
    state = reduceSettle(state, { type: 'finish', atMs: 200, tokenCount: 1 })
    rerender(<SettleAnswer state={state} />)
    expect(container.querySelector('[data-passage]')).toBe(passage)
    expect(passage).not.toHaveAttribute('data-arriving')
    expect(passage).not.toHaveAttribute('data-pending')
    expect(container.querySelector('.settle')).toHaveAttribute('data-answer-phase', 'revealing')
    finish(container)
    expect(container.querySelector('.settle')).toHaveAttribute('data-visual-ready', 'true')
    expect(container.querySelector('.ambient-composition')).toBeNull()
  })

  it('a source finish during an underallocated release preserves the original fit deadline and completion callback', () => {
    const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate')
    const animations: { duration: number; onfinish: (() => void) | null; cancel: ReturnType<typeof vi.fn> }[] = []
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const bounds = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const height = this.classList.contains('settle-page') ? (this.textContent ? 240 : 0) : 120
      return new DOMRect(0, 0, 200, height)
    })
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: (...args: unknown[]) => {
      const animation = { duration: Number((args[1] as KeyframeAnimationOptions).duration), onfinish: null, cancel: vi.fn() }
      animations.push(animation)
      return animation
    } })
    try {
      let state = createSettleState('sentence', 4)
      const { container, rerender, unmount } = render(<SettleAnswer state={state} />)
      state = reduceSettle(state, { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'One. ' }] })
      rerender(<SettleAnswer state={state} />)
      expect(container.querySelector('.settle')).toHaveAttribute('data-answer-phase', 'fitting')
      const interrupted = animations.at(-1)!
      expect(interrupted.duration).toBe(180)
      now = 70
      state = reduceSettle(state, { type: 'finish', atMs: 101, tokenCount: 1 })
      rerender(<SettleAnswer state={state} />)
      expect(interrupted.cancel).toHaveBeenCalled()
      expect(animations.at(-1)).not.toBe(interrupted)
      expect(animations.at(-1)!.duration).toBe(110)
      act(() => animations.at(-1)!.onfinish?.())
      expect(container.querySelector('.settle')).toHaveAttribute('data-answer-phase', 'revealing')
      finish(container)
      expect(container.querySelector('.settle')).toHaveAttribute('data-visual-ready', 'true')
      expect(container.querySelector('.settle-page')?.textContent).toBe('One. ')
      unmount()
    } finally {
      bounds.mockRestore()
      if (originalAnimate) Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate)
      else Reflect.deleteProperty(HTMLElement.prototype, 'animate')
    }
  })

  it('clears the missing-animation-event fallback when unmounted', () => {
    const { unmount } = render(<SettleAnswer state={sentence()} />)
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['stop', 'error'] as const)('a source %s ends an active handover without hiding released text', (type) => {
    let state = sentence()
    const { container, rerender } = render(<SettleAnswer state={state} />)
    state = reduceSettle(state, type === 'stop' ? { type, atMs: 200 } : { type, atMs: 200, message: 'Connection lost' })
    rerender(<SettleAnswer state={state} />)
    expect(container.querySelector('.settle-page')?.textContent).toBe('One. ')
    expect(container.querySelectorAll('.bubble-transfer, [data-arriving], [data-pending], .ambient-composition')).toHaveLength(0)
    expect(container.querySelector('.settle')).toHaveAttribute('data-active', 'false')
  })
})

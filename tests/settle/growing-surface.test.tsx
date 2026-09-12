import { act, cleanup, render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { useReadingSurface } from '@/components/settle/use-reading-surface'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'
import type { SettleState } from '@/lib/settle/types'

beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('coarse waiting capacity and capture ordering', () => {
  it.each(['commit', 'snapshot'] as const)('samples only current %s content for coarse growth and keeps unreleased words out of the page', (source) => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) { return new DOMRect(0, 0, 200, this.classList.contains('settle-page') ? 0 : 120) })
    let state = createSettleState('answer')
    const { container, rerender } = render(<SettleAnswer state={state} />)
    const shown = () => container.querySelectorAll('.ambient-composition__bar[data-shown="true"]').length
    const widths = () => [...container.querySelectorAll<HTMLElement>('.ambient-composition__bar')].map((row) => row.style.getPropertyValue('--ambient-width'))
    const initialWidths = widths()
    expect(shown()).toBe(5)
    state = reduceSettle(state, source === 'snapshot' ? { type: 'snapshot', atMs: 1, text: 'W'.repeat(500), final: false } : { type: 'commit', atMs: 1, tokens: [{ position: 30, text: 'W'.repeat(500) }] })
    rerender(<SettleAnswer state={state} />)
    expect(shown()).toBe(5)
    act(() => vi.advanceTimersByTime(600))
    expect(shown()).toBe(14)
    expect(widths()).toEqual(initialWidths)
    expect(container.querySelector('.settle-page')!.textContent).toBe('')
    if (source === 'snapshot') {
      state = reduceSettle(state, { type: 'snapshot', atMs: 2, text: 'x', final: false })
      rerender(<SettleAnswer state={state} />)
      act(() => vi.advanceTimersByTime(600))
      expect(shown()).toBe(14)
    }
  })

  it('keeps the old tail position through new eligibility until its cells are captured', () => {
    let current: ReturnType<typeof useReadingSurface>
    function Harness({ state }: { state: SettleState }) {
      const frameRef = useRef<HTMLDivElement>(null), pageRef = useRef<HTMLDivElement>(null)
      current = useReadingSurface({ state, runId: 'capture', frameRef, pageRef, effectiveMotion: true })
      return <div ref={frameRef} data-frame><div ref={pageRef} data-page>{state.passages.map((passage) => passage.text).join('')}</div><output>{current.tailOffset}</output></div>
    }
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) { return new DOMRect(0, 0, 200, this.hasAttribute('data-page') ? (this.textContent ? 48 : 0) : 120) })
    let state = createSettleState('sentence')
    const { rerender } = render(<Harness state={state} />)
    expect(current!.tailOffset).toBe(0)
    state = reduceSettle(state, { type: 'commit', atMs: 1, tokens: [{ position: 0, text: 'A sentence. ' }] })
    rerender(<Harness state={state} />)
    expect(current!.phase).toBe('revealing')
    expect(current!.tailOffset).toBe(0)
    expect(current!.rowCount).toBe(5)
    act(() => current!.advanceWaitingField(current!.arrivalKey!))
    expect(current!.tailOffset).toBeGreaterThan(48)
    expect(current!.rowCount).toBeGreaterThanOrEqual(4)
    act(() => current!.finishHandover(current!.arrivalKey!))
    expect(current!.phase).toBe('waiting')
  })

  it('keeps residual space until the final field fade finishes, then contracts for180ms after ink is ready', () => {
    let current: ReturnType<typeof useReadingSurface>
    function Harness({ state }: { state: SettleState }) {
      const frameRef = useRef<HTMLDivElement>(null), pageRef = useRef<HTMLDivElement>(null)
      current = useReadingSurface({ state, runId: 'contraction', frameRef, pageRef, effectiveMotion: true })
      return <div ref={frameRef} data-frame><div ref={pageRef} data-page>{state.passages.map((passage) => passage.text).join('')}</div></div>
    }
    const animations: { target: number; duration: number }[] = []
    const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate')
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return new DOMRect(0, 0, 200, this.hasAttribute('data-page') ? (this.textContent ? 48 : 0) : parseFloat(this.style.height) || 120)
    })
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: (frames: { height: string }[], options: KeyframeAnimationOptions) => {
      animations.push({ target: parseFloat(frames[1]!.height), duration: Number(options.duration) })
      return { cancel: vi.fn(), onfinish: null }
    } })
    try {
      let state = reduceSettle(createSettleState('sentence'), { type: 'commit', atMs: 1, tokens: [{ position: 0, text: 'Released. ' }] })
      const { rerender, unmount } = render(<Harness state={state} />)
      act(() => { current!.advanceWaitingField(current!.arrivalKey!); current!.finishHandover(current!.arrivalKey!) })
      const beforeFinal = animations.length
      state = reduceSettle(state, { type: 'finish', atMs: 2, tokenCount: 1 })
      rerender(<Harness state={state} />)
      expect(current!.phase).toBe('revealing')
      expect(animations.slice(beforeFinal).some((animation) => animation.target === 48)).toBe(false)
      act(() => current!.finishHandover(current!.arrivalKey!))
      expect(current!.phase).toBe('ready')
      expect(animations.at(-1)).toEqual({ target: 48, duration: 180 })
      unmount()
    } finally {
      if (originalAnimate) Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate)
      else Reflect.deleteProperty(HTMLElement.prototype, 'animate')
    }
  })

})

import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRef } from 'react'
import { estimateAnswerEnvelope } from '@/lib/settle/answer-envelope'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'
import { useAnswerEnvelope } from '@/components/settle/use-answer-envelope'
import type { SettleState } from '@/lib/settle/types'

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'animate')
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, 'animate', originalAnimate)
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate')
})

describe('causal answer envelope estimate', () => {
  it('uses sparse commitments without consulting prefix, guesses, capacity or future answer fields', () => {
    const input = { tokens: { 8: { position: 8, text: 'abc' }, 12: { position: 12, text: 'def' } } }
    for (const name of ['prefix', 'drafts', 'spins', 'bound', 'receivedCount', 'answer', 'words', 'events']) {
      Object.defineProperty(input, name, { get: () => { throw Error(`Read forbidden ${name}`) } })
    }
    expect(estimateAnswerEnvelope(input, 10, (text) => text.length * 10)).toEqual({ rowCount: 8, knownAdvancePx: 60, knownNewlines: 0, committedFragments: 2 })
  })

  it('ignores the earliest committed EOS and every later token, including earlier-than-prefix padding', () => {
    const measure = vi.fn((text: string) => text.length * 10)
    const result = estimateAnswerEnvelope({ tokens: {
      0: { position: 0, text: 'hello' },
      3: { position: 3, text: '<|im_end|>', end: true },
      9: { position: 9, text: '<|endoftext|>', end: true },
      5: { position: 5, text: 'must not measure' },
    } }, 100, measure)
    expect(measure.mock.calls).toEqual([['hello']])
    expect(result.committedFragments).toBe(1)
    expect(result.knownAdvancePx).toBe(50)
  })

  it('counts known line breaks and applies the specified slack without counting breaks as ink', () => {
    const measure = vi.fn((text: string) => text.length * 10)
    expect(estimateAnswerEnvelope({ tokens: { 0: { position: 0, text: 'ab\r\ncd\nef\rgh' } } }, 20, measure))
      .toEqual({ rowCount: 7, knownAdvancePx: 80, knownNewlines: 3, committedFragments: 1 })
    expect(measure.mock.calls).toEqual([['ab'], ['cd'], ['ef'], ['gh']])
  })

  it('keeps five initial rows, caps speculative growth at fourteen, and handles unavailable widths', () => {
    expect(estimateAnswerEnvelope({ tokens: {} }, 100, () => 0).rowCount).toBe(5)
    const state = { tokens: { 0: { position: 0, text: 'long' } } }
    expect(estimateAnswerEnvelope(state, 10, () => 10000).rowCount).toBe(14)
    for (const width of [0, -1, NaN, Infinity]) expect(estimateAnswerEnvelope(state, width, () => 10000).rowCount).toBe(5)
    expect(estimateAnswerEnvelope(state, 100, () => NaN).rowCount).toBe(5)
  })
})

type MockAnimation = { cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null; duration: number }
function mockLayout() {
  const animations: MockAnimation[] = []
  let width = 200
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const height = this.dataset.envelopePage !== undefined ? Number(this.dataset.naturalHeight ?? 0) : parseFloat(this.style.height) || 120
    return { x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height, toJSON() {} }
  })
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, writable: true, value: vi.fn((_frames, options) => {
    const animation: MockAnimation = { cancel: vi.fn(), onfinish: null, duration: options.duration }
    animations.push(animation)
    return animation as unknown as Animation
  }) })
  return { animations, setWidth: (next: number) => { width = next } }
}

function Harness({ state, runId = 'one', motion = true, naturalHeight = 0 }: { state: SettleState; runId?: string; motion?: boolean; naturalHeight?: number }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const envelope = useAnswerEnvelope({ state, runId, frameRef, pageRef, effectiveMotion: motion })
  return <div ref={frameRef} data-testid="frame" data-phase={envelope.phase} data-rows={envelope.rowCount} data-arrival={envelope.arrivalKey ?? ''}>
    <div ref={pageRef} data-envelope-page data-natural-height={naturalHeight} style={{ fontSize: 16, lineHeight: '24px', fontFamily: 'sans-serif' }} />
  </div>
}

const complete = (): SettleState => ({ ...createSettleState('answer'), status: 'complete', prefix: 'answer', releasedLength: 6 })

describe('answer envelope lifecycle', () => {
  it('sizes from the latest provisional snapshot while holding a waiting maximum and preserving source finality', () => {
    mockLayout()
    let state = createSettleState('answer')
    const { getByTestId, rerender } = render(<Harness state={state} motion={false} />)
    const frame = getByTestId('frame')
    expect(frame).toHaveAttribute('data-rows', '5')
    state = reduceSettle(state, { type: 'snapshot', atMs: 100, text: '**Answer** = 39', final: false })
    rerender(<Harness state={state} motion={false} />)
    expect(frame).toHaveAttribute('data-rows', '5')
    state = reduceSettle(state, { type: 'snapshot', atMs: 200, text: `**Answer** = 36\n${'a'.repeat(150)}`, final: false })
    rerender(<Harness state={state} motion={false} />)
    const maximum = Number(frame.dataset.rows)
    expect(maximum).toBeGreaterThan(5)
    expect(maximum).toBeLessThanOrEqual(14)
    expect(parseFloat(frame.style.height)).toBe(maximum * 24)
    state = reduceSettle(state, { type: 'snapshot', atMs: 300, text: '**Answer** = 39', final: false })
    rerender(<Harness state={state} motion={false} />)
    expect(frame).toHaveAttribute('data-rows', String(maximum))
    expect(frame).toHaveAttribute('data-phase', 'waiting')
    expect(frame).toHaveAttribute('data-arrival', '')
    expect(state.passages).toEqual([])
    state = reduceSettle(state, { type: 'snapshot', atMs: 400, text: 'Final answer: 39.', final: true })
    rerender(<Harness state={state} motion={false} naturalHeight={24} />)
    expect(frame).toHaveAttribute('data-phase', 'ready')
    expect(frame.style.height).toBe('24px')
    expect(state.passages).toHaveLength(1)
  })

  it('does not inspect a whole-snapshot candidate when the source supplies commitments', () => {
    mockLayout()
    const state = reduceSettle(createSettleState('answer'), { type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'A little committed ink.' }] })
    Object.defineProperty(state, 'snapshotCandidate', { get: () => { throw Error('Candidate accessed on a commitment stream') } })
    const { getByTestId } = render(<Harness state={state} motion={false} />)
    expect(getByTestId('frame')).toHaveAttribute('data-rows', '5')
  })

  it('ignores frame-height-only observer reports while responding to changed natural page geometry', () => {
    mockLayout()
    let callback: ResizeObserverCallback = () => {}
    vi.stubGlobal('ResizeObserver', class {
      constructor(next: ResizeObserverCallback) { callback = next }
      observe() {}
      disconnect() {}
    })
    const { getByTestId } = render(<Harness state={createSettleState('answer')} />)
    const frame = getByTestId('frame'), page = frame.firstElementChild!
    const report = (element: Element, width: number, height: number) => {
      const entry = { target: element, contentRect: { width, height } } as ResizeObserverEntry
      act(() => callback([entry], {} as ResizeObserver))
    }
    report(frame, 200, 120)
    report(page, 200, 0)
    const bounds = vi.mocked(HTMLElement.prototype.getBoundingClientRect)
    bounds.mockClear()
    report(frame, 200, 130)
    report(frame, 200, 160)
    expect(bounds).not.toHaveBeenCalled()
    report(page, 200, 24)
    expect(bounds).toHaveBeenCalled()
  })

  it('preserves the waiting maximum until a real width change allows a smaller estimate', () => {
    const layout = mockLayout()
    const initial = createSettleState('answer')
    const large = { ...initial, tokens: { 0: { position: 0, text: 'a'.repeat(150) } } }
    const { getByTestId, rerender } = render(<Harness state={large} motion={false} />)
    const frame = getByTestId('frame')
    expect(Number(frame.dataset.rows)).toBeGreaterThan(5)
    const previous = frame.dataset.rows
    rerender(<Harness state={initial} motion={false} />)
    expect(frame.dataset.rows).toBe(previous)
    layout.setWidth(400)
    rerender(<Harness state={{ ...initial }} motion={false} />)
    expect(frame).toHaveAttribute('data-rows', '5')
  })

  it('fits an undersized final answer for one authored 180 ms then enables one arrival', () => {
    const { animations } = mockLayout()
    const { getByTestId, rerender } = render(<Harness state={createSettleState('answer')} />)
    rerender(<Harness state={complete()} naturalHeight={240} />)
    expect(getByTestId('frame')).toHaveAttribute('data-phase', 'fitting')
    expect(getByTestId('frame')).toHaveAttribute('data-arrival', '')
    expect(animations.at(-1)?.duration).toBe(180)
    act(() => animations.at(-1)?.onfinish?.())
    expect(getByTestId('frame')).toHaveAttribute('data-phase', 'ready')
    expect(getByTestId('frame')).toHaveAttribute('data-arrival', 'one:v0')
  })

  it('a new run invalidates old fit callbacks', () => {
    const { animations } = mockLayout()
    const { getByTestId, rerender } = render(<Harness state={createSettleState('answer')} />)
    rerender(<Harness state={complete()} naturalHeight={240} />)
    const stale = animations.at(-1)!.onfinish!
    rerender(<Harness state={createSettleState('answer')} runId="two" />)
    act(stale)
    expect(getByTestId('frame')).toHaveAttribute('data-phase', 'waiting')
    expect(getByTestId('frame')).toHaveAttribute('data-rows', '5')
    expect(getByTestId('frame')).toHaveAttribute('data-arrival', '')
  })

  it('motion-off during fitting shows exact height immediately and cannot replay a deferred cue', () => {
    const { animations } = mockLayout()
    const state = complete()
    const { getByTestId, rerender } = render(<Harness state={createSettleState('answer')} />)
    rerender(<Harness state={state} naturalHeight={240} />)
    const stale = animations.at(-1)!.onfinish!
    rerender(<Harness state={state} naturalHeight={240} motion={false} />)
    expect(getByTestId('frame')).toHaveAttribute('data-phase', 'ready')
    expect(getByTestId('frame').style.height).toBe('240px')
    act(stale)
    rerender(<Harness state={state} naturalHeight={240} />)
    expect(getByTestId('frame')).toHaveAttribute('data-arrival', '')
  })

  it('a layout change during fitting jumps to its corrected height without extending the visual wait', () => {
    const { animations, setWidth } = mockLayout()
    const state = complete()
    const { getByTestId, rerender } = render(<Harness state={createSettleState('answer')} />)
    rerender(<Harness state={state} naturalHeight={240} />)
    const stale = animations.at(-1)!.onfinish!
    setWidth(120)
    rerender(<Harness state={{ ...state }} naturalHeight={360} />)
    expect(getByTestId('frame')).toHaveAttribute('data-phase', 'ready')
    expect(getByTestId('frame').style.height).toBe('360px')
    expect(animations).toHaveLength(1)
    act(stale)
    expect(getByTestId('frame')).toHaveAttribute('data-arrival', 'one:v0')
  })

  it('empty completion and stopped/error states collapse without a cue; revision preserves the previous answer', () => {
    mockLayout()
    const initial = createSettleState('answer')
    const { getByTestId, rerender } = render(<Harness state={initial} motion={false} />)
    for (const status of ['complete', 'stopped', 'error'] as const) {
      rerender(<Harness state={{ ...initial, status }} motion={false} />)
      expect(getByTestId('frame').style.height).toBe('0px')
      expect(getByTestId('frame')).toHaveAttribute('data-arrival', '')
    }
    rerender(<Harness state={{ ...complete(), status: 'revision' }} naturalHeight={144} />)
    expect(getByTestId('frame')).toHaveAttribute('data-phase', 'ready')
    expect(getByTestId('frame').style.height).toBe('144px')
    expect(getByTestId('frame')).toHaveAttribute('data-arrival', '')
  })
})

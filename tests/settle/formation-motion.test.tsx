import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'

type ObservedAnimation = {
  element: Element
  frames: Keyframe[]
  options: KeyframeAnimationOptions
  animation: { cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }
}

const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, 'animate')
let observed: ObservedAnimation[]

beforeEach(() => {
  observed = []
  // jsdom has no compositor. Observe the public WAAPI boundary while rendering
  // actual state transitions; geometry and painted behavior have separate QA.
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value(this: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
      const animation = { cancel: vi.fn(), onfinish: null }
      observed.push({ element: this, frames, options, animation })
      return animation as unknown as Animation
    },
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  if (originalAnimate) Object.defineProperty(Element.prototype, 'animate', originalAnimate)
  else Reflect.deleteProperty(Element.prototype, 'animate')
})

const sentence = () => reduceSettle(createSettleState('sentence', 4), {
  type: 'commit', atMs: 100, tokens: [{ position: 0, text: 'One. ' }],
})
const forText = (text: string) => observed.filter(({ element }) => element.textContent === text)

describe('formation motion lifecycle', () => {
  it('acknowledges a released range once despite later guesses and unrelated renders', () => {
    let state = sentence()
    const { rerender } = render(<SettleAnswer state={state} runId="first" />)
    const first = forText('One.')
    expect(first).toHaveLength(1)
    state = reduceSettle(state, { type: 'draft', atMs: 200, guesses: [{ position: 2, text: ' blue', p: .9 }] })
    rerender(<SettleAnswer state={state} runId="first" />)
    rerender(<SettleAnswer state={state} runId="first" label="updated answer label" />)
    expect(forText('One.')).toHaveLength(1)
    expect(first[0]!.animation.cancel).not.toHaveBeenCalled()
  })

  it('starts all words from one release batch without a reading-order delay', () => {
    const state = reduceSettle(createSettleState('sentence', 4), {
      type: 'commit', atMs: 100,
      tokens: [{ position: 0, text: 'One. ' }, { position: 1, text: 'Two. ' }],
    })
    const { container } = render(<SettleAnswer state={state} />)
    const responses = [...forText('One.'), ...forText('Two.')]
    expect(responses).toHaveLength(2)
    for (const response of responses) {
      expect(response.options.delay ?? 0).toBe(0)
      // The response cannot create a period of unreadable committed text.
      expect(response.frames.every((frame) => frame.opacity === undefined && frame.filter === undefined)).toBe(true)
    }
    expect(container.querySelector('.settle-page')?.textContent).toBe('One. Two. ')
  })

  it.each(['paused', 'motion off'] as const)('cancels active feedback under %s without queuing it on resume', (mode) => {
    let state = sentence()
    const { rerender } = render(<SettleAnswer state={state} />)
    const first = forText('One.')[0]!
    expect(first).toBeDefined()
    rerender(<SettleAnswer state={state} paused={mode === 'paused'} motion={mode !== 'motion off'} />)
    expect(first.animation.cancel).toHaveBeenCalledTimes(1)
    state = reduceSettle(state, { type: 'draft', atMs: 200, guesses: [{ position: 2, text: ' blue', p: .9 }] })
    rerender(<SettleAnswer state={state} paused={mode === 'paused'} motion={mode !== 'motion off'} />)
    rerender(<SettleAnswer state={state} />)
    expect(forText('One.')).toHaveLength(1)
  })

  it('starts a new response for an explicit new run at the same source timestamp', () => {
    const state = sentence()
    const { rerender } = render(<SettleAnswer state={state} runId="first" />)
    const first = forText('One.')[0]!
    rerender(<SettleAnswer state={state} runId="second" />)
    expect(first.animation.cancel).toHaveBeenCalledTimes(1)
    expect(forText('One.')).toHaveLength(2)
  })

  it('cancels its animation handles when the answer unmounts', () => {
    const { unmount } = render(<SettleAnswer state={sentence()} />)
    expect(observed.length).toBeGreaterThan(0)
    unmount()
    for (const { animation } of observed) expect(animation.cancel).toHaveBeenCalledTimes(1)
  })

  it('preserves each committed token and its ink through a multi-token word merge', () => {
    let state = reduceSettle(createSettleState('sentence', 4), {
      type: 'commit', atMs: 100,
      tokens: [{ position: 0, text: 'inter' }, { position: 1, text: 'nation' }],
    })
    const { container, rerender } = render(<SettleAnswer state={state} />)
    const unit = container.querySelector('[data-pos="1"]')
    const ink = unit?.querySelector('.settle-ink')
    expect(unit).not.toBeNull()
    expect(ink).not.toBeNull()
    state = reduceSettle(state, { type: 'commit', atMs: 200, tokens: [{ position: 2, text: 'al ' }] })
    rerender(<SettleAnswer state={state} />)
    expect(container.querySelector('[data-pos="1"]')).toBe(unit)
    expect(unit?.querySelector('.settle-ink')).toBe(ink)
    expect(container.querySelector('.settle-page')?.textContent).toBe('international ')
    expect(forText('nation')).toHaveLength(1)
  })

  it.each([0, 8])('ends provisional spatial motion at release even with a %i px target change', (releaseShift) => {
    let blueX = 24
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const left = this.textContent === 'Blue' && this.hasAttribute('data-layout') ? blueX : 0
      return {
        x: left, y: 0, left, top: 0, right: left + 40, bottom: 20,
        width: 40, height: 20, toJSON: () => ({}),
      }
    })
    let state = reduceSettle(createSettleState('paragraph', 4), {
      type: 'commit', atMs: 100, tokens: [{ position: 1, text: ' Blue ' }],
    })
    const { container, rerender } = render(<SettleAnswer state={state} />)
    blueX = 48
    state = reduceSettle(state, { type: 'commit', atMs: 200, tokens: [{ position: 0, text: 'The ' }] })
    rerender(<SettleAnswer state={state} />)
    const transforms = () => forText('Blue').filter(({ frames }) => frames.some((frame) => frame.transform !== undefined))
    expect(transforms()).toHaveLength(1)
    const glide = transforms()[0]!
    expect(glide.animation.cancel).not.toHaveBeenCalled()
    expect(state.releasedLength).toBe(0)

    blueX += releaseShift
    state = reduceSettle(state, { type: 'commit', atMs: 300, tokens: [{ position: 2, text: '\n\n' }] })
    rerender(<SettleAnswer state={state} />)
    expect(state.releasedLength).toBeGreaterThan(0)
    expect(container.querySelector('[data-pos="1"] .settle-ink')).toHaveAttribute('data-released', 'true')
    expect(glide.animation.cancel).toHaveBeenCalledTimes(1)
    expect(transforms()).toHaveLength(1)
    expect(container.querySelector('.settle-page')?.textContent).toBe('The  Blue \n\n')
  })
})

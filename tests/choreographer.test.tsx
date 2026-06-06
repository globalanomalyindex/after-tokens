import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDiffusionChoreography } from '@/lib/diffusion/choreographer'
import { mycelium } from '@/lib/diffusion/modes/mycelium'

const measure = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    index: i,
    lineIndex: 0,
    bbox: { x: i * 30, y: 0, w: 28, h: 20 },
  }))

describe('useDiffusionChoreography', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('initial state: all words pending, progress 0', () => {
    const { result } = renderHook(() =>
      useDiffusionChoreography({ words: measure(3), strategy: mycelium, trigger: 'manual' }),
    )
    expect(result.current.progress.get()).toBe(0)
    expect(result.current.wordStates.get(0)).toBe('pending')
  })

  it('play() advances states past the pre-roll', () => {
    const { result } = renderHook(() =>
      useDiffusionChoreography({ words: measure(3), strategy: mycelium, trigger: 'manual' }),
    )
    act(() => {
      result.current.play()
    })
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    // Mycelium locks words in a text-seeded order, so we can't assume which
    // specific index has resolved by t=2000. After 2000ms (past pre-roll +
    // first lock), at least one word should be non-pending.
    const states = Array.from(result.current.wordStates.values())
    expect(states.some((s) => s !== 'pending')).toBe(true)
  })

  it('isComplete flips true after totalDuration', () => {
    const { result } = renderHook(() =>
      useDiffusionChoreography({ words: measure(3), strategy: mycelium, trigger: 'manual' }),
    )
    act(() => {
      result.current.play()
    })
    act(() => {
      vi.advanceTimersByTime(mycelium.totalDuration(measure(3)) + 100)
    })
    expect(result.current.isComplete).toBe(true)
  })
})

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AmbientComposition, type AmbientCondition } from '@/components/settle/ambient-composition'

afterEach(cleanup)

describe('the authored ambient composition', () => {
  it('preserves animated nodes through pauses and growing capacity exposure', () => {
    const { container, rerender } = render(<AmbientComposition active motion complete={false} runId="run" />)
    const composition = container.firstElementChild
    const bars = [...container.querySelectorAll('.ambient-composition__bar')]
    rerender(<AmbientComposition active={false} motion complete={false} runId="run" />)
    expect(container.firstElementChild).toBe(composition)
    expect(composition).toHaveAttribute('data-active', 'false')
    rerender(<AmbientComposition active motion={false} complete={false} runId="run" />)
    expect(composition).toHaveAttribute('data-motion', 'off')
    rerender(<AmbientComposition active motion complete={false} runId="run" rowCount={9} lineHeightPx={26} barHeightPx={14.4} />)
    expect(container.querySelectorAll('.ambient-composition__bar[data-shown="true"]')).toHaveLength(9)
    expect([...container.querySelectorAll('.ambient-composition__bar')]).toEqual(bars)
    bars.forEach((bar, index) => expect(container.querySelectorAll('.ambient-composition__bar')[index]).toBe(bar))
  })

  it('changes animation identity only for an explicit new run', () => {
    const { container, rerender } = render(<AmbientComposition active motion complete={false} runId="first" />)
    const first = container.querySelector('.ambient-composition__ink')
    rerender(<AmbientComposition active motion complete={false} runId="second" />)
    expect(first?.isConnected).toBe(false)
    expect(container.querySelector('.ambient-composition__ink')).not.toBe(first)
  })

  it('uses identical authored geometry in every comparison condition', () => {
    const { container, rerender } = render(<AmbientComposition active motion complete={false} runId="run" />)
    const shape = () => [...container.querySelectorAll('.ambient-composition__bar')].map((bar) => bar.getAttribute('style'))
    const initial = shape()
    expect(initial).toHaveLength(14)
    expect(container.querySelectorAll('.ambient-composition__bar[data-shown="true"]')).toHaveLength(5)
    for (const condition of ['static', 'breathe', 'reshape'] satisfies AmbientCondition[]) {
      rerender(<AmbientComposition active motion complete={false} condition={condition} runId="run" />)
      expect(shape()).toEqual(initial)
      expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
      expect(container.textContent).toBe('')
    }
  })

  it('removes every animated bar immediately on completion with no dissipation timer', () => {
    const { container, rerender } = render(<AmbientComposition active motion complete={false} runId="run" />)
    const bars = [...container.querySelectorAll('.ambient-composition__bar')]
    rerender(<AmbientComposition active motion complete runId="run" />)
    expect(container.childElementCount).toBe(0)
    bars.forEach((bar) => expect(bar.isConnected).toBe(false))
  })
})

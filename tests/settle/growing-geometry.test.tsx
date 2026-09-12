import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AmbientComposition } from '@/components/settle/ambient-composition'
import { createGrowingRows, growingRowAt } from '@/lib/settle/growing-geometry'

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('ambient activity lifecycle', () => {
  it('ignores changing source profiles in both intro endpoints and persistent cell targets', () => {
    const props = { active: true, motion: true, complete: false, runId: 'intro', profile: [.4, .7] }
    const { container, rerender } = render(<AmbientComposition {...props} />)
    const division = container.querySelector<HTMLElement>('[data-division-cell="0"]')!
    const initialWidth = division.style.getPropertyValue('--division-width')
    const originalTargets = [...container.querySelectorAll('[data-pill]')].map((pill) => pill.getAttribute('style'))
    expect(division.style.getPropertyValue('--division-width')).toBe(initialWidth)
    rerender(<AmbientComposition {...props} profile={[.8, .3]} />)
    expect(container.querySelector('[data-division-cell="0"]')).toBe(division)
    expect(division.style.getPropertyValue('--division-width')).toBe(initialWidth)
    expect(parseFloat(container.querySelector<HTMLElement>('.ambient-composition__bar')!.style.getPropertyValue('--ambient-width'))).toBeCloseTo(parseFloat(initialWidth), 5)
    expect([...container.querySelectorAll('[data-pill]')].map((pill) => pill.getAttribute('style'))).toEqual(originalTargets)
  })

  it('pauses in-flight transitions, including an unrelated rerender while inactive', () => {
    const props = { active: true, motion: true, complete: false, runId: 'pause', profile: [.4, .7] }
    const { container, rerender } = render(<AmbientComposition {...props} />)
    const element = container.querySelector('[data-ambient-composition]')!
    const transition = () => ({ transitionProperty: 'width', playState: 'running', pause: vi.fn(function (this: { playState: string }) { this.playState = 'paused' }), play: vi.fn(function (this: { playState: string }) { this.playState = 'running' }) })
    const first = transition(), later = transition()
    const animations = [first]
    Object.defineProperty(element, 'getAnimations', { value: () => animations })
    rerender(<AmbientComposition {...props} active={false} />)
    expect(first.playState).toBe('paused')
    animations.push(later)
    rerender(<AmbientComposition {...props} active={false} profile={[.8, .3]} />)
    expect(later.playState).toBe('paused')
    rerender(<AmbientComposition {...props} />)
    expect(first.playState).toBe('running')
    expect(later.playState).toBe('running')
  })

  it('retains cell identities, pauses its local clock, and never puts source words in ornament DOM', () => {
    vi.useFakeTimers()
    const props = { active: true, motion: true, complete: false, runId: 'one', profile: [.4, .7] }
    const { container, rerender } = render(<AmbientComposition {...props} />)
    const before = [...container.querySelectorAll('[data-pill]')]
    const composition = container.querySelector('[data-ambient-composition]')!
    expect(composition).toHaveAttribute('data-material', 'growing-cell-skeleton-v8')
    act(() => vi.advanceTimersByTime(1000))
    expect(composition).toHaveAttribute('data-activity-ms', '1000')
    expect([...container.querySelectorAll('[data-pill]')]).toEqual(before)
    rerender(<AmbientComposition {...props} active={false} />)
    act(() => vi.advanceTimersByTime(2000))
    expect(composition).toHaveAttribute('data-activity-ms', '1000')
    rerender(<AmbientComposition {...props} />)
    act(() => vi.advanceTimersByTime(200))
    expect(composition).toHaveAttribute('data-activity-ms', '1200')
    expect(composition.textContent).toBe('')
    rerender(<AmbientComposition {...props} runId="two" />)
    expect(container.querySelector('[data-ambient-composition]')).toHaveAttribute('data-activity-ms', '0')
  })
})


describe('the growing line-led material', () => {
  it('preserves score phase on tempo changes and applies the new rate only to future ticks', () => {
    vi.useFakeTimers()
    const props = { active: true, motion: true, complete: false, runId: 'tempo', tempo: 1 }
    const { container, rerender } = render(<AmbientComposition {...props} />)
    act(() => vi.advanceTimersByTime(2000))
    const root = container.querySelector('[data-ambient-composition]')!
    const targets = () => [...container.querySelectorAll('[data-pill]')].map((cell) => cell.getAttribute('style'))
    const before = targets()
    expect(root).toHaveAttribute('data-score-ms', '2000')
    rerender(<AmbientComposition {...props} tempo={.7} />)
    expect(root).toHaveAttribute('data-score-ms', '2000')
    expect(targets()).toEqual(before)
    act(() => vi.advanceTimersByTime(200))
    expect(root).toHaveAttribute('data-score-ms', '2140')
    rerender(<AmbientComposition {...props} tempo={1.4} />)
    expect(root).toHaveAttribute('data-score-ms', '2140')
    act(() => vi.advanceTimersByTime(200))
    expect(root).toHaveAttribute('data-score-ms', '2420')
  })

})

describe('larger long-bar proportions', () => {
  it('keeps fourteen stable row identities with two quiet full bars in each five-row group', () => {
    for (const seed of ['one', 'two']) {
      const rows = createGrowingRows(seed)
      expect(rows).toHaveLength(14)
      expect(rows).toEqual(createGrowingRows(seed))
      for (const row of rows) {
        const quiet = row.index % 5 === 0 || row.index % 5 === 2
        expect(row.count).toBe(quiet ? 1 : 3)
        const before = growingRowAt(row, 0), later = growingRowAt(row, row.periodMs - row.phaseMs + .01)
        expect(before.pills).toHaveLength(row.count)
        if (quiet) expect(before).toEqual(later)
        else expect(before.pills).not.toEqual(later.pills)
      }
    }
  })

  it('keeps targets identical between independently timed cues so each ease can finish', () => {
    for (const row of createGrowingRows('holds').filter((item) => item.count > 1)) {
      expect(row.transitionMs).toBeGreaterThanOrEqual(1300)
      expect(row.transitionMs).toBeLessThanOrEqual(1800)
      expect(row.periodMs - row.transitionMs - 200).toBeGreaterThanOrEqual(2200)
      for (let episode = 1; episode < 8; episode++) {
        const cue = episode * row.periodMs - row.phaseMs
        const after = growingRowAt(row, cue + .001)
        expect(after.episode).toBe(episode)
        expect(after.cueAtMs).toBe(cue)
        expect(after.pills).not.toEqual(growingRowAt(row, cue - .001).pills)
        for (const offset of [200, 1300, row.periodMs - .001]) expect(growingRowAt(row, cue + offset)).toEqual(after)
      }
    }
  })

  it('keeps convex transitions within row bounds with no neighboring overlap', () => {
    for (const row of createGrowingRows('bounds')) {
      let before = growingRowAt(row, 0)
      for (let time = 200; time < 20000; time += 200) {
        const after = growingRowAt(row, time)
        for (const fraction of [0, .25, .5, .75, 1]) {
          const cells = after.pills.map((cell, index) => ({ x: before.pills[index]!.x + fraction * (cell.x - before.pills[index]!.x), width: before.pills[index]!.width + fraction * (cell.width - before.pills[index]!.width) }))
          if (cells[0]!.x !== 0) throw Error('Long-bar left edge moved')
          for (const [index, cell] of cells.entries()) if (cell.width < 0 || cell.x + cell.width > 1.0000001 || (index && cell.x < cells[index - 1]!.x + cells[index - 1]!.width - 1e-8)) throw Error(`Invalid growing geometry at${row.index}/${time}/${fraction}`)
        }
        before = after
      }
    }
  })
})

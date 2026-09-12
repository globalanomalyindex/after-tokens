import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'
import { AmbientComposition } from '@/components/settle/ambient-composition'
import { ambientScoreAt, ambientScoreCue, createAmbientScore, AMBIENT_SCORE_ROUND_MS } from '@/lib/settle/ambient-score'

afterEach(() => { cleanup(); vi.useRealTimers() })

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
    expect(container.querySelector<HTMLElement>('.ambient-composition__bar')!.style.getPropertyValue('--ambient-width')).toBe(initialWidth)
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
    expect(composition).toHaveAttribute('data-material', 'ambient-cell-skeleton-v7')
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


describe('source-independent decorative score', () => {
  it('holds five rows across changing committed and revisable source content at the same local time', () => {
    vi.useFakeTimers()
    for (const source of ['commit', 'snapshot'] as const) {
      let state = createSettleState('answer')
      const { container, rerender, unmount } = render(<SettleAnswer state={state} runId="source-independent" />)
      const ornament = () => container.querySelector('.ambient-composition')!.outerHTML
      const initial = ornament(), height = container.querySelector<HTMLElement>('.settle-answer-frame')!.style.height
      for (const [index, text] of ['A', 'WWWW '.repeat(200), 'x\n'.repeat(50)].entries()) {
        state = reduceSettle(state, source === 'snapshot'
          ? { type: 'snapshot', atMs: index + 1, text, final: false }
          : { type: 'commit', atMs: index + 1, tokens: [{ position: index, text }] })
        rerender(<SettleAnswer state={state} runId="source-independent" />)
        expect(ornament()).toBe(initial)
        expect(container.querySelector<HTMLElement>('.settle-answer-frame')!.style.height).toBe(height)
        expect(container.querySelector('.settle-page')!.textContent).toBe('')
      }
      unmount()
    }
  })

  it('preserves score phase on tempo changes and applies the new rate only to future ticks', () => {
    vi.useFakeTimers()
    const props = { active: true, motion: true, complete: false, runId: 'tempo', tempo: 1 }
    const { container, rerender } = render(<AmbientComposition {...props} />)
    act(() => vi.advanceTimersByTime(2100))
    const root = container.querySelector('[data-ambient-composition]')!
    const targets = () => [...container.querySelectorAll('[data-pill]')].map((cell) => cell.getAttribute('style'))
    const before = targets()
    expect(root).toHaveAttribute('data-score-ms', '2100')
    rerender(<AmbientComposition {...props} tempo={.7} />)
    expect(root).toHaveAttribute('data-score-ms', '2100')
    expect(targets()).toEqual(before)
    act(() => vi.advanceTimersByTime(100))
    expect(root).toHaveAttribute('data-score-ms', '2170')
    rerender(<AmbientComposition {...props} tempo={1.4} />)
    expect(root).toHaveAttribute('data-score-ms', '2170')
    act(() => vi.advanceTimersByTime(100))
    expect(root).toHaveAttribute('data-score-ms', '2310')
  })

  it('retains a compact two-row tail only after policy-eligible text is released', () => {
    const state = reduceSettle(createSettleState('sentence'), { type: 'commit', atMs: 1, tokens: [{ position: 0, text: 'Released. ' }] })
    const { container } = render(<SettleAnswer state={state} motion={false} />)
    expect(container.querySelectorAll('.ambient-composition__bar')).toHaveLength(5)
    expect(container.querySelectorAll('.ambient-composition__bar[data-shown="true"]')).toHaveLength(2)
    expect(container.querySelector('.settle-page')!.textContent).toBe('Released. ')
  })

  it('uses reproducible varied chapters, one cue at a time, with a geometric rest after each gesture', () => {
    for (const seed of ['a', 'b', 'c', 'd']) {
      const rows = createAmbientScore(seed)
      expect(rows).toEqual(createAmbientScore(seed))
      expect(rows).toHaveLength(5)
      expect(new Set(rows.map((row) => row.breathPeriodMs)).size).toBe(5)
      const cues = Array.from({ length: 4 }, (_, round) => rows.slice(1).map((row) => ({ row: row.index, round, at: ambientScoreCue(rows, row.index, round) }))).flat().sort((a, b) => a.at - b.at)
      for (const [index, cue] of cues.entries()) {
        const before = ambientScoreAt(rows, cue.at - .001), after = ambientScoreAt(rows, cue.at + .001)
        expect(after.map((shape, row) => JSON.stringify(shape) !== JSON.stringify(before[row]))).toEqual(rows.map((row) => row.index === cue.row))
        expect(after[cue.row]!.transitionMs).toBeGreaterThanOrEqual(900)
        expect(after[cue.row]!.transitionMs).toBeLessThanOrEqual(1300)
        const next = cues[index + 1]
        if (next) {
          const spacing = next.at - cue.at
          expect(spacing).toBeGreaterThanOrEqual(2200)
          expect(spacing).toBeLessThanOrEqual(3600)
          expect(spacing - after[cue.row]!.transitionMs - 100).toBeGreaterThanOrEqual(800)
          expect(ambientScoreAt(rows, next.at - .001)).toEqual(after)
        }
      }
      expect(ambientScoreAt(rows, 0)[0]).toEqual(ambientScoreAt(rows, 20 * AMBIENT_SCORE_ROUND_MS)[0])
      const changing = Array.from({ length: 5 }, (_, round) => ambientScoreAt(rows, (round + 1) * AMBIENT_SCORE_ROUND_MS)[1]!.pills)
      expect(new Set(changing.map((pills) => JSON.stringify(pills))).size).toBe(5)
    }
  })

  it('keeps cell identities and nonoverlap across every linear interpolation of adjacent score targets', () => {
    for (const seed of ['a', 'b', 'c']) {
      const rows = createAmbientScore(seed)
      for (let round = 0; round < 8; round++) for (const row of rows.slice(1)) {
        const cue = ambientScoreCue(rows, row.index, round)
        const before = ambientScoreAt(rows, cue - .001)[row.index]!, after = ambientScoreAt(rows, cue + .001)[row.index]!
        expect(before.pills).toHaveLength(6)
        expect(after.pills).toHaveLength(6)
        for (const t of [0, .17, .5, .83, 1]) {
          const cells = after.pills.map((cell, index) => ({ x: before.pills[index]!.x + t * (cell.x - before.pills[index]!.x), width: before.pills[index]!.width + t * (cell.width - before.pills[index]!.width) }))
          expect(cells[0]!.x).toBe(0)
          expect(cells.at(-1)!.x + cells.at(-1)!.width).toBeCloseTo(1, 10)
          for (const [index, cell] of cells.entries()) {
            if (cell.width < 0 || cell.x + cell.width > 1.0000001 || (index && cell.x < cells[index - 1]!.x + cells[index - 1]!.width - 1e-8)) throw Error(`Invalid interpolated score geometry at ${seed}/${round}/${row.index}/${t}`)
          }
        }
      }
    }
  })
})

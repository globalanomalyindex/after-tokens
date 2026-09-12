import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BubbleTransfer } from '@/components/settle/bubble-transfer'

afterEach(() => { cleanup(); vi.restoreAllMocks(); document.querySelectorAll('[data-transfer-fixture]').forEach((node) => node.remove()) })

function fixture(count: number, priorReadable = false) {
  const frame = document.createElement('div'); frame.dataset.transferFixture = 'true'; frame.dataset.receiving = 'false'; frame.dataset.priorReadable = String(priorReadable)
  frame.style.opacity = '1'
  for (let index = 0; index < count; index++) {
    const presence = document.createElement('span'), ink = document.createElement('span')
    presence.className = 'ambient-composition__presence'; presence.style.opacity = '1'
    ink.className = 'ambient-composition__ink'; ink.style.opacity = '.2'; ink.dataset.testIndex = String(index)
    presence.append(ink); frame.append(presence)
  }
  const passage = document.createElement('span'); passage.dataset.passage = 'new'; passage.dataset.arriving = 'true'; passage.textContent = 'one two three four five six seven eight nine'; frame.append(passage)
  document.body.append(frame)
  let shifted = false
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this === frame) return new DOMRect(0, 0, 300, 500)
    if (this.classList.contains('ambient-composition__ink')) return new DOMRect(10, (shifted ? 130 : 30) + Number(this.dataset.testIndex) * 15, 100, 12)
    return new DOMRect(0, 0, 300, 50)
  })
  vi.spyOn(Range.prototype, 'getClientRects').mockReturnValue([new DOMRect(10, 2, 10, 15)] as unknown as DOMRectList)
  return { frame, shift: () => { shifted = true } }
}

describe('actual visible bubble capture', () => {
  it('refills a continuing field during transfer without starting another fade at cleanup', () => {
    const { frame } = fixture(5)
    frame.dataset.receiving = 'true'
    const { unmount } = render(<BubbleTransfer frameRef={{ current: frame }} transferKey="sentence" onComplete={() => {}} />)
    const originals = [...frame.querySelectorAll('[data-borrowed]')]
    expect(originals.length).toBeGreaterThan(0)
    for (const original of originals) expect(original).toHaveAttribute('data-refilling', 'sentence')
    unmount()
    for (const original of originals) {
      expect(original).not.toHaveAttribute('data-borrowed')
      expect(original).not.toHaveAttribute('data-refilling')
      expect(original).not.toHaveAttribute('data-replenish')
    }
  })

  it('captures before advancing the source field and hides originals while their clones carry the handover', () => {
    const { frame, shift } = fixture(1)
    const onCaptured = vi.fn(() => shift())
    const { container, unmount } = render(<BubbleTransfer frameRef={{ current: frame }} transferKey="batch" onCaptured={onCaptured} onComplete={() => {}} />)
    expect(onCaptured).toHaveBeenCalledWith('batch')
    const clone = container.querySelector<HTMLElement>('.bubble-transfer__cell')!
    expect(clone.style.top).toBe('30px')
    expect(clone.style.width).toBe('100px')
    expect(frame.querySelector('.ambient-composition__presence')).toHaveAttribute('data-borrowed', 'batch')
    unmount()
    expect(frame.querySelector('.ambient-composition__presence')).not.toHaveAttribute('data-borrowed')
    expect(frame.querySelector('.ambient-composition__presence')).toHaveAttribute('data-replenish', 'true')
  })

  it('limits a terminal batch with already-readable text to nearby origins', () => {
    const { frame } = fixture(10, true)
    const { container } = render(<BubbleTransfer frameRef={{ current: frame }} transferKey="terminal" onComplete={() => {}} />)
    expect(container.querySelectorAll('.bubble-transfer__cell')).toHaveLength(6)
    expect(frame.querySelectorAll('[data-borrowed]')).toHaveLength(6)
    expect(frame.querySelectorAll('[data-refilling]')).toHaveLength(0)
  })

  it('does not clone or borrow old material when a terminal event adds no new words', () => {
    const { frame } = fixture(5, true)
    frame.querySelector('[data-arriving]')!.removeAttribute('data-arriving')
    const captured = vi.fn()
    const { container } = render(<BubbleTransfer frameRef={{ current: frame }} transferKey="done" onCaptured={captured} onComplete={() => {}} />)
    expect(container.querySelectorAll('.bubble-transfer__cell')).toHaveLength(0)
    expect(frame.querySelectorAll('[data-borrowed]')).toHaveLength(0)
    expect(captured).toHaveBeenCalledWith('done')
  })
})

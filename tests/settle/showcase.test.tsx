import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SectionShowcase } from '@/components/sections/section-showcase'
import { SHOWCASE_ANSWER } from '@/lib/settle/showcase-replay'

const observers: Array<(visible: boolean) => void> = []
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: IntersectionObserverCallback) { observers.push((visible) => this.callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver)) }
    observe() {} unobserve() {} disconnect() {}
  })
})
afterEach(() => { cleanup(); observers.length = 0; vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }
const visible = (value: boolean) => act(() => observers.forEach((notify) => notify(value)))

describe('the upfront live comparison', () => {
  it('shows both panels by default and only starts its shared source clock on entry', async () => {
    const { container } = render(<SectionShowcase />)
    const demo = container.querySelector('[data-showcase]')!
    expect(screen.getByRole('radio', { name: 'Each sentence' })).toBeChecked()
    expect(container.querySelector('.settle')).toHaveAttribute('data-ambient-condition', 'reshape')
    expect(container.querySelector('.stage')).toHaveAttribute('data-demo')
    expect(screen.getByRole('region', { name: 'Raw committed prefix' })).toBeInTheDocument()
    await advance(1000)
    expect(demo).toHaveAttribute('data-elapsed-ms', '0')
    visible(true)
    await advance(800)
    expect(container.querySelector('[data-showcase-prefix]')).toHaveTextContent('Start with a little room to bre')
    expect(container.querySelector('[data-showcase-prefix] mark')).toHaveTextContent('bre')
    expect(container.querySelector('.settle-page')?.textContent).toBe('')
    await advance(1400)
    expect(container.querySelector('.settle-page')?.textContent).toBe('Start with a little room to breathe. ')
    expect(container.querySelector('[data-showcase-prefix]')?.textContent).toContain('Let a complete thought arrive')
  })

  it('preserves elapsed time and source identity across manual, offscreen and tab pauses', async () => {
    const { container } = render(<SectionShowcase />)
    const demo = container.querySelector('[data-showcase]')!
    const elapsed = () => Number(demo.getAttribute('data-elapsed-ms'))
    visible(true); await advance(1000)
    fireEvent.click(screen.getByRole('button', { name: 'pause live comparison' }))
    const userPause = elapsed(); await advance(500); expect(elapsed()).toBe(userPause)
    visible(false); visible(true); await advance(200); expect(elapsed()).toBe(userPause)
    fireEvent.click(screen.getByRole('button', { name: 'resume live comparison' }))
    await advance(200); expect(elapsed()).toBeGreaterThan(userPause)
    visible(false); const offscreen = elapsed(); await advance(500); expect(elapsed()).toBe(offscreen)
    visible(true); await advance(200); expect(elapsed()).toBeGreaterThan(offscreen)
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))
    const hidden = elapsed(); await advance(500); expect(elapsed()).toBe(hidden)
    visibility.mockReturnValue('visible'); fireEvent(document, new Event('visibilitychange'))
    await advance(200); expect(elapsed()).toBeGreaterThan(hidden)
    expect(demo).toHaveAttribute('data-source', 'showcase-shared-arrival-v1')
  })

  it('restarts both panels together when changing policy, reaches one exact answer, and does not loop on reentry', async () => {
    const { container } = render(<SectionShowcase />)
    const demo = container.querySelector('[data-showcase]')!
    visible(true); await advance(2400)
    expect(container.querySelector('.settle-page')?.textContent).not.toBe('')
    fireEvent.click(screen.getByRole('radio', { name: 'Whole answer' }))
    expect(container.querySelector('.settle-page')?.textContent).toBe('')
    expect(container.querySelector('[data-showcase-prefix] mark')).toBeNull()
    await advance(2400)
    expect(container.querySelector('.settle-page')?.textContent).toBe('')
    expect(container.querySelector('[data-showcase-prefix]')?.textContent).toContain('Start with')
    await advance(6300)
    expect(container.querySelector('.settle-page')?.textContent).toBe(SHOWCASE_ANSWER)
    expect(container.querySelector('[data-showcase-prefix]')?.textContent).toBe(SHOWCASE_ANSWER)
    visible(false); visible(true); await advance(500)
    expect(demo).toHaveAttribute('data-elapsed-ms', '8500')
    fireEvent.click(screen.getByRole('button', { name: 'replay live comparison' }))
    expect(demo).toHaveAttribute('data-elapsed-ms', '0')
    expect(container.querySelector('.settle-page')?.textContent).toBe('')
  })

  it('keeps an explicit replay paused when the visibility gate is already closed', async () => {
    const { container } = render(<SectionShowcase />)
    const demo = container.querySelector('[data-showcase]')!
    visible(true); await advance(1200)
    visible(false)
    fireEvent.click(screen.getByRole('button', { name: 'replay live comparison' }))
    await advance(900)
    expect(demo).toHaveAttribute('data-elapsed-ms', '0')
    expect(demo).toHaveAttribute('data-running', 'false')
    expect(container.querySelector('[data-showcase-prefix] mark')).toBeNull()
    visible(true); await advance(800)
    expect(container.querySelector('[data-showcase-prefix] mark')).toHaveTextContent('bre')
  })

  it('removes decorative motion without accelerating the shared source under reduced motion', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ matches: true, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }))
    const { container } = render(<SectionShowcase />)
    visible(true); await advance(800)
    expect(container.querySelector('.settle')).toHaveAttribute('data-motion', 'off')
    expect(container.querySelector('.settle-page')?.textContent).toBe('')
    expect(container.querySelector('[data-showcase-prefix]')?.textContent).toBe('Start with a little room to bre')
    await advance(7800)
    expect(container.querySelector('.settle-page')?.textContent).toBe(SHOWCASE_ANSWER)
    expect(container.querySelector('[data-bubble-transfer]')).toBeNull()
  })
})

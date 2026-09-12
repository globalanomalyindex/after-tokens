import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SectionHook } from '@/components/sections/section-hook'

const observers: Array<(visible: boolean) => void> = []
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: IntersectionObserverCallback) { observers.push((visible) => this.callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver)) }
    observe() { this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
    unobserve() {} disconnect() {}
  })
})
afterEach(() => { cleanup(); observers.length = 0; vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }

describe('the authored opening', () => {
  it('keeps a static heading and transcript while typing only the prompt, then permits an immediate static welcome', async () => {
    const { container } = render(<SectionHook />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('after tokens')
    expect(container.querySelector('[data-hero-transcript]')).toHaveTextContent('What should diffusion text rendering look like?')
    const typing = () => container.querySelector('[data-hero-typed]')?.textContent ?? ''
    await advance(800)
    expect(typing().length).toBeGreaterThan(0)
    expect(typing().length).toBeLessThan(46)
    expect(container.querySelector('[data-hero-intro] .settle-page')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'show welcome' }))
    expect(container.querySelector('[data-hero-intro] .settle-page')).toHaveTextContent('It should look like this. Welcome to after tokens.')
    expect(container.querySelector('[data-hero-intro] .settle')).toHaveAttribute('data-motion', 'off')
  })

  it('freezes its presentation clock for manual pause, offscreen and hidden states without restarting', async () => {
    const { container } = render(<SectionHook />)
    const elapsed = () => Number(container.querySelector('[data-hero-intro]')?.getAttribute('data-elapsed-ms'))
    await advance(600)
    fireEvent.click(screen.getByRole('button', { name: 'pause intro' }))
    const paused = elapsed()
    await advance(500)
    expect(elapsed()).toBe(paused)
    fireEvent.click(screen.getByRole('button', { name: 'resume intro' }))
    await advance(200)
    expect(elapsed()).toBeGreaterThan(paused)
    act(() => observers.forEach((notify) => notify(false)))
    const offscreen = elapsed()
    await advance(500)
    expect(elapsed()).toBe(offscreen)
    act(() => observers.forEach((notify) => notify(true)))
    await advance(200)
    expect(elapsed()).toBeGreaterThan(offscreen)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))
    const hidden = elapsed()
    await advance(500)
    expect(elapsed()).toBe(hidden)
  })

  it('runs once through the shared skeleton and releases the complete welcome in one batch', async () => {
    const { container } = render(<SectionHook />)
    await advance(3200)
    const surface = container.querySelector('[data-hero-intro] .settle')
    expect(surface).toHaveAttribute('data-ambient-condition', 'reshape')
    expect(surface).toHaveAttribute('data-policy', 'sentence')
    expect(surface?.querySelector('.ambient-composition')).not.toBeNull()
    expect(surface?.querySelector('.settle-page')?.textContent).toBe('')
    await advance(1600)
    expect(surface?.querySelector('.settle-page')?.textContent).toBe('')
    await advance(800)
    expect(surface?.querySelectorAll('[data-passage]')).toHaveLength(2)
    expect(surface?.querySelectorAll('[data-passage][data-arriving="true"]')).toHaveLength(2)
    expect(surface?.querySelector('.settle-page')).toHaveTextContent('It should look like this. Welcome to after tokens.')
    const end = container.querySelector('[data-hero-intro]')?.getAttribute('data-elapsed-ms')
    await advance(8000)
    expect(container.querySelector('[data-hero-intro]')).toHaveAttribute('data-elapsed-ms', end!)
    fireEvent.click(screen.getByRole('button', { name: 'replay intro' }))
    expect(container.querySelector('[data-hero-intro] .settle-page')).toBeNull()
  })

  it('renders the full exchange without waiting or moving when reduced motion is preferred', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ matches: true, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }))
    const { container } = render(<SectionHook />)
    expect(container.querySelector('[data-hero-typed]')).toHaveTextContent('What should diffusion text rendering look like?')
    expect(container.querySelector('[data-hero-intro] .settle-page')).toHaveTextContent('It should look like this. Welcome to after tokens.')
    expect(container.querySelector('[data-hero-intro] .settle')).toHaveAttribute('data-motion', 'off')
    await advance(6000)
    expect(container.querySelector('[data-hero-intro]')).toHaveAttribute('data-elapsed-ms', '0')
    expect(screen.queryByRole('button', { name: 'pause intro' })).toBeNull()
  })
})

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SectionHook } from '@/components/sections/section-hook'

const SEEN = 'after-tokens:intro-seen:v1'
const WELCOME = 'It should feel like a thought taking shape. Complete sentences find their place while the rest keeps breathing. Each arrival has a little weight, then settles into something you can read. Welcome to After Tokens, a motion study of how generated words arrive.'
const observers: Array<(visible: boolean) => void> = []
beforeEach(() => {
  sessionStorage.clear()
  history.replaceState(null, '', '/')
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: IntersectionObserverCallback) { observers.push((visible) => this.callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver)) }
    observe() { this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
    unobserve() {} disconnect() {}
  })
})
afterEach(() => { cleanup(); observers.length = 0; vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); sessionStorage.clear() })
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }

describe('the authored cinematic opening', () => {
  it('starts fullscreen on each mount, locks background scrolling, and permits an immediate case study', async () => {
    const { container } = render(<SectionHook />)
    expect(screen.getByRole('dialog', { name: 'After Tokens motion introduction' })).toHaveAttribute('aria-modal', 'true')
    expect(document.body.style.position).toBe('fixed')
    expect(sessionStorage.getItem(SEEN)).toBeNull()
    expect(container.querySelector('[data-hero-transcript]')).toHaveTextContent(WELCOME)
    await advance(800)
    const typed = container.querySelector('[data-hero-typed]')?.textContent ?? ''
    expect(typed.length).toBeGreaterThan(0)
    expect(typed.length).toBeLessThan(46)
    fireEvent.click(screen.getByRole('button', { name: 'skip to case study' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.position).toBe('')
    expect(container.querySelector('.settle-page')).toHaveTextContent(WELCOME)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('after tokens')
    fireEvent.click(screen.getByRole('button', { name: 'replay intro' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.position).toBe('')
  })

  it('releases four complete sentences as separate immutable batches before docking', async () => {
    const { container } = render(<SectionHook />)
    const hero = container.querySelector('[data-hero-intro]')!
    await advance(3300)
    expect(hero.querySelector('.settle')).toHaveAttribute('data-policy', 'sentence')
    expect(hero.querySelector('.settle-page')?.textContent).toBe('')
    await advance(1900)
    expect(hero.querySelectorAll('[data-passage]')).toHaveLength(1)
    expect(hero.querySelector('.settle')).toHaveAttribute('data-status', 'receiving')
    await advance(1200)
    expect(hero.querySelectorAll('[data-passage]')).toHaveLength(2)
    expect(hero.querySelector('[data-passage]')).not.toHaveAttribute('data-arriving', 'true')
    await advance(1400)
    expect(hero.querySelectorAll('[data-passage]')).toHaveLength(3)
    expect(hero.querySelector('.settle')).toHaveAttribute('data-status', 'receiving')
    await advance(1400)
    expect(hero.querySelectorAll('[data-passage]')).toHaveLength(4)
    expect(hero.querySelector('.settle')).toHaveAttribute('data-status', 'complete')
    expect(hero.querySelector('.settle-page')).toHaveTextContent(WELCOME)
    fireEvent.animationEnd(hero.querySelector('[data-bubble-transfer]')!)
    await advance(2400)
    expect(hero).toHaveAttribute('data-presentation', 'embedded')
    expect(document.body.style.position).toBe('')
    const end = hero.getAttribute('data-elapsed-ms')
    await advance(2000)
    expect(hero).toHaveAttribute('data-elapsed-ms', end!)
  })

  it('supports Escape and traps keyboard focus only during the fullscreen scene', () => {
    render(<SectionHook />)
    const skip = screen.getByRole('button', { name: 'skip to case study' })
    const pause = screen.getByRole('button', { name: 'pause intro' })
    skip.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(pause).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(skip).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.position).toBe('')
  })

  it('pauses the authored clock and resumes without restarting, including embedded offscreen playback', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'skip to case study' }))
    fireEvent.click(screen.getByRole('button', { name: 'replay intro' }))
    await advance(200)
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

  it.each(['returning', 'deep-linked', 'reduced-motion'])('honors the opening preference on %s visits', async (path) => {
    if (path === 'returning') sessionStorage.setItem(SEEN, '1')
    if (path === 'deep-linked') history.replaceState(null, '', '/#field')
    if (path === 'reduced-motion') vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ matches: true, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }))
    const { container } = render(<SectionHook />)
    if (path !== 'reduced-motion') {
      expect(screen.getByRole('dialog')).toBeVisible()
      expect(document.body.style.position).toBe('fixed')
      await advance(800)
      expect(Number(container.querySelector('[data-hero-intro]')?.getAttribute('data-elapsed-ms'))).toBeGreaterThan(0)
      return
    }
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.position).toBe('')
    expect(container.querySelector('[data-hero-intro]')).toHaveAttribute('data-presentation', 'embedded')
    expect(container.querySelector('.settle-page')).toHaveTextContent(WELCOME)
    expect(container.querySelector('.settle')).toHaveAttribute('data-motion', 'off')
    await advance(1000)
    expect(container.querySelector('[data-hero-intro]')).toHaveAttribute('data-elapsed-ms', '0')
  })
})

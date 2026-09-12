'use client'

import { createContext, useContext, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'
import type { Replay } from '@/lib/settle/types'
import { SettleAnswer } from './settle-answer'
import { useReplay } from './use-replay'
import styles from './hero-intro.module.css'
import { DemoProgress } from './demo-progress'

const QUESTION = 'What should diffusion text rendering look like?'
const SENTENCES = [
  'Diffusion text can take shape in several places at once.\n',
  'It doesn’t have to arrive one word after another.\n',
  'Here, complete sentences settle while the rest of the answer keeps forming.\n',
  'Welcome to After Tokens, a different arrival for the same words.',
]
const WELCOME = SENTENCES.join('')
// These are authored immutable commitments, not captured model output or
// provisional snapshots. Only the prompt types. Each answer sentence arrives
// together, using the same eligibility and handover as the demonstrations.
const LETTER_TIMES = [...QUESTION].reduce<number[]>((times, letter, index) => {
  const previous = times.at(-1) ?? 180
  const phrasePause = QUESTION.slice(0, index).endsWith('diffusion') ? 150 : QUESTION.slice(0, index).endsWith('rendering') ? 110 : 0
  times.push(previous + 44 + (letter === ' ' ? 24 : 0) + phrasePause)
  return times
}, [])
const REPLY_AT_MS = LETTER_TIMES.at(-1)! + 400
const ARRIVAL_TIMES = [1900, 3150, 4500, 5850].map((offset) => REPLY_AT_MS + offset)
const INTRO: Replay = {
  id: 'authored-hero-introduction', label: 'An introduction to After Tokens',
  provenance: 'Prewritten motion introduction; immutable sentence batches and all timings are authored, not live inference.',
  durationMs: ARRIVAL_TIMES.at(-1)!,
  events: SENTENCES.map((text, position) => ({ type: 'commit', atMs: ARRIVAL_TIMES[position]!, tokens: [
    { position, text }, ...(position === SENTENCES.length - 1 ? [{ position: position + 1, text: '', end: true }] : []),
  ] })),
}
const STATIC_ANSWER = INTRO.events.reduce(reduceSettle, createSettleState('sentence'))
type Presentation = 'pending' | 'fullscreen' | 'docking' | 'embedded'
export const SkipOpeningContext = createContext(false)

export function HeroIntro({ onOpeningComplete }: { onOpeningComplete?: () => void } = {}) {
  const root = useRef<HTMLElement>(null)
  const slot = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLDivElement>(null)
  const skipButton = useRef<HTMLButtonElement>(null)
  const openingDecided = useRef(false)
  const openingReported = useRef(false)
  const dockAnimation = useRef<Animation | null>(null)
  const dockFallback = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [presentation, setPresentation] = useState<Presentation>('pending')
  const [hydrated, setHydrated] = useState(false)
  const [slotWidth, setSlotWidth] = useState(0)
  const [inView, setInView] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(true)
  const [manualPause, setManualPause] = useState(false)
  const [showStatic, setShowStatic] = useState(false)
  const [visualReady, setVisualReady] = useState(false)
  const reduced = usePrefersReducedMotion()
  const skipOpening = useContext(SkipOpeningContext)
  const titleId = useId()
  const clock = useReplay(INTRO, { policy: 'sentence', autoplay: false })
  const { play, pause } = clock
  const expanded = presentation === 'fullscreen' || presentation === 'docking'
  const staticView = hydrated && (reduced || showStatic)
  const paused = !hydrated || manualPause || (!expanded && !inView) || !documentVisible
  const active = !paused && !staticView && !clock.finished && presentation !== 'pending'

  const finishDock = useCallback(() => {
    if (dockFallback.current !== null) clearTimeout(dockFallback.current)
    dockFallback.current = null
    dockAnimation.current?.cancel()
    dockAnimation.current = null
    setPresentation('embedded')
  }, [])
  const skip = useCallback(() => {
    setShowStatic(true)
    setManualPause(false)
    finishDock()
  }, [finishDock])

  useEffect(() => {
    setHydrated(true)
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), { threshold: .15 })
    if (root.current) observer.observe(root.current)
    const visibility = () => setDocumentVisible(document.visibilityState !== 'hidden')
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => {
    // Wait for the client preference snapshot. The motion-safe server
    // snapshot is intentionally true and must not mark a fresh visit skipped.
    if (!hydrated || openingDecided.current) return
    openingDecided.current = true
    // Every document load gets the opening, regardless of visit history,
    // hash links or restored scroll. Reduced motion keeps the static exchange.
    const bypass = reduced || skipOpening
    setShowStatic(bypass)
    setPresentation(bypass ? 'embedded' : 'fullscreen')
  }, [hydrated, reduced, skipOpening])
  useEffect(() => { if (reduced && hydrated) skip() }, [reduced, hydrated, skip])
  useEffect(() => {
    if (hydrated && presentation === 'embedded' && !openingReported.current) {
      openingReported.current = true
      onOpeningComplete?.()
    }
  }, [hydrated, presentation, onOpeningComplete])
  useEffect(() => { if (active) play(); else pause() }, [active, play, pause])

  useLayoutEffect(() => {
    if (!slot.current) return
    const measure = () => setSlotWidth(slot.current?.getBoundingClientRect().width ?? 0)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(slot.current)
    return () => observer.disconnect()
  }, [])

  // The same stage stays mounted. Its content keeps the embedded column width
  // while the outer rectangle contracts, preventing line-wrap changes at dock.
  const dock = useCallback(() => {
    const element = canvas.current, target = slot.current
    if (!element || !target || typeof element.animate !== 'function') { finishDock(); return }
    const from = element.getBoundingClientRect(), to = target.getBoundingClientRect()
    if (!to.width || !to.height) { finishDock(); return }
    setPresentation('docking')
    const animation = element.animate([
      { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: '0px' },
      { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px`, borderRadius: '24px' },
    ], { duration: 760, easing: 'cubic-bezier(.65, 0, .15, 1)', fill: 'both' })
    dockAnimation.current = animation
    animation.onfinish = finishDock
    dockFallback.current = setTimeout(finishDock, 1000)
  }, [finishDock])
  useEffect(() => {
    if (presentation !== 'fullscreen' || !clock.finished || !visualReady || paused) return
    const timer = setTimeout(dock, 750)
    return () => clearTimeout(timer)
  }, [presentation, clock.finished, visualReady, paused, dock])
  useEffect(() => {
    if (presentation !== 'docking') return
    const interrupted = () => finishDock()
    window.addEventListener('resize', interrupted)
    if (!documentVisible) finishDock()
    return () => window.removeEventListener('resize', interrupted)
  }, [presentation, documentVisible, finishDock])
  useEffect(() => () => {
    dockAnimation.current?.cancel()
    if (dockFallback.current !== null) clearTimeout(dockFallback.current)
  }, [])

  useLayoutEffect(() => {
    const element = canvas.current
    const focusTarget = root.current
    if (!expanded || !element) return
    const body = document.body, html = document.documentElement
    const x = window.scrollX, y = window.scrollY
    const bodyBefore = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const overflowBefore = html.style.overflow
    const gutter = Math.max(0, window.innerWidth - html.clientWidth)
    if (gutter && html.clientWidth) body.style.paddingRight = `${(parseFloat(getComputedStyle(body).paddingRight) || 0) + gutter}px`
    body.style.position = 'fixed'; body.style.top = `${-y}px`; body.style.left = `${-x}px`; body.style.width = '100%'; body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
    // Inert the actual background siblings, without hiding this dialog's
    // ancestry. Restore pre-existing inert values exactly when it docks.
    const background: Array<{ element: HTMLElement; inert: boolean }> = []
    for (let branch: HTMLElement | null = element; branch?.parentElement; branch = branch.parentElement) {
      for (const sibling of branch.parentElement.children) if (sibling !== branch && sibling instanceof HTMLElement) {
        background.push({ element: sibling, inert: sibling.inert }); sibling.inert = true
      }
      if (branch.parentElement === body) break
    }
    const focusable = () => [...element.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
    const focusInside = () => (skipButton.current ?? focusable()[0])?.focus({ preventScroll: true })
    focusInside()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); skip(); return }
      if (event.key !== 'Tab') return
      const buttons = focusable(), first = buttons[0], last = buttons.at(-1)
      if (event.shiftKey && (document.activeElement === first || !element.contains(document.activeElement))) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) { event.preventDefault(); first?.focus() }
    }
    const focusin = () => { if (!element.contains(document.activeElement)) focusInside() }
    document.addEventListener('keydown', keydown)
    document.addEventListener('focusin', focusin)
    return () => {
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('focusin', focusin)
      for (const item of background) item.element.inert = item.inert
      Object.assign(body.style, bodyBefore)
      html.style.overflow = overflowBefore
      const behavior = html.style.scrollBehavior
      html.style.scrollBehavior = 'auto'; window.scrollTo(x, y); html.style.scrollBehavior = behavior
      focusTarget?.focus({ preventScroll: true })
    }
  }, [expanded, skip])

  const typed = staticView ? QUESTION : QUESTION.slice(0, LETTER_TIMES.filter((at) => at <= clock.elapsedMs).length)
  const replyVisible = staticView || clock.elapsedMs >= REPLY_AT_MS
  const complete = staticView || clock.finished
  // Presentation progress, not model confidence. Wait for the final words'
  // visual handover before showing 100%, then leave a beat for the fade.
  const introProgress = staticView || (clock.finished && visualReady) ? 100 : Math.min(99, Math.floor((clock.elapsedMs - REPLY_AT_MS) / (INTRO.durationMs - REPLY_AT_MS) * 100))
  const replay = () => { finishDock(); setVisualReady(false); setShowStatic(false); setManualPause(false); clock.restart() }

  return <figure ref={root} tabIndex={-1} className={styles.root} data-hero-intro data-presentation={presentation} data-elapsed-ms={Math.round(clock.elapsedMs)} data-static={staticView} data-paused={paused || staticView}>
    <div ref={slot} className={styles.slot}>
      <div ref={canvas} className={styles.canvas} data-hero-canvas data-presentation={presentation} data-demo role={expanded ? 'dialog' : undefined} aria-modal={expanded ? true : undefined} aria-labelledby={expanded ? titleId : undefined} style={{ '--hero-slot-width': slotWidth ? `${slotWidth}px` : '100%' } as CSSProperties}>
        <span id={titleId} className="sr-only">After Tokens motion introduction</span>
        <p className="sr-only" data-hero-transcript>Question: {QUESTION} Answer: {WELCOME}</p>
        <div className={styles.topline} aria-hidden="true"><span>after tokens</span><span>a motion study</span></div>
        <div className={styles.scene} aria-hidden="true">
          <div className={styles.conversation}>
            <div className={styles.prompt}>
              <span className={styles.promptSpace}>{QUESTION}</span>
              <span className={styles.promptInk}><span data-hero-typed>{typed}</span>{!complete && typed.length < QUESTION.length && <span className={styles.cursor} />}</span>
            </div>
            <div className={styles.answerSpace}>
              {replyVisible && <div key={clock.runId} className={styles.reply} data-static={staticView}>
                <span className={styles.replyLabel}>after tokens</span>
                <SettleAnswer state={staticView ? STATIC_ANSWER : clock.state} runId={`hero:${clock.runId}`} ambient="reshape" motion={!staticView} paused={paused} status={false} announce={false} onVisualReady={setVisualReady} label="introductory welcome" className={styles.answer} />
                <div className="settle-margin readout"><DemoProgress value={introProgress} complete={introProgress === 100} hidden={staticView} intro label="Introduction progress" /></div>
              </div>}
            </div>
          </div>
        </div>
        <div className={styles.sceneFooter}>
          <span className={styles.provenance}>web &amp; motion design</span>
          {expanded && <div className={styles.sceneControls}>
            <button type="button" disabled={complete || presentation === 'docking'} onClick={() => setManualPause((value) => !value)}>{manualPause ? 'resume intro' : 'pause intro'}</button>
            <button ref={skipButton} type="button" onClick={skip}>skip to case study <span aria-hidden="true">↗</span></button>
          </div>}
        </div>
        <noscript><div className={styles.noScript}><p>{QUESTION}</p><p>{WELCOME}</p></div></noscript>
      </div>
    </div>
    <figcaption className={styles.caption} aria-hidden={expanded || undefined}>
      <span className="readout" style={{ color: 'var(--muted)' }}>illustrative sequence · the same shared renderer</span>
      {reduced ? <span className="readout" style={{ color: 'var(--muted)' }}>reduced motion · full exchange shown</span> : <div className={styles.controls}>
        <button type="button" className="replay-btn replay-btn-on-surface" disabled={complete} onClick={() => setManualPause((value) => !value)}>{manualPause ? 'resume intro' : 'pause intro'}</button>
        <button type="button" className="replay-btn replay-btn-on-surface" onClick={replay}>replay intro</button>
        <button type="button" className="replay-btn replay-btn-on-surface" disabled={staticView} onClick={skip}>show welcome</button>
      </div>}
    </figcaption>
  </figure>
}

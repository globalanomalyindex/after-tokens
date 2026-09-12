'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BrandProvider } from '@/lib/brand/provider'
import { HeroIntro, SkipOpeningContext } from '@/components/settle/hero-intro'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
import { SETTLE } from '@/lib/traces/findings'
import { PresentationDemo } from './presentation-demo'
import styles from './presentation.module.css'

const CHAPTERS = [
  { id: 'opening', label: 'the opening', category: 'after tokens' },
  { id: 'comparison', label: 'a different arrival', category: 'see it' },
  { id: 'sentences', label: 'each sentence', category: 'feel it' },
  { id: 'words', label: 'each word', category: 'feel it' },
  { id: 'whole-answer', label: 'the whole answer', category: 'feel it' },
  { id: 'voices', label: 'a little character', category: 'make it yours' },
  { id: 'recording', label: 'the real thing', category: 'look closer' },
  { id: 'stability', label: 'move the wait', category: 'the reasoning' },
  { id: 'research', label: 'what research supports', category: 'the evidence' },
  { id: 'costs', label: 'what it costs', category: 'the tradeoff' },
  { id: 'limits', label: 'what is still open', category: 'the next study' },
  { id: 'colophon', label: 'after the last word', category: 'after tokens' },
] as const
const SOURCE = 'https://github.com/globalanomalyindex/after-tokens'
const LEGACY: Record<string, number> = { hook: 0, showcase: 1, field: 2, voice: 5, previews: 5, concept: 5, playground: 6, contract: 7, problem: 7, evidence: 8, audit: 8, cost: 9, open: 10 }
function indexFromHash() {
  const hash = window.location.hash.slice(1)
  const found = CHAPTERS.findIndex(chapter => chapter.id === hash)
  return found >= 0 ? found : LEGACY[hash] ?? 0
}
function scrollPane(target: EventTarget | null) {
  for (let el = target instanceof Element ? target : null; el; el = el.parentElement) {
    if (el instanceof HTMLElement && el.matches('[data-slide-scroll]') && el.scrollHeight > el.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(el).overflowY)) return el
  }
  return null
}
function scrollable(target: EventTarget | null, delta: number) {
  const pane = scrollPane(target)
  return !!pane && (delta > 0 ? pane.scrollTop + pane.clientHeight < pane.scrollHeight - 2 : pane.scrollTop > 2)
}

export function CaseStudyExperience({ reading }: { reading: ReactNode }) {
  const [readingMode, setReadingMode] = useState(false)
  const [skipReadingOpening, setSkipReadingOpening] = useState(false)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [menu, setMenu] = useState(false)
  const [openingDone, setOpeningDone] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const pending = useRef(0)
  const root = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const touch = useRef<{ x: number; y: number; target: EventTarget | null; pane: HTMLElement | null; top: number } | null>(null)
  const wheelState = useRef({ last: 0, sum: 0, consumed: false, cooldown: 0 })
  const reduced = usePrefersReducedMotion()
  useEffect(() => {
    setReadingMode(new URLSearchParams(location.search).get('view') === 'reading')
    pending.current = indexFromHash()
    setHydrated(true)
  }, [])
  const navigate = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(CHAPTERS.length - 1, next))
    if (document.querySelector('[data-hero-canvas][role="dialog"]')) return
    setDirection(clamped >= index ? 1 : -1)
    setIndex(clamped); setMenu(false)
    history.pushState(null, '', `${location.pathname}#${CHAPTERS[clamped]!.id}`)
  }, [index])
  const finishOpening = useCallback((skipped: boolean) => {
    setOpeningDone(true)
    // A completed animation never navigates. Explicit Skip/reduced-motion
    // entry may honor a requested chapter; a watched opening stays here.
    if (skipped && pending.current) setIndex(pending.current)
    else if (!skipped) history.replaceState(null, '', `${location.pathname}#opening`)
    pending.current = 0
    if (!skipped) {
      wheelState.current.last = performance.now()
      wheelState.current.consumed = true
      wheelState.current.sum = 0
    }
  }, [])
  useEffect(() => {
    const restore = () => {
      setSkipReadingOpening(true)
      setReadingMode(new URLSearchParams(location.search).get('view') === 'reading')
      if (openingDone) setIndex(indexFromHash())
      else pending.current = indexFromHash()
    }
    addEventListener('popstate', restore); addEventListener('hashchange', restore)
    return () => { removeEventListener('popstate', restore); removeEventListener('hashchange', restore) }
  }, [openingDone])
  useEffect(() => {
    if (readingMode) return
    const wheel = wheelState.current
    const onWheel = (event: WheelEvent) => {
      if (!openingDone || document.querySelector('[role="dialog"]')) { wheel.last = performance.now(); wheel.consumed = true; wheel.sum = 0; return }
      if (event.ctrlKey || menu) return
      if (event.target instanceof Element && event.target.closest('select, input, textarea, [role="listbox"]')) return
      const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1)
      const now = performance.now()
      if (now - wheel.last > 170) { wheel.sum = 0; wheel.consumed = false }
      wheel.last = now
      if (scrollable(event.target, delta)) { wheel.consumed = true; return }
      event.preventDefault()
      if (wheel.consumed || now < wheel.cooldown) return
      wheel.sum += delta
      if (Math.abs(wheel.sum) >= 65) { wheel.consumed = true; wheel.cooldown = now + 650; navigate(index + Math.sign(wheel.sum)) }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !openingDone || document.querySelector('[role="dialog"]')) return
      if (event.key === 'Escape') { setMenu(false); return }
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"], [role="radiogroup"]')) return
      if (event.key === 'PageDown' && scrollable(event.target, 1)) return
      if (event.key === 'PageUp' && scrollable(event.target, -1)) return
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); navigate(index + 1) }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); navigate(index - 1) }
    }
    const el = root.current
    el?.addEventListener('wheel', onWheel, { passive: false })
    addEventListener('keydown', onKey)
    return () => { el?.removeEventListener('wheel', onWheel); removeEventListener('keydown', onKey) }
  }, [readingMode, index, navigate, openingDone, menu])
  const read = (hash = '') => {
    setSkipReadingOpening(true)
    setReadingMode(true)
    history.pushState(null, '', `${location.pathname}?view=reading${hash ? `#${hash}` : ''}`)
    requestAnimationFrame(() => { if (hash) document.getElementById(hash)?.scrollIntoView(); else scrollTo(0, 0) })
  }
  const returnToSlides = () => {
    setReadingMode(false); setOpeningDone(true); setIndex(8)
    history.pushState(null, '', `${location.pathname}#research`)
    scrollTo(0, 0)
  }
  if (readingMode) return <SkipOpeningContext.Provider value={skipReadingOpening}><button className={styles.backToSlides} type="button" onClick={returnToSlides}>← presentation</button>{reading}</SkipOpeningContext.Provider>

  const chapter = CHAPTERS[index]!
  return <BrandProvider brand="after-tokens" as="main" className={styles.experience}>
    <div ref={root} className={styles.shell} data-case-study data-slide={chapter.id} data-reduced-motion={reduced} data-hydrated={hydrated}
      onPointerMove={event => {
        if (reduced || event.pointerType !== 'mouse') return
        const bounds = event.currentTarget.getBoundingClientRect()
        event.currentTarget.style.setProperty('--cursor-x', `${event.clientX - bounds.left}px`)
        event.currentTarget.style.setProperty('--cursor-y', `${event.clientY - bounds.top}px`)
        for (const glass of event.currentTarget.querySelectorAll<HTMLElement>('[data-glass]')) {
          const box = glass.getBoundingClientRect()
          glass.style.setProperty('--glass-x', `${event.clientX - box.left}px`)
          glass.style.setProperty('--glass-y', `${event.clientY - box.top}px`)
        }
      }}>
      <header className={styles.header}>
        <button type="button" className={styles.wordmark} onClick={() => navigate(0)} aria-label="After Tokens, opening">after tokens<span className={styles.wordmarkDot} /></button>
        <span className={styles.headerDescription}>a web &amp; motion study</span>
        <div className={styles.headerActions}><button type="button" onClick={() => read()}>read the study ↗</button><button type="button" aria-expanded={menu} aria-controls="chapter-index" onClick={() => setMenu(value => !value)}>index <span aria-hidden="true">{menu ? '−' : '+'}</span></button></div>
      </header>
      {menu && <nav id="chapter-index" className={styles.indexMenu} aria-label="Case study chapters">
        {CHAPTERS.map((item, i) => <button type="button" key={item.id} onClick={() => navigate(i)} aria-current={i === index ? 'step' : undefined}><span>{String(i + 1).padStart(2, '0')}</span>{item.label}</button>)}
      </nav>}
      <button type="button" data-glass className={`${styles.edge} ${styles.previous}`} disabled={index === 0 || !openingDone} aria-label="Previous slide" onClick={() => navigate(index - 1)}><span className={styles.edgeArrow}>←</span><span className={styles.edgeLabel}>{CHAPTERS[Math.max(0, index - 1)]!.label}</span></button>
      <button type="button" data-glass className={`${styles.edge} ${styles.next}`} disabled={index === CHAPTERS.length - 1 || !openingDone} aria-label="Next slide" onClick={() => navigate(index + 1)}><span className={styles.edgeArrow}>→</span><span className={styles.edgeLabel}>{CHAPTERS[Math.min(CHAPTERS.length - 1, index + 1)]!.label}</span></button>
      <div ref={viewport} className={styles.viewport} role="region" aria-roledescription="carousel" aria-label="After Tokens case study"
        onTouchStart={event => { const point = event.touches[0]; touch.current = point ? { x: point.clientX, y: point.clientY, target: event.target, pane: scrollPane(event.target), top: scrollPane(event.target)?.scrollTop ?? 0 } : null }}
        onTouchEnd={event => {
          const start = touch.current, point = event.changedTouches[0]; touch.current = null
          if (!start || !point || !openingDone || menu) return
          if (start.pane && Math.abs(start.pane.scrollTop - start.top) > 2) return
          if (start.target instanceof Element && start.target.closest('button, a, select, input')) return
          const dx = start.x - point.clientX, dy = start.y - point.clientY
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 65) navigate(index + Math.sign(dx))
          else if (Math.abs(dy) > 85 && !scrollable(start.target, dy)) navigate(index + Math.sign(dy))
        }}>
        <section data-slide-scroll tabIndex={0} key={chapter.id} className={`${styles.slide} ${index === 0 ? styles.openingSlide : ''}`} data-direction={direction} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${CHAPTERS.length}: ${chapter.label}`}>
          {index === 0 ? <div className={styles.opening}><h1 className="sr-only">After Tokens — a different arrival for generated text</h1><HeroIntro onOpeningComplete={finishOpening} /></div> : <SlideContent index={index} read={read} />}
        </section>
      </div>
      <footer className={styles.footer}>
        <div className={styles.chapter}><span>{String(index + 1).padStart(2, '0')}<span className={styles.total}> / {CHAPTERS.length}</span></span><span>{chapter.category}</span></div>
        <div className={styles.position} aria-hidden="true">{CHAPTERS.map((item, i) => <span key={item.id} data-current={index === i} />)}</div>
        <div className={styles.footerNavigation}><span className={styles.scrollHint}>scroll to explore</span><button type="button" disabled={index === 0 || !openingDone} aria-label="Go to previous slide" onClick={() => navigate(index - 1)}>←</button><button type="button" disabled={index === CHAPTERS.length - 1 || !openingDone} aria-label="Go to next slide" onClick={() => navigate(index + 1)}>→</button></div>
      </footer>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{openingDone ? `${index + 1} of ${CHAPTERS.length}. ${chapter.label}.` : ''}</p>
    </div>
  </BrandProvider>
}

function Title({ eyebrow, children, description }: { eyebrow: string; children: ReactNode; description: ReactNode }) {
  return <div className={styles.editorial}><p className={styles.eyebrow}>{eyebrow}</p><h2>{children}</h2><p className={styles.description}>{description}</p></div>
}
function SlideContent({ index, read }: { index: number; read: (hash?: string) => void }) {
  if (index === 1) return <div className={styles.showcaseLayout}>
    <Title eyebrow="01 / the difference" description="The same source. The same words. A calmer way to watch them arrive.">same words.<br />a different arrival.</Title>
    <PresentationDemo compare />
  </div>
  if (index === 2) return <div className={styles.showcaseLayout}><Title eyebrow="02 / the signature" description="A complete thought finds its place. The rest of the answer keeps breathing.">one sentence.<br />then the next.</Title><PresentationDemo example="qualifier" compare /></div>
  if (index === 3) return <div className={styles.showcaseLayout}><Title eyebrow="03 / a lighter touch" description="For earlier reading, each eligible word settles where it belongs. The waiting field stays alive below it.">a word.<br />a little weight.</Title><PresentationDemo policy="word" example="split-word" compare /></div>
  if (index === 4) return <div className={styles.showcaseLayout}><Title eyebrow="04 / one arrival" description="Hold the answer until the source is finished. One smooth handover—with the cost of waiting longer to read.">the whole thought.<br />all at once.</Title><PresentationDemo policy="answer" example="list" compare /></div>
  if (index === 5) return <div className={styles.split}><Title eyebrow="05 / character" description="A spectrum wash, a quiet original, soft felt, or a sharper pulse. Each voice plays in turn. The words keep their contrast.">a familiar rhythm.<br />your own voice.</Title><PresentationDemo brands example="delayed-middle" /></div>
  if (index === 6) return <div className={styles.showcaseLayout}><Title eyebrow="06 / beyond the illustration" description="An original diffusion recording, with its actual timing and unedited answer. The motion changes how it arrives—not what the model says.">the real thing.<br />a steadier page.</Title><PresentationDemo recorded compare /></div>
  if (index === 7) return <div className={styles.showcaseLayout}><Title eyebrow="07 / a reading contract" description="Keep readable words still. Let the unfinished area carry the motion. Compare the same reply with still bars, breathing, or Reshape.">move the wait.<br />keep the words.</Title><PresentationDemo conditions example="code" compare /></div>
  if (index === 8) return <div className={styles.researchLayout} data-slide-scroll>
    <Title eyebrow="08 / evidence, with limits" description="Research gives me reasons to test a design. It doesn’t turn a pleasing animation into a proven reading benefit.">the feeling is designed.<br />the claims are bounded.</Title>
    <div className={styles.findings}>
      <article><span className={styles.findingNumber}>01</span><h3>Stability matters.</h3><p>Live-caption research connects unstable text with distraction and fatigue. I preserve text that is already readable.</p><a href="https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/" target="_blank" rel="noreferrer">Liu et al., 2023 ↗</a><small>Caption findings. Not a diffusion reading trial.</small></article>
      <article><span className={styles.findingNumber}>02</span><h3>Motion can compete.</h3><p>Traveling cues can attract attention—and distract. I keep frequent word arrivals local and the waiting motion contained.</p><a href="https://scholars.unh.edu/ccom/979/" target="_blank" rel="noreferrer">Bartram, Ware &amp; Calvert, 2003 ↗</a><small>A design constraint, not an optimum animation recipe.</small></article>
      <article><span className={styles.findingNumber}>03</span><h3>Familiar isn’t proven.</h3><p>Skeletons are a familiar web pattern. A small skeleton-versus-spinner study did not establish a perceived-speed advantage.</p><a href="https://doi.org/10.1145/3232078.3232086" target="_blank" rel="noreferrer">Mejtoft et al., 2018 ↗</a><small>The benefit of this treatment still needs testing.</small></article>
    </div><button type="button" className={styles.textLink} onClick={() => read('evidence')}>the full evidence and retired claims ↗</button>
  </div>
  if (index === 9) return <div className={styles.researchLayout} data-slide-scroll>
    <Title eyebrow="09 / the price of a smooth arrival" description="Three different things: when the source makes text eligible, how the page makes room, and how the words appear.">nothing arrives<br />for free.</Title>
    <div className={styles.metrics}>
      <article><strong>{(SETTLE.all60.sentence.recorded.medianFirstPassageAt! / 1000).toFixed(1)}<span>s</span></strong><h3>to the first sentence</h3><p>Median source eligibility in the 60-recording corpus, on the recorded setup. Not production latency.</p></article>
      <article><strong>180<span>ms</span></strong><h3>to make room, if needed</h3><p>A bounded fit before eligible text appears. Skipped when enough space is already available.</p></article>
      <article><strong>280<span>ms</span></strong><h3>for the material handover</h3><p>The sentence transition. Each-word ink uses a lighter 180 ms arrival. Browser scheduling can add time.</p></article>
    </div><button type="button" className={styles.textLink} onClick={() => read('cost')}>inspect policy costs and measurements ↗</button>
  </div>
  if (index === 10) return <div className={styles.limitsLayout} data-slide-scroll>
    <Title eyebrow="10 / what I still need to learn" description="A polished prototype is evidence that the interaction can work. It is not evidence that readers understand more, trust appropriately, or enjoy waiting.">a motion study.<br />not a promise.</Title>
    <div className={styles.questions}><p><span>01</span>Does it feel calmer with the source timing held equal?</p><p><span>02</span>Do readers mistake ambient movement for model certainty?</p><p><span>03</span>Does the handover help, or simply delay useful text?</p><button type="button" className={styles.textLink} onClick={() => read('open')}>the proposed reader study ↗</button></div>
  </div>
  return <div className={styles.colophon} data-slide-scroll>
    <div className={styles.colophonIntro}>
      <p className={styles.eyebrow}>11 / after the last word</p><h2>make the wait<br />worth watching.<br /><span>then let me read.</span></h2>
      <div className={styles.endLinks}><a href={SOURCE} target="_blank" rel="noreferrer">explore the source ↗</a><a href={`${SOURCE}/blob/main/docs/growing-skeleton-v8-handoff-2026-09-12.md`} target="_blank" rel="noreferrer">design &amp; engineering handoff ↗</a></div>
    </div>
    <a className={styles.studyCta} href="?view=reading" aria-label="View the full case study" onClick={event => {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); read() }
    }}>
      <svg className={styles.studyArrow} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M9 39 39 9M9 9h30v30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span>view the<br />full case<br />study.</span>
    </a>
    <div className={styles.colophonCredits}>
      <p className={styles.credit}>web design, motion design and implementation by<br /><strong>Christopher Robin Fiore</strong></p>
      <p className={styles.citation}>cite as: Christopher Robin Fiore (2026). <i>After Tokens: a skeleton motion study for generated text.</i><br />GitHub: globalanomalyindex</p>
    </div>
  </div>
}

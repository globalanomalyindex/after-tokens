# After Tokens — presentation handoff

By Christopher Robin Fiore. GitHub: globalanomalyindex.

## Design decision

I brought the motion to the front of the case study. The default view is a twelve-chapter, fullscreen presentation with large readable answers, restrained translucent surfaces, and a consistent left-to-right comparison. The full research article remains available through “read the study” and `?view=reading`.

The introduction describes diffusion text taking shape in several places at once. It demonstrates sentence-based arrival, then opens the presentation. Its canvas keeps the same opaque off-black (#181615) through fullscreen, docking and embedded states, preventing a darker flash during the zoom-out. It runs on every document reload; switching to the article in the same document does not replay it. Skip and reduced-motion behavior remain available.

This is a web and motion design proposal, with product integration constraints. A polished transition does not establish a reading, trust, or perceived-speed benefit.

## A different example for each question

| Chapter | Existing source | What it demonstrates |
| --- | --- | --- |
| A different arrival | SHOWCASE_REPLAY | Shared timing, same words, After Tokens first and raw prefix second |
| Each sentence | qualifier | A late qualification held inside a complete sentence |
| Each word | split-word | A word committed in pieces; local ink arrival without traveling pills |
| Whole answer | list | A numbered list held until source completion |
| Brand voices | delayed-middle | An opening and a later passage separated by a missing middle |
| Original recording | travel__lowconf-b32 | Unedited train-versus-plane answer on its recorded forward-pass clock |
| Waiting motion | code | Still, breathing and Reshape treatments on the same fenced-code example |

The fixtures and SHOWCASE_REPLAY come from the full study. Their synthetic timings are preserved and labeled illustrative. The travel recording is in the existing curated set and retains the original words and timing. The looped heron recording is removed from presentation and generic demo defaults. Historical corpus data and measurements remain intact: removing a failed answer from a showcase is not grounds to erase it from research.

Each comparison uses one replay clock. After Tokens stays left/first. Only its actual reply contains the percentage pill. The percentage is playback progress, not confidence or a prediction of a live model’s remaining work.

## Spectrum and automatic brand playback

Spectrum is an original multicolor wash informed by the blue, violet and warm-color gradient language associated with Gemini. It is not a Google identity or an affiliated product. Low-opacity radial color fields move behind solid, high-contrast answer text. Color never masks the words or encodes model certainty.

The sequence is Spectrum → After Tokens → Felt → Pulse. A voice changes 2.4 seconds after replay completion, leaving time for the bounded handover and a reading beat. Changing voices restarts the same source, making the material differences comparable. A manual selection pauses the cycle; “resume cycle” restarts automatic selection. Playback pause and hidden documents suspend advancement. Reduced motion uses manual selection and a still wash. The presentation chapters themselves never advance automatically.

The 12-second alternating wash uses small translation, rotation and scale on a contained background. It does not change the text layout or consume provisional word positions. This preserves the renderer’s source-only integration boundary: ambient movement can run without a token-confidence stream or advance knowledge of the final wording.

## Navigation and material

Scroll gestures, swipes, arrow controls and an index navigate chapters. One wheel gesture advances one chapter; inertial events are latched. Nested reply/article scrolling takes precedence while there is content left to read. Native inputs retain their interaction. Mobile layouts stack comparison panels and allow chapter content to scroll inside the fullscreen frame.

Glass is concentrated in navigation and subtle edges. Cursor sheen only changes a masked border highlight, using CSS variables; it does not reposition reading content. Touch and reduced-motion users receive a stable surface. Footer arrows offer complete 44-pixel targets alongside the cropped side previews.

References informing these constraints:

- [Apple materials guidance](https://developer.apple.com/design/human-interface-guidelines/materials): material as hierarchy and context, with readable foreground content.
- [WAI carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/): named navigation and explicit control of automatic movement.
- [WAI carousel controls](https://www.w3.org/WAI/tutorials/carousels/controls/): operable controls and pause behavior.

These references guide implementation. They do not validate this particular motion treatment. The research chapters preserve the distinction between live-caption stability evidence, attention constraints, small skeleton studies, and the proposed diffusion reader study.

## Integration instructions

The implementation uses the existing Next/React app and shared SettleAnswer renderer. No new runtime dependency is needed.

1. Use `CaseStudyExperience` in `app/page.tsx`, passing the original article as `ReadingStudy`.
2. Keep the original article sections inside `components/presentation/reading-study.tsx`.
3. Keep replay policy and ambient composition in the shared renderer. Presentation controls select existing policies; they do not invent a separate resolving engine.
4. Preserve `SkipOpeningContext` and `onOpeningComplete` in HeroIntro, and the original motion/reload tests.
5. Preserve the complete-pill animation override in `app/globals.css`: terminal fade must finish even if a replay has just paused at completion. Keep hidden pills hidden under reduced motion.
6. Keep the word-policy in-place transfer path. Other policies retain their existing material handover.
7. Keep `travel__lowconf-b32` as the generic recorded default rather than the excluded heron loop.
8. Run lint, type checking, units, observer guards, production build and browser tests. Verify Pages export separately before calling the published release complete.

## Verification scope

Current local checks: 395 unit/component tests, 166 observer guards, production build and lint passed. All nine presentation browser checks passed across Chromium, desktop WebKit and emulated iPhone WebKit. Those checks cover navigation, reduced motion, all twelve chapters with automated accessibility checks, brand cycling and pause, source identity, comparison order, and full-article access. Screenshots were inspected at desktop and 390 px, with horizontal control-bound checks at 1440, 390 and 320 px. Browser emulation is not a physical-device or reader study.

The full Chromium regression suite passed all 37 checks; the eight additional presentation checks passed in desktop and emulated iPhone WebKit. The terminal-pill contrast audit pauses through real controls before inspecting resting contrast, without excluding the pill. Publication status remains separate from local checks. Frozen v8 measurements retain their original revision and must not be relabeled as evidence for this presentation.

The percentage floats over the bottom-right of the scrolling answer viewport. Its translucent backdrop blurs the words beneath it. No separate footer space is reserved for the pill; scrolling text passes underneath while the pill stays anchored to the reply. The status remains in the answer flow.

## Exact presentation source

The following source snapshots make the design reproducible. Apply them with the existing shared renderer and the integration changes listed above; they are not a replacement for the model adapter or its source-contract tests.

### app/page.tsx

```tsx
import { CaseStudyExperience } from '@/components/presentation/case-study-experience'
import { ReadingStudy } from '@/components/presentation/reading-study'

export default function HomePage() {
  return <CaseStudyExperience reading={<ReadingStudy />} />
}

```

### components/presentation/case-study-experience.tsx

```tsx
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
  const finishOpening = useCallback(() => {
    setOpeningDone(true)
    if (pending.current) { setIndex(pending.current); pending.current = 0 }
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
      if (event.ctrlKey || menu || !openingDone || document.querySelector('[role="dialog"]')) return
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
    <p className={styles.eyebrow}>11 / after the last word</p><h2>make the wait<br />worth watching.<br /><span>then let me read.</span></h2>
    <div className={styles.endLinks}><button type="button" onClick={() => read()}>read the full study ↗</button><a href={SOURCE} target="_blank" rel="noreferrer">explore the source ↗</a><a href={`${SOURCE}/blob/main/docs/growing-skeleton-v8-handoff-2026-09-12.md`} target="_blank" rel="noreferrer">design &amp; engineering handoff ↗</a></div>
    <p className={styles.credit}>web design, motion design and implementation by<br /><strong>Christopher Robin Fiore</strong></p>
    <p className={styles.citation}>cite as: Christopher Robin Fiore (2026). <i>After Tokens: a skeleton motion study for generated text.</i><br />GitHub: globalanomalyindex</p>
  </div>
}

```

### components/presentation/presentation-demo.tsx

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { BrandProvider } from '@/lib/brand/provider'
import type { BrandId } from '@/lib/brand/types'
import type { Policy } from '@/lib/settle/types'
import type { TraceCompact } from '@/lib/diffusion/traces'
import { loadTrace } from '@/lib/traces/index'
import { replayTrace } from '@/lib/settle/replay'
import { DEMO_REPLAYS } from '@/lib/settle/fixtures'
import { SHOWCASE_REPLAY } from '@/lib/settle/showcase-replay'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { useReplay } from '@/components/settle/use-replay'
import type { AmbientCondition } from '@/components/settle/ambient-composition'
import styles from './presentation.module.css'

type Props = { policy?: Policy; compare?: boolean; brands?: boolean; conditions?: boolean; recorded?: boolean; example?: string }
const VOICES = ['spectrum', 'after-tokens', 'felt', 'pulse'] as const
type PresentationVoice = typeof VOICES[number]
const POLICIES: Array<{ id: Policy; label: string }> = [
  { id: 'sentence', label: 'each sentence' }, { id: 'word', label: 'each word' },
  { id: 'paragraph', label: 'each paragraph' }, { id: 'answer', label: 'whole answer' },
]

export function PresentationDemo({ policy: initialPolicy = 'sentence', compare = false, brands = false, conditions = false, recorded = false, example = 'showcase' }: Props) {
  const [policy, setPolicy] = useState(initialPolicy)
  const [brand, setBrand] = useState<PresentationVoice>(brands ? 'spectrum' : 'after-tokens')
  const [cycling, setCycling] = useState(true)
  const [condition, setCondition] = useState<AmbientCondition>('reshape')
  const [manualPause, setManualPause] = useState(false)
  const [visible, setVisible] = useState(true)
  const [trace, setTrace] = useState<TraceCompact | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!recorded) return
    let cancelled = false
    setError(false)
    loadTrace('travel__lowconf-b32').then(value => { if (!cancelled) setTrace(value) }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [recorded, attempt])
  const source = useMemo(() => recorded ? trace ? replayTrace(trace, 'recorded') : null : example === 'showcase' ? SHOWCASE_REPLAY : DEMO_REPLAYS.find(item => item.id === example) ?? SHOWCASE_REPLAY, [recorded, trace, example])
  const clock = useReplay(source, { policy, autoplay: true, runKey: `${policy}:${brand}:${condition}` })
  const { play, pause, finished } = clock
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden')
    update(); document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => { if (visible && !manualPause && !finished) play(); else pause() }, [visible, manualPause, finished, play, pause])
  useEffect(() => {
    if (!brands || !cycling || !visible || manualPause || clock.reducedMotion || !finished) return
    const timer = window.setTimeout(() => setBrand(value => VOICES[(VOICES.indexOf(value) + 1) % VOICES.length]!), 2400)
    return () => window.clearTimeout(timer)
  }, [brands, cycling, visible, manualPause, clock.reducedMotion, finished, brand])
  const paused = manualPause || !visible || clock.paused
  const restart = () => { setManualPause(false); clock.restart() }
  const palette = brands && brand !== 'after-tokens' && brand !== 'spectrum'
  const providerBrand: BrandId = brand === 'spectrum' ? 'after-tokens' : brand
  return <div className={styles.demo} data-presentation-demo data-example={recorded ? "travel__lowconf-b32" : example} data-voice={brand} data-cycling={cycling && !clock.reducedMotion} data-policy={policy} data-elapsed-ms={Math.round(clock.elapsedMs)}>
    <div className={styles.demoControls}>
      <label className={styles.selectLabel}>the page takes
        <select aria-label="The page takes" value={policy} onChange={e => { setManualPause(false); setPolicy(e.target.value as Policy) }}>
          {POLICIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <div className={styles.playControls}>
        <button type="button" disabled={!source || finished} onClick={() => setManualPause(value => !value)} aria-label={manualPause ? 'Resume example' : 'Pause example'}>{manualPause ? 'resume' : 'pause'}</button>
        <button type="button" disabled={!source} onClick={restart} aria-label="Replay example">replay ↺</button>
      </div>
    </div>
    {brands && <div className={styles.options} role="group" aria-label="Brand voice">
      {VOICES.map(id => <button key={id} type="button" aria-pressed={brand === id} onClick={() => { setCycling(false); setBrand(id) }}>{id === 'after-tokens' ? 'after tokens' : id}</button>)}
      <button type="button" disabled={clock.reducedMotion} aria-label={cycling ? 'Pause brand cycle' : 'Resume brand cycle'} onClick={() => setCycling(value => !value)}>{clock.reducedMotion ? 'manual · reduced motion' : cycling ? 'pause cycle' : 'resume cycle'}</button>
    </div>}
    {conditions && <div className={styles.options} role="group" aria-label="Waiting motion">
      {(['static', 'breathe', 'reshape'] as const).map(id => <button key={id} type="button" aria-pressed={condition === id} onClick={() => setCondition(id)}>{id === 'static' ? 'still' : id}</button>)}
    </div>}
    <div className={`${styles.demoPanels} ${compare ? styles.comparison : ''}`}>
      <BrandProvider brand={providerBrand} className={`${styles.replyCard} ${brand === 'spectrum' ? styles.spectrum : ''} ${palette ? 'frame' : 'stage'}`} data-glass data-after-tokens-reply
        style={{ background: palette ? 'var(--surface)' : 'rgba(255,255,255,.035)', color: palette ? 'var(--ink)' : 'var(--stage-text)' }}>
        {brand === 'spectrum' && <div className={styles.spectrumWash} aria-hidden="true" data-paused={paused} />}
        <div className={styles.replyHeader}><span>after tokens{brands ? ` · ${brand === 'after-tokens' ? 'original' : brand}` : ''}</span><span>{condition === 'static' ? 'still' : condition}</span></div>
        <div className={styles.answerScroll} data-slide-scroll tabIndex={0} role="region" aria-label="Scrollable After Tokens reply">
          {error ? <div className={styles.loadError}><p>The recording couldn’t be loaded.</p><button type="button" onClick={() => setAttempt(n => n + 1)}>try again</button></div>
            : <SettleAnswer state={clock.state} runId={clock.runId} progress={clock.progress} ambient={condition} motion={!clock.reducedMotion} paused={paused || !source} className={styles.answer} label="After Tokens example answer" />}
        </div>
      </BrandProvider>
      {compare && <div className={`${styles.replyCard} ${styles.baseline}`} data-raw-reply>
        <div className={styles.replyHeader}><span>the raw prefix</span><span>same source</span></div>
        <div className={styles.answerScroll} data-slide-scroll tabIndex={0} role="region" aria-label="Scrollable raw prefix">
          <p className={styles.raw} aria-label="Raw prefix example" role="region">{clock.state.prefix.slice(0, clock.state.wordSafeLength)}{clock.state.prefix.length > clock.state.wordSafeLength && <mark>{clock.state.prefix.slice(clock.state.wordSafeLength)}</mark>}{!clock.state.prefix && <span className={styles.rawWaiting}>waiting for the first fragment</span>}</p>
        </div>
      </div>}
    </div>
    <p className={styles.demoNote}>{recorded ? 'Train or plane · original model recording · unedited words · forward-pass timing.' : 'Illustrative reply · authored timing.'} Percentages track playback.</p>
  </div>
}

```

### components/presentation/presentation.module.css

```css
.experience {
  --deck-bg: #181615; --deck-ink: #f5f2ee; --deck-muted: #b6b0aa;
  background: var(--deck-bg); color: var(--deck-ink); font-family: var(--font-ui), system-ui, sans-serif;
  height: 100dvh; min-height: 480px; overflow: hidden;
}
.shell { position: relative; isolation: isolate; height: 100%; overflow: hidden; --cursor-x: 50vw; --cursor-y: 40vh; }
.shell::before { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: -1; background: radial-gradient(ellipse at 50% -25%, #ffffff05, transparent 65%); }
.header { height: 88px; padding: 0 clamp(28px, 5vw, 88px); display: flex; align-items: center; gap: 32px; position: relative; z-index: 20; }
.wordmark { display: inline-flex; gap: 9px; align-items: center; font-family: var(--font-ui); font-size: 20px; letter-spacing: -.07em; font-weight: 550; white-space: nowrap; cursor: pointer; }
.wordmarkDot { width: 5px; height: 5px; border-radius: 50%; background: #dcd5c9; }
.headerDescription { font-size: 12px; color: var(--deck-muted); letter-spacing: -.01em; }
.headerActions { display: flex; align-items: center; gap: 28px; margin-left: auto; font-size: 12px; }
.headerActions button, .endLinks button, .endLinks a, .textLink { cursor: pointer; min-height: 44px; text-align: left; }
.headerActions button:last-child { display: flex; align-items: center; gap: 20px; }
.shell button:focus-visible, .shell a:focus-visible, .shell select:focus-visible { outline: 2px solid #e9dfd1; outline-offset: 5px; border-radius: 5px; }
.shell button:disabled { opacity: .25; cursor: default; }
.viewport { position: absolute; inset: 88px clamp(66px, 6.5vw, 120px) 80px; }
.slide { width: 100%; height: 100%; min-height: 0; display: flex; align-items: center; animation: slideIn 580ms cubic-bezier(.22, 1, .36, 1) both; }
.slide[data-direction='-1'] { --slide-from: -24px; }
@keyframes slideIn { from { opacity: 0; transform: translateX(var(--slide-from, 24px)); } to { opacity: 1; transform: none; } }
.split { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); gap: clamp(36px, 5vw, 92px); align-items: center; width: 100%; max-height: 100%; }
.editorial { min-width: 0; }
.eyebrow { font-size: 11px; color: var(--deck-muted); margin: 0 0 30px; line-height: 1.4; letter-spacing: .02em; }
.editorial h2, .colophon h2 { color: var(--deck-ink); font-family: var(--font-ui); font-size: clamp(42px, 5.05vw, 86px); line-height: 1.035; font-weight: 460; letter-spacing: -.065em; margin: 0; text-wrap: balance; }
.description { font-size: clamp(16px, 1.3vw, 20px); line-height: 1.55; letter-spacing: -.018em; color: var(--deck-muted); max-width: 32ch; margin: 32px 0 0; }
.demo { min-width: 0; width: 100%; }
.demoControls { display: flex; justify-content: space-between; gap: 12px; align-items: center; min-height: 44px; margin-bottom: 15px; font-size: 11px; color: var(--deck-muted); }
.selectLabel { display: flex; align-items: center; gap: 12px; }
.selectLabel select { padding: 10px 24px 10px 12px; border: 1px solid #ffffff1c; background-color: #ffffff05; color: var(--deck-ink); border-radius: 999px; cursor: pointer; font-size: 12px; max-width: 150px; }
.selectLabel option { background: #282524; color: #fff; }
.playControls { display: flex; gap: 16px; }
.playControls button { min-height: 44px; cursor: pointer; }
.demoPanels { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; }
.comparison { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.replyCard {
  position: relative; isolation: isolate; min-width: 0; background: #ffffff05; color: var(--deck-ink);
  border-radius: 26px; border: 1px solid #ffffff12; padding: clamp(22px, 2.6vw, 42px);
  box-shadow: inset 0 1px 1px #ffffff07, 0 18px 70px #0000000c;
}
.replyCard::before { content: ''; pointer-events: none; position: absolute; inset: -1px; border: 1px solid #ffffff0c; border-radius: inherit; }
.replyHeader { display: flex; align-items: center; justify-content: space-between; font-size: 11px; opacity: .8; margin-bottom: 30px; letter-spacing: -.01em; }
.replyHeader span:last-child { opacity: .72; }
.answerScroll { overflow: auto; scrollbar-width: thin; scrollbar-color: #ffffff22 transparent; min-height: 260px; max-height: min(49dvh, 600px); overscroll-behavior: contain; }
.answer { font-size: clamp(22px, 2.25vw, 34px); line-height: 1.42; letter-spacing: -.028em; }
.answer :global(.settle-margin) { margin-top: 22px; font-size: 11px; letter-spacing: 0; }
.answer :global([data-demo-progress]) { font-size: 12px; }
.raw { font-family: var(--font-ui); font-size: clamp(22px, 2.25vw, 34px); line-height: 1.42; letter-spacing: -.028em; white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; }
.raw mark { color: inherit; background: #ffffff12; text-decoration: underline; text-decoration-color: #ffffff40; text-underline-offset: 4px; }
.rawWaiting { font-size: 15px; color: var(--deck-muted); }
.baseline { color: var(--stage-text); }
.raw { text-transform: none; }
.demoNote { font-size: 10px; line-height: 1.5; color: var(--deck-muted); margin: 14px 4px 0; letter-spacing: 0; }
.options { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 16px; }
.options button { padding: 9px 15px; border-radius: 999px; border: 1px solid #ffffff1a; min-height: 44px; cursor: pointer; font-size: 12px; color: var(--deck-muted); }
.options button[aria-pressed='true'] { background: #f1ebe0; border-color: #f1ebe0; color: #25211e; }
.loadError { font-size: 20px; line-height: 1.5; padding: 30px 0; }.loadError button { margin-top: 16px; text-decoration: underline; cursor: pointer; }
.showcaseLayout { width: 100%; max-height: 100%; display: grid; gap: 26px; }
.showcaseLayout .editorial { display: grid; grid-template-columns: 1.3fr 1fr; column-gap: 36px; align-items: end; }
.showcaseLayout .eyebrow { grid-column: 1 / -1; margin-bottom: 16px; }
.showcaseLayout .editorial h2 { font-size: clamp(42px, 4.6vw, 72px); }
.showcaseLayout .description { margin: 0; max-width: 30ch; justify-self: end; padding-bottom: 4px; }
.showcaseLayout .answerScroll { min-height: 220px; max-height: 35dvh; }
.showcaseLayout .answer, .showcaseLayout .raw { font-size: clamp(22px, 2vw, 30px); }
.opening { width: 100%; min-width: 0; --hero-slot-height: calc(100dvh - 226px); --hero-answer-size: clamp(23px, 2.35vw, 34px); --hero-prompt-size: clamp(18px, 1.5vw, 23px); }
/* One opaque material across pending, fullscreen, docking and embedded states. */
.opening :global([data-hero-canvas]) { background: var(--deck-bg); }
.opening :global([data-hero-canvas][data-presentation='embedded']) { border: 1px solid #ffffff10; }
.opening :global([data-hero-intro] > figcaption) { color: var(--deck-muted); }
.opening :global([data-hero-intro] > figcaption > span) { font-family: var(--font-ui); font-size: 10px; }
.edge {
  position: absolute; z-index: 10; top: 25%; bottom: 25%; width: 70px; overflow: hidden; cursor: pointer;
  border: 1px solid #ffffff20; border-radius: 22px; background: #ffffff04;
  -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px);
  box-shadow: inset 0 1px 1px #ffffff1a, 0 20px 60px #0000001a;
  transition: background 200ms, opacity 200ms;
}
.edge::before { content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit; background: radial-gradient(220px circle at var(--glass-x, 50%) var(--glass-y, 0%), #ffffff14, transparent 70%); }
.previous { left: -33px; }.next { right: -33px; }
.edgeArrow { position: absolute; top: 50%; transform: translateY(-50%); font-size: 18px; line-height: 1; }
.previous .edgeArrow { right: 10px; }.next .edgeArrow { left: 10px; }
.edgeLabel { position: absolute; top: 50%; opacity: 0; font-size: 10px; white-space: nowrap; }
.footer { height: 80px; position: absolute; bottom: 0; left: 0; right: 0; display: flex; align-items: center; padding: 0 clamp(28px, 5vw, 88px); justify-content: space-between; gap: 24px; font-size: 11px; color: var(--deck-muted); }
.chapter { display: flex; gap: 28px; align-items: center; }.chapter > span:first-child { color: var(--deck-ink); font-variant-numeric: tabular-nums; }.total { color: #97918b; }
.position { display: flex; gap: 5px; align-items: center; }.position > span { height: 3px; width: 10px; border-radius: 999px; background: #ffffff22; transition: width 250ms, background 250ms; }.position > span[data-current='true'] { width: 27px; background: #e8e1d6; }
.scrollHint { display: flex; align-items: center; gap: 14px; }.scrollHint > span { font-size: 18px; }
.indexMenu { position: absolute; z-index: 30; top: 74px; right: clamp(28px, 5vw, 88px); width: 300px; padding: 14px; background: #252221ed; border: 1px solid #ffffff25; border-radius: 20px; backdrop-filter: blur(22px); box-shadow: 0 25px 70px #0006; max-height: calc(100dvh - 160px); overflow: auto; }
.indexMenu button { display: flex; gap: 18px; width: 100%; padding: 9px 14px; min-height: 40px; font-size: 13px; border-radius: 9px; cursor: pointer; text-align: left; }
.indexMenu button span { font-size: 10px; color: var(--deck-muted); width: 18px; font-variant-numeric: tabular-nums; }
.indexMenu button[aria-current='step'] { background: #ffffff0d; }
.researchLayout { width: 100%; max-height: 100%; overflow: auto; overscroll-behavior: contain; padding: 12px 0; scrollbar-width: thin; }
.researchLayout .description { max-width: 58ch; }
.researchLayout .editorial h2 { font-size: clamp(44px, 4.6vw, 76px); }
.findings, .metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; margin-top: clamp(34px, 5vh, 70px); }
.findings article, .metrics article { border-top: 1px solid #ffffff26; padding-top: 24px; }
.findingNumber { font-size: 10px; color: var(--deck-muted); }
.findings h3, .metrics h3 { font-family: var(--font-ui); font-weight: 450; font-size: 23px; letter-spacing: -.035em; line-height: 1.2; margin: 18px 0 14px; }
.findings p, .metrics p { font-size: 15px; line-height: 1.55; color: var(--deck-muted); max-width: 36ch; }
.findings a { display: block; font-size: 12px; margin-top: 22px; text-decoration: underline; text-underline-offset: 4px; }
.findings small { display: block; font-size: 11px; color: var(--deck-muted); margin-top: 12px; line-height: 1.5; }
.textLink { display: inline-flex; align-items: center; margin-top: 24px; font-size: 13px; text-decoration: underline; text-underline-offset: 5px; }
.metrics strong { display: block; font-size: clamp(60px, 6vw, 100px); letter-spacing: -.075em; font-weight: 400; line-height: 1.1; }
.metrics strong span { font-size: 20px; margin-left: 6px; letter-spacing: -.03em; color: var(--deck-muted); }
.limitsLayout { display: grid; grid-template-columns: 1fr 1fr; gap: 7vw; align-items: center; width: 100%; max-height: 100%; overflow: auto; }
.questions p { padding: 24px 0; border-top: 1px solid #ffffff22; display: flex; align-items: baseline; gap: 18px; font-size: clamp(22px, 2vw, 30px); letter-spacing: -.04em; line-height: 1.3; }
.questions p span { font-size: 11px; letter-spacing: 0; color: var(--deck-muted); }
.colophon { width: 100%; padding: 20px 0; max-height: 100%; overflow: auto; }.colophon h2 { font-size: clamp(54px, 6.9vw, 112px); }.colophon h2 > span { color: #a8a19a; }
.endLinks { display: flex; gap: 32px; flex-wrap: wrap; margin-top: 36px; font-size: 13px; }
.credit { margin-top: 32px; font-size: 13px; line-height: 1.7; color: var(--deck-muted); }.credit strong { font-size: 17px; color: var(--deck-ink); font-weight: 450; }.citation { font-size: 11px; line-height: 1.7; color: var(--deck-muted); margin-top: 16px; }
.backToSlides { position: fixed; z-index: 9900; bottom: 18px; right: 20px; padding: 13px 19px; background: #242120ef; border: 1px solid #ffffff30; border-radius: 999px; color: #f6f1e7; font-family: var(--font-ui); font-size: 12px; box-shadow: 0 5px 24px #0002; cursor: pointer; backdrop-filter: blur(15px); }
@media (hover: hover) and (pointer: fine) { .edge:hover { background: #ffffff0b; }.indexMenu button:hover { background: #ffffff0a; }.headerActions button:hover, .textLink:hover, .endLinks a:hover { color: #fff; } }
@media (min-width: 1600px) { .viewport { max-width: 1500px; margin-inline: auto; }.answerScroll { min-height: 350px; } }
@media (max-height: 740px) and (min-width: 901px) {
  .header { height: 64px; }.footer { height: 58px; }.viewport { top: 68px; bottom: 58px; }
  .editorial h2 { font-size: clamp(40px, 4.4vw, 65px); }.eyebrow { margin-bottom: 20px; }.description { margin-top: 22px; font-size: 16px; }
  .replyCard { padding: 24px; }.replyHeader { margin-bottom: 20px; }.answerScroll { min-height: 210px; max-height: 40dvh; }.answer, .raw { font-size: 24px; }
  .showcaseLayout { gap: 16px; }.showcaseLayout .answerScroll { max-height: 27dvh; min-height: 150px; }.showcaseLayout .editorial h2 { font-size: 42px; }
  .opening { --hero-slot-height: calc(100dvh - 174px); --hero-answer-size: 25px; }
  .findings, .metrics { margin-top: 30px; }.researchLayout .description { margin-top: 18px; }
}
@media (max-width: 900px) {
  .header { padding-inline: 24px; height: 70px; gap: 18px; }.headerDescription { display: none; }.headerActions { gap: 20px; }
  .viewport { inset: 78px 46px 66px; }.footer { height: 66px; padding-inline: 24px; }.chapter { gap: 14px; }.position { display: none; }
  .slide { align-items: flex-start; overflow-y: auto; scrollbar-width: none; }
  .split { grid-template-columns: minmax(0, 1fr); gap: 26px; padding-block: 12px 20px; max-height: none; }
  .editorial h2 { font-size: clamp(40px, 7vw, 68px); }.eyebrow { margin-bottom: 18px; }.description { max-width: 48ch; font-size: 16px; margin-top: 18px; }
  .answer, .raw { font-size: 24px; }.answerScroll { min-height: 190px; max-height: 42dvh; }.replyCard { padding: 25px; border-radius: 22px; }
  .showcaseLayout { padding-block: 12px 20px; max-height: none; }.showcaseLayout .editorial { grid-template-columns: 1fr; }.showcaseLayout .description { justify-self: start; margin-top: 18px; }.showcaseLayout .editorial h2 { font-size: 48px; }
  .comparison { grid-template-columns: 1fr; }.showcaseLayout .answerScroll { min-height: 180px; max-height: 35dvh; }.showcaseLayout .baseline .answerScroll { min-height: 120px; }.showcaseLayout .answer, .showcaseLayout .raw { font-size: 23px; }
  .edge { width: 58px; top: 32%; bottom: 32%; }.previous { left: -34px; }.next { right: -34px; }.previous .edgeArrow { right: 6px; }.next .edgeArrow { left: 6px; }
  .opening { --hero-slot-height: calc(100dvh - 218px); --hero-answer-size: 24px; --hero-prompt-size: 19px; }.openingSlide { overflow: visible; align-items: center; }
  .researchLayout, .limitsLayout, .colophon { overflow: visible; max-height: none; padding-bottom: 30px; }.researchLayout .editorial h2 { font-size: 46px; }
  .findings, .metrics { gap: 28px; grid-template-columns: 1fr; margin-top: 30px; }.findings article, .metrics article { padding-top: 20px; }.findings h3 { margin-top: 12px; }.findings p { max-width: 48ch; }.findings a { margin-top: 14px; }
  .metrics strong { font-size: 80px; }.metrics h3 { margin-top: 8px; }.metrics p { max-width: 45ch; }
  .limitsLayout { grid-template-columns: 1fr; gap: 30px; }.questions p { font-size: 24px; }
  .colophon h2 { font-size: 52px; }.endLinks { flex-direction: column; gap: 8px; }.credit { margin-top: 24px; }
}
@media (max-width: 480px) {
  .experience { min-height: 400px; }.header { padding-inline: 18px; height: 62px; }.wordmark { font-size: 18px; }.headerActions { gap: 16px; font-size: 11px; }.headerActions button:last-child { gap: 8px; }
  .viewport { inset: 68px 30px 58px; }.footer { padding-inline: 18px; height: 58px; font-size: 10px; }.chapter { gap: 12px; }.scrollHint { gap: 8px; font-size: 10px; }
  .editorial h2 { font-size: 40px; }.description { font-size: 15px; }.eyebrow { font-size: 10px; }
  .replyCard { padding: 20px 18px; border-radius: 19px; }.replyHeader { margin-bottom: 20px; font-size: 10px; }.answer, .raw { font-size: 22px; }.demoNote { font-size: 9px; }
  .demoControls { gap: 8px; font-size: 10px; flex-wrap: wrap; }.selectLabel { gap: 7px; }.selectLabel select { padding: 9px 18px 9px 10px; font-size: 11px; }.playControls { gap: 12px; }
  .showcaseLayout .editorial h2 { font-size: 39px; }.showcaseLayout .answer, .showcaseLayout .raw { font-size: 22px; }
  .edge { width: 48px; border-radius: 18px; }.previous { left: -32px; }.next { right: -32px; }.edgeArrow { font-size: 14px; }.previous .edgeArrow { right: 2px; }.next .edgeArrow { left: 2px; }
  .opening { --hero-slot-height: calc(100dvh - 204px); --hero-answer-size: 22px; --hero-prompt-size: 18px; }
  .researchLayout .editorial h2 { font-size: 38px; }.colophon h2 { font-size: 43px; }.indexMenu { right: 18px; top: 60px; width: min(300px, calc(100vw - 36px)); }
}
@media (prefers-reduced-motion: reduce) { .slide { animation: none; }.edge, .position > span { transition: none; }.edge::before { display: none; } }

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .replyCard::after { content: ""; position: absolute; inset: -1px; padding: 1px; border-radius: inherit; pointer-events: none; background: radial-gradient(400px circle at var(--glass-x, 50%) var(--glass-y, 0%), #ffffff38, transparent 70%); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
}

.footerNavigation { display: flex; align-items: center; gap: 6px; }.footerNavigation button { width: 44px; height: 44px; border: 1px solid #ffffff1a; border-radius: 50%; font-size: 17px; background: #ffffff04; cursor: pointer; }.footerNavigation .scrollHint { margin-right: 12px; }
@media(max-width: 480px) { .footerNavigation .scrollHint { display: none; } }

/* An original spectrum material: color behind solid ink, never a text mask. */
.spectrum { overflow: hidden; }
.spectrumWash { position: absolute; inset: 0; z-index: -1; pointer-events: none; border-radius: inherit; overflow: hidden; }
.spectrumWash::before { content: ''; position: absolute; inset: -30%; background: radial-gradient(ellipse at 12% 22%, #4285f04a, transparent 48%), radial-gradient(ellipse at 85% 16%, #a775ff45, transparent 43%), radial-gradient(ellipse at 72% 85%, #ef779c32, transparent 44%), radial-gradient(ellipse at 15% 85%, #62cbb32e, transparent 40%); animation: spectrumDrift 12s ease-in-out infinite alternate; }
.spectrumWash[data-paused='true']::before { animation-play-state: paused; }
@keyframes spectrumDrift { from { transform: translate3d(-3%, -2%, 0) rotate(-4deg) scale(1); } to { transform: translate3d(3%, 2%, 0) rotate(5deg) scale(1.08); } }
@media (prefers-reduced-motion: reduce) { .spectrumWash::before { animation: none; } }
@media (max-width: 360px) { .headerActions { gap: 8px; }.headerActions button:last-child { gap: 4px; }.wordmark { font-size: 16px; }.options { gap: 6px; }.options button { padding-inline: 11px; }.chapter { gap: 8px; }.footer { gap: 8px; } }

/* Glass progress floats over the scrolling answer; no separate footer shelf. */
.answer { position: static; }
.answer :global(.settle-margin) { margin-top: 22px; padding-right: 78px; }
.answer :global([data-demo-progress]) { position: absolute; right: clamp(22px, 2.6vw, 42px); bottom: clamp(22px, 2.6vw, 42px); z-index: 3; background: color-mix(in oklab, var(--stage) 35%, transparent); box-shadow: 0 2px 12px #00000010, inset 0 1px 0 #ffffff12; }
.replyCard:global(.frame) .answer :global([data-demo-progress]) { background: color-mix(in oklab, var(--surface) 35%, transparent); }
@media (max-height: 740px) and (min-width: 901px) { .answer :global([data-demo-progress]) { right: 24px; bottom: 24px; } }
@media (max-width: 900px) { .answer :global([data-demo-progress]) { right: 25px; bottom: 25px; } }
@media (max-width: 480px) { .answer :global([data-demo-progress]) { right: 18px; bottom: 20px; } }

```

### components/presentation/reading-study.tsx

```tsx
import { BrandProvider } from '@/lib/brand/provider'
import { SectionNav } from '@/components/chrome/section-nav'
import { SiteFooter } from '@/components/chrome/site-footer'
import { ScrollProgress } from '@/components/chrome/scroll-progress'
import { SectionHook } from '@/components/sections/section-hook'
import { SectionShowcase } from '@/components/sections/section-showcase'
import { SectionProblem } from '@/components/sections/section-problem'
import { SectionAudit } from '@/components/sections/section-audit'
import { SectionContract } from '@/components/sections/section-contract'
import { SectionField } from '@/components/sections/section-field'
import { SectionCost } from '@/components/sections/section-cost'
import { SectionVoice } from '@/components/sections/section-voice'
import { SectionPreviews } from '@/components/sections/section-previews'
import { SectionConcept } from '@/components/sections/section-concept'
import { SectionPlayground } from '@/components/sections/section-playground'
import { SectionEvidence } from '@/components/sections/section-evidence'
import { SectionOpen } from '@/components/sections/section-open'

// The case study in reading order: the opening, the live comparison, the wrong shape, the
// audit of the version before, the contract, the field, the cost, the voice,
// the surface in products, the wait as a product moment, the playground,
// what is known, and what is open.
export function ReadingStudy() {
  return (
    <BrandProvider brand="after-tokens" as="main" className="min-h-screen">
      <SectionHook />
      <SectionShowcase />
      <SectionProblem />
      <SectionAudit />
      <SectionContract />
      <SectionField />
      <SectionCost />
      <SectionVoice />
      <SectionPreviews />
      <SectionConcept />
      <SectionPlayground />
      <SectionEvidence />
      <SectionOpen />
      <SiteFooter />
      <SectionNav />
      <ScrollProgress />
    </BrandProvider>
  )
}

```

## Shared component integration patch

Apply against prior main `143aa292ecd593666b955456e688401f04a14e68`, which already includes word-local transfer. The final focused overlay check passed in all three browser configurations, including actual computed backdrop blur and stationary placement while the answer scrolls.

```diff
diff --git a/app/globals.css b/app/globals.css
index 7cfa9a0..18be319 100644
--- a/app/globals.css
+++ b/app/globals.css
@@ -1037,6 +1037,8 @@ html[data-motion="on"] [data-in="true"] .lock-map .lm-ref {
 .settle[data-visible="false"] *,
 .settle[data-visible="false"] *::before,
 .settle[data-visible="false"] *::after { animation-play-state: paused !important; }
+/* Completion exits finish even when ambient activity pauses offscreen. */
+.settle [data-demo-progress][data-complete="true"] { animation-play-state: running !important; }
 .settle-unit[data-state="end"] .settle-candidate { inline-size: .5ch; }
 .settle-unit[data-state="end"] .settle-ambient { animation: none; opacity: .25; }
 /* The legend remains a static key for the source states. */
@@ -1062,7 +1064,7 @@ html[data-motion="on"] [data-in="true"] .lock-map .lm-ref {
   gap: 0.6rem;
   margin-top: 0.7rem;
   min-height: 16px;
-  color: color-mix(in oklab, currentColor 72%, transparent);
+  color: var(--settle-ink, currentColor);
 }
 .settle-mark {
   position: relative;
diff --git a/components/settle/demo-progress.module.css b/components/settle/demo-progress.module.css
index 411fce0..b37e905 100644
--- a/components/settle/demo-progress.module.css
+++ b/components/settle/demo-progress.module.css
@@ -2,17 +2,17 @@
   display: inline-flex; align-items: baseline; justify-content: center; gap: .12rem;
   flex-shrink: 0; min-width: 3.6rem; padding: .55rem .7rem; margin-left: auto;
   border-radius: 999px; font-family: var(--font-ui); font-weight: 400; letter-spacing: normal; line-height: 1; font-size: 12px; font-variant-numeric: tabular-nums;
-  color: color-mix(in oklab, currentColor 78%, transparent);
-  background: color-mix(in oklab, currentColor 5%, transparent);
+  color: inherit;
+  background: color-mix(in oklab, currentColor 3%, transparent);
   border: 1px solid color-mix(in oklab, currentColor 9%, transparent);
-  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
+  -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
   box-shadow: inset 0 1px 0 color-mix(in oklab, currentColor 4%, transparent);
   pointer-events: none;
 }
-.percent { opacity: .6; font-size: inherit; }
-.progress[data-complete='true'] { animation: progressExit 420ms cubic-bezier(.22, 1, .36, 1) 160ms both; }
-.progress[data-hidden='true'] { visibility: hidden; }
-@keyframes progressExit { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(3px) scale(.97); } }
+.percent { font-size: inherit; }
+.progress[data-complete='true'] { animation: progressExit 420ms cubic-bezier(.22, 1, .36, 1) 160ms both; animation-play-state: running !important; }
+.progress[data-hidden='true'] { visibility: hidden; animation: none !important; }
+@keyframes progressExit { from { opacity: 1; transform: none; visibility: visible; } to { opacity: 0; transform: translateY(3px) scale(.97); visibility: hidden; } }
 
 .progress[data-motion="false"][data-complete="true"] { animation: none; opacity: 0; }
 @media (prefers-reduced-motion: reduce) { .progress[data-complete="true"] { animation: none; opacity: 0; } }
diff --git a/components/settle/hero-intro.module.css b/components/settle/hero-intro.module.css
index 4b72403..224415a 100644
--- a/components/settle/hero-intro.module.css
+++ b/components/settle/hero-intro.module.css
@@ -1,5 +1,5 @@
 .root { margin: 0; min-width: 0; outline: none; }
-.slot { position: relative; height: 43rem; }
+.slot { position: relative; height: var(--hero-slot-height, 43rem); }
 .canvas {
   --hero-pad: clamp(1.25rem, 4vw, 3rem);
   position: absolute;
@@ -24,7 +24,7 @@
   padding: .95rem 1.35rem;
   border-radius: 1.5rem 1.5rem .4rem 1.5rem;
   background: color-mix(in oklab, var(--stage-text) 8%, var(--stage));
-  font-family: var(--font-ui); font-size: clamp(1rem, 1.6vw, 1.2rem);
+  font-family: var(--font-ui); font-size: var(--hero-prompt-size, clamp(1rem, 1.6vw, 1.2rem));
   line-height: 1.5; text-align: left;
 }
 .promptSpace, .promptInk { grid-area: 1 / 1; min-width: 0; overflow-wrap: break-word; }
@@ -39,7 +39,7 @@
   animation: open 320ms cubic-bezier(.23, 1, .32, 1) both;
 }
 .replyLabel { display: block; margin-bottom: 1rem; font-family: var(--font-mono), monospace; font-size: 10px; line-height: 1.2; letter-spacing: .06em; opacity: .58; }
-.answer { font-size: clamp(1.125rem, 1.9vw, 1.625rem); line-height: 1.45; letter-spacing: -.018em; }
+.answer { font-size: var(--hero-answer-size, clamp(1.125rem, 1.9vw, 1.625rem)); line-height: 1.45; letter-spacing: -.018em; }
 .sceneFooter { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem 1.5rem; flex-shrink: 0; min-height: 2.75rem; padding-top: .75rem; font-family: var(--font-mono), monospace; font-size: 10px; }
 .provenance { opacity: .52; }
 .sceneControls { display: flex; gap: 1.25rem; align-items: center; margin-left: auto; }
@@ -58,7 +58,7 @@
 @keyframes caret { 50% { opacity: 0; } }
 @keyframes open { from { opacity: 0; transform: translateY(6px) scale(.985); } to { opacity: 1; transform: none; } }
 @media (max-width: 640px) {
-  .slot { height: 45rem; }
+  .slot { height: var(--hero-slot-height, 45rem); }
   .canvas { padding-top: max(1.2rem, env(safe-area-inset-top)); padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
   .conversation { padding-block: 1.5rem; }
   .prompt { padding: .85rem 1rem; max-width: 100%; }
diff --git a/components/settle/hero-intro.tsx b/components/settle/hero-intro.tsx
index b5d64a6..f4ed752 100644
--- a/components/settle/hero-intro.tsx
+++ b/components/settle/hero-intro.tsx
@@ -1,6 +1,6 @@
 'use client'
 
-import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
+import { createContext, useContext, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
 import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
 import { createSettleState, reduceSettle } from '@/lib/settle/reader'
 import type { Replay } from '@/lib/settle/types'
@@ -11,10 +11,10 @@ import { DemoProgress } from './demo-progress'
 
 const QUESTION = 'What should diffusion text rendering look like?'
 const SENTENCES = [
-  'It should feel like a thought taking shape.\n',
-  'Complete sentences find their place while the rest keeps breathing.\n',
-  'Each arrival has a little weight, then settles into something you can read.\n',
-  'Welcome to After Tokens, a motion study of how generated words arrive.',
+  'Diffusion text can take shape in several places at once.\n',
+  'It doesn’t have to arrive one word after another.\n',
+  'Here, complete sentences settle while the rest of the answer keeps forming.\n',
+  'Welcome to After Tokens, a different arrival for the same words.',
 ]
 const WELCOME = SENTENCES.join('')
 // These are authored immutable commitments, not captured model output or
@@ -38,13 +38,15 @@ const INTRO: Replay = {
 }
 const STATIC_ANSWER = INTRO.events.reduce(reduceSettle, createSettleState('sentence'))
 type Presentation = 'pending' | 'fullscreen' | 'docking' | 'embedded'
+export const SkipOpeningContext = createContext(false)
 
-export function HeroIntro() {
+export function HeroIntro({ onOpeningComplete }: { onOpeningComplete?: () => void } = {}) {
   const root = useRef<HTMLElement>(null)
   const slot = useRef<HTMLDivElement>(null)
   const canvas = useRef<HTMLDivElement>(null)
   const skipButton = useRef<HTMLButtonElement>(null)
   const openingDecided = useRef(false)
+  const openingReported = useRef(false)
   const dockAnimation = useRef<Animation | null>(null)
   const dockFallback = useRef<ReturnType<typeof setTimeout> | null>(null)
   const [presentation, setPresentation] = useState<Presentation>('pending')
@@ -56,6 +58,7 @@ export function HeroIntro() {
   const [showStatic, setShowStatic] = useState(false)
   const [visualReady, setVisualReady] = useState(false)
   const reduced = usePrefersReducedMotion()
+  const skipOpening = useContext(SkipOpeningContext)
   const titleId = useId()
   const clock = useReplay(INTRO, { policy: 'sentence', autoplay: false })
   const { play, pause } = clock
@@ -93,11 +96,17 @@ export function HeroIntro() {
     openingDecided.current = true
     // Every document load gets the opening, regardless of visit history,
     // hash links or restored scroll. Reduced motion keeps the static exchange.
-    const bypass = reduced
+    const bypass = reduced || skipOpening
     setShowStatic(bypass)
     setPresentation(bypass ? 'embedded' : 'fullscreen')
-  }, [hydrated, reduced])
+  }, [hydrated, reduced, skipOpening])
   useEffect(() => { if (reduced && hydrated) skip() }, [reduced, hydrated, skip])
+  useEffect(() => {
+    if (hydrated && presentation === 'embedded' && !openingReported.current) {
+      openingReported.current = true
+      onOpeningComplete?.()
+    }
+  }, [hydrated, presentation, onOpeningComplete])
   useEffect(() => { if (active) play(); else pause() }, [active, play, pause])
 
   useLayoutEffect(() => {
@@ -218,7 +227,7 @@ export function HeroIntro() {
           </div>
         </div>
         <div className={styles.sceneFooter}>
-          <span className={styles.provenance}>authored introduction · prewritten words</span>
+          <span className={styles.provenance}>web &amp; motion design</span>
           {expanded && <div className={styles.sceneControls}>
             <button type="button" disabled={complete || presentation === 'docking'} onClick={() => setManualPause((value) => !value)}>{manualPause ? 'resume intro' : 'pause intro'}</button>
             <button ref={skipButton} type="button" onClick={skip}>skip to case study <span aria-hidden="true">↗</span></button>
@@ -228,7 +237,7 @@ export function HeroIntro() {
       </div>
     </div>
     <figcaption className={styles.caption} aria-hidden={expanded || undefined}>
-      <span className="readout" style={{ color: 'var(--muted)' }}>four authored sentences · the same shared renderer</span>
+      <span className="readout" style={{ color: 'var(--muted)' }}>illustrative sequence · the same shared renderer</span>
       {reduced ? <span className="readout" style={{ color: 'var(--muted)' }}>reduced motion · full exchange shown</span> : <div className={styles.controls}>
         <button type="button" className="replay-btn replay-btn-on-surface" disabled={complete} onClick={() => setManualPause((value) => !value)}>{manualPause ? 'resume intro' : 'pause intro'}</button>
         <button type="button" className="replay-btn replay-btn-on-surface" onClick={replay}>replay intro</button>
diff --git a/components/settle/settle-stage.tsx b/components/settle/settle-stage.tsx
index 7e3385f..b2f8a79 100644
--- a/components/settle/settle-stage.tsx
+++ b/components/settle/settle-stage.tsx
@@ -76,7 +76,7 @@ const POLICIES: { id: Policy; label: string }[] = [
 const BRAND_IDS = Object.keys(brands) as BrandId[]
 
 export function SettleStage({
-  source = 'trace:heron-poem__lowconf-b32',
+  source = 'trace:travel__lowconf-b32',
   sources = 'curated',
   controls = [],
   policy: policyProp = 'sentence',

```

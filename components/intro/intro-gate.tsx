'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, useMotionValue } from 'motion/react'
import { DecodingWord } from '@/components/diffusion/decoding-word'

// The entrance performs the thesis before stating it. A diffusion model does
// not lay text down left to right, one token at a time — it resolves a whole
// region out of noise. So the intro does exactly that: one giant word at a
// time, each settling out of a block/braille field with the same decode engine
// the specimens and playground use. The palette is INVERTED here (the dark
// "stage", the field before order). On the last beat the fog rolls in, blurs
// everything, and clears — and as it clears the palette inverts BACK to the
// standard light site. The fog parting reveals the real page.
//
// Built for robustness (a prior intro was pulled for fragility):
//   - prefers-reduced-motion skips the whole thing (also via CSS, pre-hydration)
//   - the site underneath always renders, so there is no flash-of-headline
//   - scroll is reset to top and locked only for the few seconds it plays
//   - click / scroll / touch / Esc / Space all skip straight to the handoff
//   - it plays once per load and never blocks scroll permanently

type Beat = { word: string; hold: number }

// Tight, well-paced. Reads as one sentence that lands the concept and ends on
// "until now". Resolve time per word is ~RESOLVE_MS; `hold` is the extra beat
// the settled word lingers before the next arrives.
const BEATS: ReadonlyArray<Beat> = [
  { word: 'text', hold: 420 },
  { word: 'used to arrive', hold: 520 },
  { word: 'one token', hold: 480 },
  { word: 'at a time', hold: 640 },
  { word: 'until now', hold: 900 },
]

const RESOLVE_MS = 1180 // per-word resolve-from-noise duration
const HANDOFF_MS = 1500 // fog blur -> clear -> light handoff

type Phase = 'playing' | 'handoff' | 'done'

export function IntroGate() {
  // mounted: false until we confirm (client-side) that motion is allowed.
  // We start unmounted on the server so SSR ships the real site only; the dark
  // overlay is added on the client. To avoid a flash of site-before-overlay,
  // the overlay paints its own opaque stage immediately on mount, and the CSS
  // media-query guard keeps it out entirely for reduced-motion users.
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>('playing')
  const [beat, setBeat] = useState(0)

  const progress = useMotionValue(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const timersRef = useRef<number[]>([])
  const animRef = useRef<ReturnType<typeof animate> | null>(null)
  const dismissedRef = useRef(false)

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
    animRef.current?.stop()
    animRef.current = null
  }, [])

  // Decide whether to run at all. Reduced motion -> never mount the overlay.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setPhase('done')
      return
    }
    // Start at the top so the intro reads as first paint, never mid-scroll.
    try {
      window.scrollTo(0, 0)
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }
    } catch {
      // non-fatal: scrollTo can throw in exotic embeds
    }
    setMounted(true)
  }, [])

  // Lock scroll while the overlay is up; always release on unmount.
  useEffect(() => {
    if (!mounted || phase === 'done') return
    const html = document.documentElement
    html.classList.add('intro-lock')
    return () => {
      html.classList.remove('intro-lock')
    }
  }, [mounted, phase])

  // Run the dismiss / handoff: roll the fog in, invert back to light, unmount.
  const handoff = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    clearTimers()
    setPhase('handoff')
    const t = window.setTimeout(() => {
      setPhase('done')
      setMounted(false)
      try {
        window.scrollTo(0, 0)
      } catch {
        // ignore
      }
    }, HANDOFF_MS)
    timersRef.current.push(t)
  }, [clearTimers])

  // The beat clock. Each beat animates its word's progress 0 -> 1, holds, then
  // advances. The final beat hands off into the site.
  //
  // Runs in a LAYOUT effect so progress is forced to 0 before the browser
  // paints the freshly-mounted word. The remounted DecodingWord's own baseline
  // layout effect runs first (child before parent) and would otherwise paint a
  // frame of the previous beat's leftover progress=1 (a flash of the resolved
  // word). Resetting here, pre-paint, guarantees every word arrives as noise.
  useLayoutEffect(() => {
    if (!mounted || phase !== 'playing') return
    animRef.current?.stop()
    progress.set(0)
    animRef.current = animate(progress, 1, {
      duration: RESOLVE_MS / 1000,
      ease: [0.42, 0, 0.15, 1], // deep hold in the noise, then a sweep to order
    })

    const current = BEATS[beat]
    const dwell = (current?.hold ?? 480) + RESOLVE_MS
    const isLast = beat >= BEATS.length - 1

    const t = window.setTimeout(() => {
      if (isLast) handoff()
      else setBeat((b) => b + 1)
    }, dwell)
    timersRef.current.push(t)

    return () => {
      window.clearTimeout(t)
    }
  }, [mounted, phase, beat, progress, handoff])

  useEffect(() => clearTimers, [clearTimers])

  // Any deliberate input skips straight to the handoff. We do NOT dismiss on
  // mere pointer move; only intent (click / wheel / touch drag / key).
  useEffect(() => {
    if (!mounted || phase !== 'playing') return
    const skip = (e: Event) => {
      if (e.type === 'keydown') {
        const k = (e as KeyboardEvent).key
        if (k !== 'Escape' && k !== ' ' && k !== 'Enter' && k !== 'ArrowDown') return
      }
      handoff()
    }
    const opts = { passive: true } as AddEventListenerOptions
    window.addEventListener('wheel', skip, opts)
    window.addEventListener('touchmove', skip, opts)
    window.addEventListener('pointerdown', skip, opts)
    window.addEventListener('keydown', skip)
    return () => {
      window.removeEventListener('wheel', skip, opts)
      window.removeEventListener('touchmove', skip, opts)
      window.removeEventListener('pointerdown', skip, opts)
      window.removeEventListener('keydown', skip)
    }
  }, [mounted, phase, handoff])

  if (!mounted || phase === 'done') return null

  const current = BEATS[beat]?.word ?? ''

  return (
    <div
      ref={rootRef}
      data-intro
      data-phase={phase}
      aria-hidden="true"
      className="intro-gate"
      onClick={handoff}
    >
      {/* ambient noise field, same texture as the hero stage */}
      <div className="intro-field" />

      <div className="intro-stage">
        <span className="intro-word">
          {/* Remount per beat (key) so each word resolves from a fresh noise
              field. Single shared progress MV drives the decode at frame rate. */}
          <DecodingWord
            key={`${beat}-${current}`}
            text={current}
            style="blocks"
            startP={0}
            endP={1}
            progress={progress}
            reduced={false}
            wordIndex={beat}
            registerRoot={() => {}}
          />
        </span>
      </div>

      {/* fog sheet: parts on handoff, blurring then clearing to the light site */}
      <div className="intro-fog" />

      <button type="button" className="intro-skip" onClick={handoff}>
        skip
      </button>
    </div>
  )
}

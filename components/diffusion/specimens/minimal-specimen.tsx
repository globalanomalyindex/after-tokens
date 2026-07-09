'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

// MinimalSpecimen - the quietest entry in the brand-specimen gallery.
//
// The thesis: diffusion does not have to be flashy. Here an assistant answer
// resolves in a seeded (non-left-to-right) order with the most restrained
// possible gesture - a quick blur(6px) to blur(0), opacity 0 to 1, and a tiny
// upward settle. No color, no glow, no decoration. A single hairline caret
// rides the resolving frontier and comes to rest, blinking, once the answer
// has fully formed. Stark near-black surface, off-white text, generous space.
// The elegance is entirely in the timing, the spacing, and the restraint.
//
// PERF / LIFECYCLE: the resolve to hold to fade loop is
// driven by timers that only run while the specimen is on screen
// (IntersectionObserver) and the tab is visible (visibilitychange). Per-word
// motion is handled by `motion` (transform + opacity + filter on the GPU), not
// per-frame setState - the only React state that ticks during a cycle is the
// resolved-word count (~10 discrete steps). prefers-reduced-motion shows the
// final answer statically with the caret at rest and never loops. All timers
// and observers are torn down on unmount.

const SURFACE = '#111111'
const TEXT = '#F2F2F2'

const SENTENCE = 'Your meeting moved to 3pm tomorrow. I updated everyone.'

// Per-word cadence. Each word lands a few hundred ms after the previous one,
// fast and confident. The first word waits a beat so the caret reads as
// "thinking" before the answer begins.
const LEAD_IN_MS = 320
const WORD_STEP_MS = 230 // gap between successive word resolves
const WORD_SETTLE_MS = 420 // duration of a single word's blur to sharp settle
const HOLD_MS = 1600 // dwell on the fully-resolved answer
const FADE_MS = 620 // clean fade-out of the whole answer before looping
const GAP_MS = 360 // dark beat between fade-out and the next resolve

// Buttery settle - the brief's required cubic-bezier(0.16, 1, 0.3, 1).
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

// Deterministic seeded order so the resolve sequence is stable across renders
// and SSR/CSR (no hydration drift) yet visibly non-left-to-right. Mulberry32:
// tiny, fast, no deps.
function seededOrder(count: number, seed: number): number[] {
  let s = seed >>> 0
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const order = Array.from({ length: count }, (_, i) => i)
  // Fisher-Yates with the seeded PRNG.
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = order[i]!
    order[i] = order[j]!
    order[j] = tmp
  }
  return order
}

type Phase = 'resolving' | 'holding' | 'fading'

export function MinimalSpecimen({ className = '' }: { className?: string }) {
  const prefersReduced = useReducedMotion()

  const words = useMemo(() => SENTENCE.split(' '), [])
  // resolveRank[wordIndex] = the step at which that word resolves. Inverting
  // the shuffled order lets us light up words by comparing rank < resolvedCount.
  const resolveRank = useMemo(() => {
    const order = seededOrder(words.length, 0x9e3779b9)
    const rank = new Array<number>(words.length)
    order.forEach((wordIndex, step) => {
      rank[wordIndex] = step
    })
    return rank
  }, [words.length])

  // How many words have resolved so far (0..words.length). The caret rides
  // just ahead of this frontier; once it reaches words.length the answer holds.
  const [resolvedCount, setResolvedCount] = useState(
    prefersReduced ? words.length : 0,
  )
  const [phase, setPhase] = useState<Phase>(
    prefersReduced ? 'holding' : 'resolving',
  )
  // Cycle key forces motion elements to re-mount between loops so the
  // enter animation replays cleanly without per-element manual resets.
  const [cycle, setCycle] = useState(0)

  // ---- Loop driver -------------------------------------------------------
  // Single self-rescheduling timer chain, gated by on-screen + tab-visible.
  // Every timeout is tracked in timersRef so a single teardown clears the chain.
  const rootRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const runningRef = useRef(false)
  const inViewRef = useRef(false)

  // Mutable mirrors of loop state so the timer closures always read fresh
  // values without being re-created (which would reset the loop on every tick).
  const resolvedRef = useRef(resolvedCount)
  resolvedRef.current = resolvedCount
  const phaseRef = useRef<Phase>(phase)
  phaseRef.current = phase

  useEffect(() => {
    if (prefersReduced) return
    const root = rootRef.current
    if (!root) return

    const timers = timersRef.current

    const after = (ms: number, fn: () => void) => {
      const id = setTimeout(() => {
        timers.delete(id)
        if (runningRef.current) fn()
      }, ms)
      timers.add(id)
      return id
    }

    const clearTimers = () => {
      timers.forEach((id) => clearTimeout(id))
      timers.clear()
    }

    // The three forever-loop continuations, each a named entry point so that
    // start() can resume the correct one after an off-screen pause (the
    // previously-pending timer is cleared on stop, so re-entry must re-arm it).

    // Restart a fresh cycle: re-seed visuals and begin resolving word by word.
    const beginCycle = () => {
      setResolvedCount(0)
      setPhase('resolving')
      setCycle((c) => c + 1)
      after(LEAD_IN_MS, step)
    }

    // Hold on the finished answer, fade it out, dark beat, then loop.
    function enterHoldCycle() {
      setPhase('holding')
      after(HOLD_MS, () => {
        setPhase('fading')
        after(FADE_MS, () => {
          after(GAP_MS, beginCycle)
        })
      })
    }

    // Resolve one word, then schedule the next. When all are in, hand off to
    // the hold/fade/restart cycle.
    function step() {
      const next = resolvedRef.current + 1
      setResolvedCount(next)
      if (next < words.length) after(WORD_STEP_MS, step)
      else enterHoldCycle()
    }

    const start = () => {
      if (runningRef.current) return
      runningRef.current = true
      // Resume the continuation for whichever phase we paused in, so the loop
      // never stalls off screen. Resolving picks up the word frontier; holding
      // and fading re-enter the dwell/fade/restart cycle from the top (a clean,
      // imperceptible reset of the dwell beat rather than a frozen frame).
      if (
        phaseRef.current === 'resolving' &&
        resolvedRef.current < words.length
      ) {
        const delay = resolvedRef.current === 0 ? LEAD_IN_MS : WORD_STEP_MS
        after(delay, step)
      } else if (phaseRef.current === 'resolving') {
        // Fully resolved but never advanced to hold (paused exactly at the
        // frontier's end): start the dwell now.
        enterHoldCycle()
      } else {
        enterHoldCycle()
      }
    }

    const stop = () => {
      runningRef.current = false
      clearTimers()
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        inViewRef.current = !!entry?.isIntersecting
        if (inViewRef.current && !document.hidden) start()
        else stop()
      },
      { threshold: 0.2 },
    )
    io.observe(root)

    const onVisibility = () => {
      if (document.hidden) stop()
      else if (inViewRef.current) start()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // words.length is stable for the lifetime of this component (fixed
    // sentence); deliberately not depending on changing loop state so the
    // timer chain is created exactly once.
  }, [prefersReduced, words.length])

  // ---- Render ------------------------------------------------------------
  const fading = phase === 'fading'

  return (
    <div
      ref={rootRef}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{
        backgroundColor: SURFACE,
        color: TEXT,
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Accessible static copy for screen readers; the visual layer is aria-hidden. */}
      <p className="sr-only">{SENTENCE}</p>

      <div
        aria-hidden="true"
        className="px-10 py-12 sm:px-16"
        style={{ maxWidth: '40ch' }}
      >
        <p
          className="m-0 flex flex-wrap items-baseline"
          style={{
            fontSize: 'clamp(1.25rem, 2.4vw, 1.6rem)',
            lineHeight: 1.6,
            letterSpacing: '-0.01em',
            fontWeight: 450,
            // Whole-answer fade-out before each loop. Opacity only - cheap,
            // and the buttery curve keeps it from feeling like a hard cut.
            opacity: fading ? 0 : 1,
            transition: `opacity ${FADE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            willChange: 'opacity',
          }}
        >
          {words.map((word, i) => {
            const rank = resolveRank[i] ?? i
            const isResolved = prefersReduced || rank < resolvedCount
            // The caret sits just after the most-recently-resolved word - i.e.
            // on the word whose rank === resolvedCount - 1 (the frontier).
            const isFrontier =
              !prefersReduced &&
              phase === 'resolving' &&
              rank === resolvedCount - 1
            return (
              <span
                // Re-mount per cycle so the enter animation replays.
                key={`${cycle}-${i}`}
                className="relative inline-flex items-baseline"
                style={{ marginRight: '0.32em', whiteSpace: 'pre' }}
              >
                <motion.span
                  initial={
                    prefersReduced
                      ? false
                      : { opacity: 0, filter: 'blur(6px)', y: 4 }
                  }
                  animate={{
                    opacity: isResolved ? 1 : 0,
                    filter: isResolved ? 'blur(0px)' : 'blur(6px)',
                    y: isResolved ? 0 : 4,
                  }}
                  transition={{
                    duration: WORD_SETTLE_MS / 1000,
                    ease: EASE_OUT_EXPO,
                  }}
                  style={{
                    display: 'inline-block',
                    willChange: 'transform, opacity, filter',
                  }}
                >
                  {word}
                </motion.span>
                {isFrontier && <Caret resting={false} />}
              </span>
            )
          })}
          {/* Resting caret: parks at the end once the answer is fully formed (or immediately, under reduced motion). A calm blink, then still. */}
          {(prefersReduced || (phase !== 'resolving' && !fading)) && (
            <span
              className="relative inline-flex items-baseline"
              style={{ whiteSpace: 'pre' }}
            >
              <Caret resting />
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

// A single hairline vertical bar. While riding the frontier it holds steady
// (the answer is actively forming); at rest it blinks slowly, then the loop
// fades the whole line and it disappears with everything else.
function Caret({ resting }: { resting: boolean }) {
  const prefersReduced = useReducedMotion()
  return (
    <motion.span
      aria-hidden="true"
      className="inline-block align-baseline"
      style={{
        width: '1.5px',
        height: '1.05em',
        marginLeft: resting ? '0.06em' : '0.04em',
        backgroundColor: TEXT,
        transform: 'translateY(0.12em)',
        borderRadius: '1px',
        willChange: 'opacity',
      }}
      initial={{ opacity: prefersReduced ? 0.9 : 0 }}
      animate={
        prefersReduced
          ? { opacity: 0.9 }
          : resting
            ? { opacity: [1, 1, 0, 0, 1] }
            : { opacity: 1 }
      }
      transition={
        prefersReduced || !resting
          ? { duration: 0.18, ease: EASE_OUT_EXPO }
          : {
              duration: 1.6,
              ease: 'linear',
              repeat: Infinity,
              times: [0, 0.45, 0.5, 0.95, 1],
            }
      }
    />
  )
}

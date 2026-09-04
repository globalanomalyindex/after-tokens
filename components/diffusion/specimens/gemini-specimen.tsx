'use client'

import { Fragment, useEffect, useRef } from 'react'

// ---------------------------------------------------------------------------
// Brand specimen: a friendly, colorful flagship AI assistant answering in
// chat. The answer resolves via diffusion in a SEEDED, non-left-to-right
// order: pending words sit faint + softly blurred, then each word resolves as
// a smooth blue -> violet -> magenta gradient sweeps through it, settling to a
// clean readable near-black. When the whole line lands, a 4-point spark
// twinkles in beside it; the line holds, then the loop restarts forever.
//
// PERF CONTRACT (60fps bar):
//  - A SINGLE rAF loop owns the whole timeline. It writes per-word visual
//    state straight to DOM nodes via refs (CSS custom properties + opacity).
//    There is NO per-frame React setState — React renders the word spans once.
//  - Only transform / opacity / filter / background-position are touched. No
//    layout properties animate.
//  - Gated by IntersectionObserver + visibilitychange: the loop only runs
//    while on screen and the tab is visible, and resumes seamlessly on
//    re-entry (the clock is re-based on resume, so no jump).
//  - prefers-reduced-motion renders the final settled state statically.
//  - All rAF / observers / listeners are torn down on unmount.
//
// Uses the shared on-screen-gated rAF lifecycle used by the specimen set.
// ---------------------------------------------------------------------------

const ANSWER = 'Here are three calmer ways to start your morning, based on your notes.'

// Brand signature gradient. Blue -> violet -> magenta, swept through each word
// on resolve. The SETTLED text is INK (solid, readable), never the gradient.
const GRAD_BLUE = '#4285F4'
const GRAD_VIOLET = '#9168C0'
const GRAD_MAGENTA = '#D96570'
const INK = '#1F1F1F'

// Seeded, non-sequential resolve order. These are the word indices in the
// order they begin resolving — deliberately scattered (not left-to-right) so
// the field reads as parallel diffusion rather than typing. Computed once for
// the fixed ANSWER so the choreography is stable and hand-tuned.
//   0 Here   1 are   2 three  3 calmer 4 ways  5 to   6 start
//   7 your   8 morning, 9 based 10 on  11 your 12 notes.
const RESOLVE_ORDER = [3, 8, 0, 6, 11, 2, 9, 5, 12, 1, 7, 4, 10]

// Timeline constants (ms). One full cycle = diffuse-in + settle + hold.
const WORD_RESOLVE_MS = 620 // how long one word takes to sweep + settle
const STAGGER_MS = 150 // gap between successive words beginning to resolve
const SPARK_LEAD_MS = 220 // spark starts just before the last word fully lands
const SPARK_MS = 1100 // spark twinkle-in duration
const HOLD_MS = 1600 // fully-resolved hold before restart
const INTRO_MS = 260 // brief calm before the first word resolves

// Derived: when the last word STARTS and FINISHES resolving.
const LAST_START_MS = INTRO_MS + (RESOLVE_ORDER.length - 1) * STAGGER_MS
const ALL_RESOLVED_MS = LAST_START_MS + WORD_RESOLVE_MS
const SPARK_START_MS = ALL_RESOLVED_MS - SPARK_LEAD_MS
const CYCLE_MS = ALL_RESOLVED_MS + HOLD_MS

// Per-word resolve start time, indexed by word position.
const WORD_START_MS: number[] = (() => {
  const starts = new Array<number>(RESOLVE_ORDER.length).fill(0)
  RESOLVE_ORDER.forEach((wordIndex, rank) => {
    starts[wordIndex] = INTRO_MS + rank * STAGGER_MS
  })
  return starts
})()

// Easing — matches the project's --ease-out-expo (cubic-bezier(0.16,1,0.3,1)).
function easeOutExpo(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return 1 - Math.pow(2, -10 * x)
}
function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

type Props = {
  className?: string
}

export function GeminiSpecimen({ className = '' }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const sparkRef = useRef<HTMLSpanElement | null>(null)

  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const inViewRef = useRef(false)
  // Absolute timestamp the current cycle started at. Re-based on resume so the
  // animation never jumps after being paused offscreen / in a hidden tab.
  const cycleStartRef = useRef(0)

  const words = ANSWER.split(' ')

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // -- paint one word's visual state for a given cycle-relative time -------
    // p: resolve progress 0..1 for THIS word.
    //   pending  (p===0): faint, blurred, gradient hidden.
    //   resolving(0<p<1): blur clears, gradient sweeps across + glows.
    //   resolved (p===1): solid INK, no blur, gradient gone.
    function paintWord(el: HTMLSpanElement, p: number) {
      const eased = easeOutExpo(p)
      // Gradient overlay sweeps left->right as it resolves, and its opacity
      // arcs up then back to 0 so the settled glyph is solid INK beneath.
      const sweepPos = `${(1 - eased) * 100}%`
      // Bell curve: 0 at p=0, peak ~mid, 0 at p=1.
      const gradOpacity = Math.sin(clamp01(p) * Math.PI)
      // Pending text is faint + blurred; clears as it resolves.
      const blur = (1 - eased) * 5 // px
      const baseOpacity = 0.32 + 0.68 * eased
      // Subtle lift as the word lands — transform only, no layout.
      const lift = (1 - eased) * 2 // px

      el.style.setProperty('--p', String(p))
      el.style.setProperty('--sweep', sweepPos)
      el.style.setProperty('--grad-op', String(gradOpacity))
      el.style.setProperty('--blur', `${blur}px`)
      el.style.setProperty('--base-op', String(baseOpacity))
      el.style.setProperty('--lift', `${lift}px`)
    }

    // -- spark twinkle (0..1 of its own life) --------------------------------
    function paintSpark(t: number) {
      const spark = sparkRef.current
      if (!spark) return
      const local = clamp01((t - SPARK_START_MS) / SPARK_MS)
      // Twinkle: scale springs from 0, overshoots, settles; rotates a touch;
      // opacity rises fast then eases. All transform/opacity.
      const e = easeOutExpo(local)
      const overshoot = Math.sin(clamp01(local) * Math.PI) * 0.22
      const scale = local <= 0 ? 0 : e * (1 + overshoot)
      const rot = (1 - e) * -45 // degrees, unwinds to 0
      const op = clamp01(local * 2.2)
      spark.style.opacity = String(op)
      spark.style.transform = `translateY(-2px) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`
    }

    // -- render the whole frame at cycle-relative time t (ms) ----------------
    function renderAt(t: number) {
      for (let i = 0; i < words.length; i++) {
        const el = wordRefs.current[i]
        if (!el) continue
        const start = WORD_START_MS[i] ?? 0
        const p = clamp01((t - start) / WORD_RESOLVE_MS)
        paintWord(el, p)
      }
      paintSpark(t)
    }

    // Final settled frame (used by reduced-motion and as a safe resting state).
    function renderSettled() {
      for (let i = 0; i < words.length; i++) {
        const el = wordRefs.current[i]
        if (el) paintWord(el, 1)
      }
      const spark = sparkRef.current
      if (spark) {
        spark.style.opacity = '1'
        spark.style.transform = 'translateY(-2px) scale(1) rotate(0deg)'
      }
    }

    function loop(now: number) {
      // Cycle-relative time, looping forever.
      let t = now - cycleStartRef.current
      if (t >= CYCLE_MS) {
        // Re-base to the start of the next cycle (carry the remainder so we
        // don't drift), then keep going.
        const overrun = t % CYCLE_MS
        cycleStartRef.current = now - overrun
        t = overrun
      }
      renderAt(t)
      rafRef.current = requestAnimationFrame(loop)
    }

    function start() {
      if (runningRef.current || reduced) return
      runningRef.current = true
      // Re-base the clock so resuming continues mid-cycle without a jump.
      cycleStartRef.current = performance.now()
      rafRef.current = requestAnimationFrame(loop)
    }
    function stop() {
      runningRef.current = false
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    if (reduced) {
      // Static final state, no loop.
      renderSettled()
      return
    }

    // Paint the intro frame immediately so there's no flash before the loop.
    renderAt(0)

    // Only animate while on screen.
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        inViewRef.current = !!entry?.isIntersecting
        if (inViewRef.current && !document.hidden) start()
        else stop()
      },
      { threshold: 0.15 },
    )
    io.observe(root)

    // Pause when the tab is hidden; resume only if still on screen.
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
  }, [words.length])

  return (
    <div
      ref={rootRef}
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{
        // Clean near-white surface, airy and optimistic.
        background: '#FBFBFD',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Very subtle, slow-drifting soft gradient aura. Pure CSS keyframes,
          GPU transform/opacity only. Sits under the content. */}
      <div aria-hidden="true" className="gemini-aura" />

      {/* Content: a single assistant message bubble, generously padded. */}
      <div className="relative z-10 flex h-full w-full items-center justify-center px-8 py-8 sm:px-12">
        <div className="w-full max-w-[34rem]">
          {/* Assistant identity row: the brand spark glyph + soft label. */}
          <div className="mb-4 flex items-center gap-2.5">
            <span className="gemini-avatar-spark" aria-hidden="true" />
            <span
              className="text-[12.5px] font-medium tracking-wide"
              style={{ color: '#8A8A93' }}
            >
              Assistant
            </span>
          </div>

          {/* The answer. Screen-reader gets the clean text; the visual layer is
              aria-hidden and built from per-word spans the rAF drives. */}
          <p className="sr-only">{ANSWER}</p>

          <p
            aria-hidden="true"
            className="gemini-answer"
            style={{
              margin: 0,
              fontSize: 'clamp(17px, 2.4vw, 19px)',
              lineHeight: 1.62,
              fontWeight: 450,
              letterSpacing: '-0.005em',
            }}
          >
            {words.map((word, i) => (
              <Fragment key={`${i}-${word}`}>
                <span
                  ref={(el) => {
                    wordRefs.current[i] = el
                  }}
                  className="gemini-word"
                >
                  {/* The visible glyphs (solid INK base). */}
                  <span className="gemini-word-ink">{word}</span>
                  {/* The gradient sweep, clipped to the same glyphs, layered on
                      top and faded in/out per resolve progress. */}
                  <span aria-hidden="true" className="gemini-word-grad">
                    {word}
                  </span>
                </span>
                {/* Inter-word space lives OUTSIDE the inline-block so it is not
                    collapsed at the word-box boundary. */}
                {i < words.length - 1 ? ' ' : ''}
              </Fragment>
            ))}
            {/* Signature flourish: a CSS-drawn 4-point spark beside the line. */}
            <span
              ref={sparkRef}
              aria-hidden="true"
              className="gemini-spark"
              style={{ opacity: 0 }}
            />
          </p>
        </div>
      </div>

      {/* Scoped styles. Kept inline-to-component so the specimen is fully
          self-contained and drops into the gallery without touching globals. */}
      <style>{`
        .gemini-answer {
          position: relative;
          color: ${INK};
          /* Allow the spark to ride on the baseline at the end of the text. */
          word-spacing: normal;
        }

        /* Each word: an inline-block so we can lift it via transform without
           disturbing wrapping. Two stacked text layers (ink + gradient) share
           one box. */
        .gemini-word {
          position: relative;
          display: inline-block;
          /* lift is transform-only; never animates layout. */
          transform: translateY(var(--lift, 0px));
          opacity: var(--base-op, 1);
          filter: blur(var(--blur, 0px));
          will-change: transform, opacity, filter;
        }

        /* Solid, readable settled color: the base everyone reads. */
        .gemini-word-ink {
          color: ${INK};
        }

        /* The brand gradient, clipped to the glyphs, sitting exactly over the
           ink layer. Its opacity (--grad-op) arcs 0 -> peak -> 0 across the
           resolve, and the gradient itself slides (--sweep) so color travels
           through the word. Settled state: opacity 0, leaving solid ink. */
        .gemini-word-grad {
          position: absolute;
          left: 0;
          top: 0;
          pointer-events: none;
          opacity: var(--grad-op, 0);
          background-image: linear-gradient(
            100deg,
            ${GRAD_BLUE} 0%,
            ${GRAD_VIOLET} 42%,
            ${GRAD_MAGENTA} 78%,
            ${GRAD_MAGENTA} 100%
          );
          background-size: 220% 100%;
          background-position: var(--sweep, 100%) 0;
          background-repeat: no-repeat;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          will-change: opacity, background-position;
        }

        /* The signature 4-point spark drawn purely in CSS: two crossed
           4-point-star shapes layered for a soft sparkle. Rides at the end of
           the resolved line. The rAF drives its transform + opacity. */
        .gemini-spark {
          position: relative;
          display: inline-block;
          width: 0.72em;
          height: 0.72em;
          margin-left: 0.34em;
          vertical-align: baseline;
          transform-origin: center;
          will-change: transform, opacity;
        }
        .gemini-spark::before,
        .gemini-spark::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 50% 50%,
            ${GRAD_VIOLET} 0%,
            ${GRAD_BLUE} 55%,
            ${GRAD_MAGENTA} 100%
          );
          /* 4-point star via a concave diamond mask. */
          clip-path: polygon(
            50% 0%, 60% 40%, 100% 50%, 60% 60%,
            50% 100%, 40% 60%, 0% 50%, 40% 40%
          );
        }
        .gemini-spark::after {
          transform: scale(0.55) rotate(45deg);
          filter: brightness(1.5);
          opacity: 0.85;
        }

        /* The small identity-row spark beside the "Assistant" label. Static,
           gentle continuous twinkle so the brand mark feels alive without
           pulling focus from the answer. */
        .gemini-avatar-spark {
          position: relative;
          display: inline-block;
          width: 18px;
          height: 18px;
          flex: none;
          animation: gemini-avatar-twinkle 4200ms ease-in-out infinite;
        }
        .gemini-avatar-spark::before,
        .gemini-avatar-spark::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, ${GRAD_BLUE}, ${GRAD_VIOLET}, ${GRAD_MAGENTA});
          clip-path: polygon(
            50% 0%, 60% 40%, 100% 50%, 60% 60%,
            50% 100%, 40% 60%, 0% 50%, 40% 40%
          );
        }
        .gemini-avatar-spark::after {
          transform: scale(0.5) rotate(45deg);
          filter: brightness(1.6);
          opacity: 0.8;
        }
        @keyframes gemini-avatar-twinkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.92; }
          50% { transform: scale(1.12) rotate(12deg); opacity: 1; }
        }

        /* Soft, slow-drifting multicolor aura. Two large blurred blobs that
           breathe and drift; tasteful and cheap (transform + opacity only).
           Kept very low-opacity so the surface stays clean near-white. */
        .gemini-aura {
          position: absolute;
          inset: -25%;
          pointer-events: none;
          opacity: 0.5;
          background:
            radial-gradient(38% 50% at 22% 30%, color-mix(in oklab, ${GRAD_BLUE} 26%, transparent), transparent 70%),
            radial-gradient(40% 52% at 80% 35%, color-mix(in oklab, ${GRAD_MAGENTA} 22%, transparent), transparent 70%),
            radial-gradient(46% 56% at 55% 82%, color-mix(in oklab, ${GRAD_VIOLET} 22%, transparent), transparent 72%);
          filter: blur(38px);
          animation: gemini-aura-drift 18s ease-in-out infinite alternate;
          will-change: transform, opacity;
        }
        @keyframes gemini-aura-drift {
          0% { transform: translate3d(-2%, -1%, 0) scale(1); opacity: 0.42; }
          50% { transform: translate3d(2%, 1.5%, 0) scale(1.06); opacity: 0.6; }
          100% { transform: translate3d(1%, -2%, 0) scale(1.02); opacity: 0.5; }
        }

        @media (prefers-reduced-motion: reduce) {
          .gemini-aura,
          .gemini-avatar-spark { animation: none; }
          .gemini-word {
            filter: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .gemini-word-grad { opacity: 0 !important; }
          .gemini-spark {
            opacity: 1 !important;
            transform: translateY(-2px) scale(1) rotate(0deg) !important;
          }
        }
      `}</style>
    </div>
  )
}

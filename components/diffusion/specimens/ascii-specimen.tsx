'use client'

import { useEffect, useRef } from 'react'

// AsciiSpecimen - a "brand specimen" for a technical / terminal brand: an AI
// chat answer that MATERIALIZES out of a field of solid blocks into clean
// monospace text, holds, then dissolves back, forever (while on screen).
//
// The decode is true diffusion: every character is resolving in PARALLEL but
// each reaches its final glyph at a different, SEEDED time, so you watch the
// whole line emerge out of noise at once, rather than typing left to right.
//
// Per-character resolve stages (early -> late), all driven by one progress
// value p in [0,1] measured against that char's seeded threshold:
//   1. solid block            U+2588
//   2. shaded blocks cycling  U+2593 U+2592 U+2591
//   3. braille / dot noise     random U+2800-28FF
//   4. ASCII letter flicker    random a-z A-Z
//   5. the final character
// Color tracks the same progress: dim gray (early) -> terminal green (as it
// nears resolution) -> bright settled green once locked. Spaces stay spaces.
//
// PERF: this is char-level animation across ~60 cells. We NEVER setState per
// char per frame. A single rAF loop writes glyph + color directly into
// pre-rendered <span> elements through a refs array, and only touches a span
// when its stage (or the glyph within the noise stages) actually changes.
// Visual churn is additionally throttled to ~28fps. Phases are derived from an
// absolute timestamp so pausing (offscreen / hidden tab) and resuming is
// seamless. Mirrors the IntersectionObserver + visibilitychange + reduced
// motion preference and rAF-cleanup pattern used across the specimen set.

const TEXT = 'Connecting the dots between everything you saved this week.'

// --- Palette (monochrome, single green accent) ---------------------------- //
const SURFACE = '#0A0A0A'
const DIM = '#3A3A3A' // earliest / deep-noise gray
const GREEN = '#7EE787' // terminal green as a char nears resolution
const BRIGHT = '#D8F5DE' // settled, fully-resolved text

// --- Glyph pools ----------------------------------------------------------- //
const SHADES = ['▓', '▒', '░'] // ▓ ▒ ░
const ASCII = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const FULL_BLOCK = '█' // █

// --- Phase timing (ms) ----------------------------------------------------- //
const DEVELOP_MS = 2600 // noise field resolves into clean text
const HOLD_MS = 1600 // clean text holds
const DISSOLVE_MS = 1500 // text decays back into the block field
const GAP_MS = 420 // brief full-block beat before re-developing
const CYCLE_MS = DEVELOP_MS + HOLD_MS + DISSOLVE_MS + GAP_MS

// How long (fraction of the develop window) a single char spends traveling
// through its noise stages once it "starts". Smaller windows resolve crisply;
// the staggered start times are what spread the reveal across the whole line.
const RESOLVE_SPAN = 0.46

// Throttle the visual rewrite cadence. The phase math still runs every rAF
// frame (cheap), but glyph/color writes only happen ~28x/sec.
const FRAME_MS = 1000 / 28

const NOISE_FRAME_MS = 70 // how often a still-noisy char picks a new glyph

// Deterministic per-char seed -> [0,1). Cheap hash so the reveal order
// repeats identically run-to-run, which is what gives it an authored look.
function seeded(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

// Stable pseudo-random glyph for a (charIndex, noiseTick) pair so each cell
// flickers independently without allocating Math.random() churn.
function pick(pool: string, i: number, tick: number): string {
  const r = seeded(i * 7.31 + tick * 1.137)
  return pool.charAt(Math.floor(r * pool.length))
}
// Safe cyclic index into the shaded-block pool (avoids an unchecked array
// access under noUncheckedIndexedAccess; the modulo is always in range).
function shade(n: number): string {
  const idx = ((n % SHADES.length) + SHADES.length) % SHADES.length
  return SHADES[idx] as string
}
function pickBraille(i: number, tick: number): string {
  const r = seeded(i * 3.77 + tick * 2.131)
  // Bias toward the denser, dottier part of the braille block so noise reads
  // as texture rather than sparse stray dots.
  const code = 0x2840 + Math.floor(r * 0xc0)
  return String.fromCharCode(code)
}

type Props = { className?: string }

export function AsciiSpecimen({ className = '' }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const inViewRef = useRef(false)

  // Per-char last-written state, so we only mutate the DOM on change.
  const lastGlyph = useRef<string[]>([])
  const lastColor = useRef<string[]>([])
  const startRef = useRef<number>(0) // absolute ms anchor for phase math
  const lastDrawRef = useRef<number>(0)

  const chars = TEXT.split('')

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const spans = spanRefs.current
    lastGlyph.current = new Array(chars.length).fill('')
    lastColor.current = new Array(chars.length).fill('')

    // Per-char seeded START offset within the develop window. Spaces are inert.
    // We spread starts across most of the window, then each char resolves over
    // RESOLVE_SPAN, so the LAST chars are still finishing as develop ends.
    const startFrac: number[] = chars.map((ch, i) =>
      ch === ' ' ? 0 : seeded(i) * (1 - RESOLVE_SPAN),
    )

    // Resolve `progress` p in [0,1] for char i at phase-progress `phase`.
    //  phase 0..1   = develop   (p climbs 0 -> 1)
    //  phase 1..A   = hold      (p = 1, fully resolved)
    //  dissolve     = p falls 1 -> 0 (reverse decay, reverse stagger so it
    //                 crumbles in a different order than it formed)
    // Returns p where 0 = solid block, 1 = final char.

    // Map an absolute timestamp to a single cycle position, then to a per-char
    // progress. `frac` is this char's seeded start fraction (precomputed by
    // the caller, so we never re-index a possibly-undefined array here).
    //  develop  : p climbs 0 -> 1 (each char starts at its own `frac`)
    //  hold     : p = 1, fully resolved
    //  dissolve : p falls 1 -> 0 with a reversed stagger so the line crumbles
    //             in a different order than it formed
    //  gap      : p = 0 (full block field, about to re-develop)
    // Returns p where 0 = solid block, 1 = final char.
    function charProgress(frac: number, cyclePos: number): number {
      // cyclePos in [0, CYCLE_MS)
      if (cyclePos < DEVELOP_MS) {
        const phase = cyclePos / DEVELOP_MS // 0..1
        const local = (phase - frac) / RESOLVE_SPAN
        return local <= 0 ? 0 : local >= 1 ? 1 : local
      }
      const afterDev = cyclePos - DEVELOP_MS
      if (afterDev < HOLD_MS) return 1 // hold: clean

      const afterHold = afterDev - HOLD_MS
      if (afterHold < DISSOLVE_MS) {
        const phase = afterHold / DISSOLVE_MS // 0..1 (decay amount)
        // Reverse stagger: chars that formed LAST dissolve FIRST.
        const revStart = 1 - frac - RESOLVE_SPAN
        const local = (phase - (revStart < 0 ? 0 : revStart)) / RESOLVE_SPAN
        const decayed = local <= 0 ? 0 : local >= 1 ? 1 : local
        return 1 - decayed // 1 -> 0
      }
      return 0 // gap: full block field, about to re-develop
    }

    // Translate progress p -> { glyph, color } for a char whose final glyph is
    // `target`, at noise tick `tick`. `i` only seeds the per-cell flicker
    // offset so neighbors don't pulse in lockstep.
    function resolveChar(target: string, i: number, p: number, tick: number) {
      let glyph: string
      let color: string

      if (p >= 1) {
        glyph = target
        color = BRIGHT
      } else if (p <= 0) {
        glyph = FULL_BLOCK
        color = DIM
      } else if (p < 0.28) {
        // Stage 1 -> 2 boundary: full block easing into shaded blocks.
        glyph = p < 0.14 ? FULL_BLOCK : shade(tick)
        color = DIM
      } else if (p < 0.55) {
        // Stage 2: shaded blocks cycling.
        glyph = shade(tick + i)
        color = DIM
      } else if (p < 0.78) {
        // Stage 3: braille / dot noise, starting to warm toward green.
        glyph = pickBraille(i, tick)
        color = mix(DIM, GREEN, (p - 0.55) / 0.23)
      } else if (p < 0.94) {
        // Stage 4: ASCII letter flicker, green.
        glyph = pick(ASCII, i, tick)
        color = GREEN
      } else {
        // Stage 5 approach: settle onto the real glyph, brighten to final.
        glyph = target
        color = mix(GREEN, BRIGHT, (p - 0.94) / 0.06)
      }
      return { glyph, color }
    }

    // --- main render ------------------------------------------------------- //
    function render(now: number) {
      const cyclePos = (now - startRef.current) % CYCLE_MS
      const noiseTick = Math.floor(now / NOISE_FRAME_MS)

      for (let i = 0; i < chars.length; i++) {
        const span = spans[i]
        const target = chars[i]
        if (!span || target === undefined || target === ' ') continue

        const p = charProgress(startFrac[i] ?? 0, cyclePos)
        const { glyph, color } = resolveChar(target, i, p, noiseTick)

        if (glyph !== lastGlyph.current[i]) {
          span.textContent = glyph
          lastGlyph.current[i] = glyph
        }
        if (color !== lastColor.current[i]) {
          span.style.color = color
          lastColor.current[i] = color
        }
      }
    }

    function loop(now: number) {
      // Throttle visual writes to ~28fps; phase math is cheap and could run
      // every frame, but there's no reason to when nothing is rewritten.
      if (now - lastDrawRef.current >= FRAME_MS) {
        lastDrawRef.current = now
        render(now)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    function paintStatic() {
      // Final clean text, no animation (reduced motion or initial paint).
      for (let i = 0; i < chars.length; i++) {
        const span = spans[i]
        const target = chars[i]
        if (!span || target === undefined || target === ' ') continue
        span.textContent = target
        span.style.color = BRIGHT
        lastGlyph.current[i] = target
        lastColor.current[i] = BRIGHT
      }
    }

    function start() {
      if (runningRef.current || reduced) return
      runningRef.current = true
      // Anchor phase math the first time we ever start, so the loop always
      // begins at the top of a develop cycle. On resume we keep the original
      // anchor so the animation continues from where the wall clock says it
      // should be (seamless, no jump).
      if (startRef.current === 0) startRef.current = performance.now()
      lastDrawRef.current = 0
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
      paintStatic()
      return // no observers, no loop
    }

    // Paint a full-block field immediately so the first visible frame is
    // already the "noise" state, before the loop itself starts.
    for (let i = 0; i < chars.length; i++) {
      const span = spans[i]
      if (!span || chars[i] === ' ') continue
      span.textContent = FULL_BLOCK
      span.style.color = DIM
      lastGlyph.current[i] = FULL_BLOCK
      lastColor.current[i] = DIM
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        inViewRef.current = !!entry?.isIntersecting
        if (inViewRef.current && !document.hidden) start()
        else stop()
      },
      { threshold: 0.01 },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={rootRef}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{ background: SURFACE }}
    >
      {/* Cheap scanline + faint vignette. Pure CSS gradients, no per-frame
          cost; sits under the text and reads as a terminal surface. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(126,231,135,0.035) 0px, rgba(126,231,135,0.035) 1px, transparent 1px, transparent 3px)',
          maskImage:
            'radial-gradient(120% 120% at 50% 50%, black 55%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(120% 120% at 50% 50%, black 55%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 130% at 50% 35%, transparent 50%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* The specimen line. Accessible text lives in an sr-only node; the
          animated cells are aria-hidden so screen readers read it once,
          cleanly. */}
      <p
        className="relative px-6 text-center leading-relaxed"
        style={{
          fontFamily: 'var(--font-mono), ui-monospace, monospace',
          fontSize: 'clamp(0.85rem, 2.3vw, 1.25rem)',
          letterSpacing: '0.02em',
          maxWidth: '34ch',
        }}
      >
        <span className="sr-only">{TEXT}</span>
        <span aria-hidden="true" className="whitespace-pre-wrap">
          {chars.map((ch, i) =>
            ch === ' ' ? (
              ' '
            ) : (
              <span
                key={i}
                ref={(el) => {
                  spanRefs.current[i] = el
                }}
                style={{ color: DIM }}
              >
                {FULL_BLOCK}
              </span>
            ),
          )}
          {/* Blinking block cursor at the end of the line. */}
          <span
            aria-hidden="true"
            className="ascii-caret"
            style={{ color: GREEN }}
          >
            {FULL_BLOCK}
          </span>
        </span>
      </p>

      <style>{`
        .ascii-caret {
          display: inline-block;
          margin-left: 0.08em;
          animation: ascii-caret-blink 1.06s steps(1, end) infinite;
        }
        @keyframes ascii-caret-blink {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ascii-caret { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// Small sRGB hex lerp for the gray -> green -> bright transitions. Kept inline
// (no per-frame allocation beyond the result string) and only called for the
// handful of chars in a color-transitioning stage on any given frame.
function mix(a: string, b: string, t: number): string {
  const tt = t < 0 ? 0 : t > 1 ? 1 : t
  const ar = parseInt(a.slice(1, 3), 16)
  const ag = parseInt(a.slice(3, 5), 16)
  const ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16)
  const bg = parseInt(b.slice(3, 5), 16)
  const bb = parseInt(b.slice(5, 7), 16)
  const r = Math.round(ar + (br - ar) * tt)
  const g = Math.round(ag + (bg - ag) * tt)
  const bl = Math.round(ab + (bb - ab) * tt)
  return `rgb(${r},${g},${bl})`
}

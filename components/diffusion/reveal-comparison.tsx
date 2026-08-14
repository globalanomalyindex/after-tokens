'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'

// A live, looping experiment: the same line resolves two ways, finishing at the
// exact same instant. Both panels share the SAME blur range and the SAME opacity
// floor (see BLUR_MAX / OP_FLOOR below), so the only variable is the cadence,
// the order and pace words arrive in. The linear side is a fair baseline, not a
// strawman.
//   left  : generic LINEAR blur -> unblur (a uniform wall, one constant ramp,
//           every word sharpening together)
//   right : GOLDEN-RATIO reveal: words land OUT OF ORDER on a 1/φ-decay cadence
//           (a deliberate first breadcrumb, then an accelerating flood). The
//           reveal order itself follows a golden-angle stride, the way seeds
//           pack a seed head, scattered, never left-to-right.
//
// Under each panel runs a row of evenly-spaced crosshairs that lights up like a
// runway. The travelling mark is driven by how much of THAT panel has actually
// resolved, so the light and the text stay in sync: the left sweeps at a
// constant pace, the right holds back then rushes with the flood. Both reach the
// final mark together; at the loop seam the light rushes back to realign.
//
// One rAF loop writes blur/opacity to the words and opacity to the crosshairs,
// no per-frame React. Plays only while in view.
//
// Below the panels sits a SCRUBBER. The comparison is presented as a study
// protocol elsewhere in this piece ("after interrupting the sequence at matched
// timestamps, can a participant identify what is still changing"), and a
// protocol you cannot interrupt is not checkable. The scrubber turns the
// looping stimulus into something a reviewer can stop and inspect at any
// timestamp: a range input, plus a fine-pointer drag directly on the panels as
// a progressive enhancement. Scrubbing stops the rAF loop entirely (there is no
// reason to keep requesting frames while pinned) and calls the same `paint`
// function directly with the chosen timestamp, so the scrubbed frame and the
// looping frame are pixel-identical, only their driver differs. The scrub range
// excludes the RUSH seam, since that rewind is a loop artifact, not part of the
// stimulus being studied.

const PHI = 1.61803398875
const PHRASE = 'the answer taking shape, region by region, in view'
const WORDS = PHRASE.split(' ')

const LOAD = 700 // the "thinking" beat
const REVEAL = 2600 // both resolve over this window, ending together
const HOLD = 1000 // both fully sharp
const RUSH = 460 // the light rushes back to the start to realign the loop
const TOTAL = LOAD + REVEAL + HOLD + RUSH
const WORD_SPAN = 0.15 // fraction of REVEAL a single word takes to sharpen

// The inspectable stimulus window. RUSH is a loop-seam rewind, not part of what
// the study protocol asks a reviewer to interrupt, so the scrubber never lets
// you drag into it.
const SCRUB_MAX = LOAD + REVEAL + HOLD

const N = 24 // crosshairs per strip

// Both panels share the SAME blur range and the SAME opacity floor. The only
// variable being compared is the cadence (one constant ramp vs a 1/φ, out-of-
// order reveal), so the linear baseline is not a strawman.
const BLUR_MAX = 9 // px each word travels from blurred to sharp, both panels
const OP_FLOOR = 0.32 // opacity of a not-yet-resolved word, both panels
const OP_RANGE = 1 - OP_FLOOR

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

function clampMs(v: number, max: number): number {
  return v < 0 ? 0 : v > max ? max : v
}

function gcd(a: number, b: number): number {
  while (b) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

// The 1/φ cadence: gaps between successive reveals shrink by 1/φ, so most words
// land in a late flood. Normalized so the final slot finishes exactly at the end
// of REVEAL (in sync with the left panel).
const SLOTS: number[] = (() => {
  const n = WORDS.length
  const gaps = Array.from({ length: Math.max(1, n - 1) }, (_, k) => Math.pow(1 / PHI, k))
  const cum = [0]
  for (let i = 0; i < gaps.length; i++) cum.push(cum[i]! + gaps[i]!)
  const last = cum[cum.length - 1] || 1
  return cum.map((c) => (c / last) * (1 - WORD_SPAN))
})()

// The reveal ORDER, scattered, not sequential. A stride near n/φ steps through
// every index exactly once (it is coprime to n), the same golden-angle trick a
// seed head uses to pack without clustering. So word k of the cadence is a jump
// across the line, never the next one over.
const REVEAL_ORDER: number[] = (() => {
  const n = WORDS.length
  let stride = Math.max(2, Math.round(n / PHI))
  while (stride < n && gcd(stride, n) !== 1) stride++
  if (gcd(stride, n) !== 1) stride = 1
  const offset = Math.floor(n / 3)
  return Array.from({ length: n }, (_, k) => (offset + k * stride) % n)
})()

// Per-word reveal start: word REVEAL_ORDER[k] takes the k-th cadence slot.
const WORD_START: number[] = (() => {
  const arr = new Array(WORDS.length).fill(0)
  REVEAL_ORDER.forEach((wi, k) => {
    arr[wi] = SLOTS[k] ?? 1 - WORD_SPAN
  })
  return arr
})()

// Light one crosshair strip: a comet centred on `active` (a float index), each
// mark a few shades dimmer per step until it returns to the dark default ~4
// steps out. `lit` globally scales the glow (0 = dormant track).
function paintStrip(arr: (HTMLSpanElement | null)[], active: number, lit: number) {
  for (let i = 0; i < arr.length; i++) {
    const el = arr[i]
    if (!el) continue
    const t = Math.max(0, 1 - Math.abs(i - active) / 4) * lit
    el.style.opacity = (0.08 + t * 0.92).toFixed(3)
  }
}

export function RevealComparison() {
  const reduced = usePrefersReducedMotion()
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const leftRefs = useRef<(HTMLSpanElement | null)[]>([])
  const rightRefs = useRef<(HTMLSpanElement | null)[]>([])
  const leftLoad = useRef<HTMLDivElement | null>(null)
  const rightLoad = useRef<HTMLDivElement | null>(null)
  const leftXhairs = useRef<(HTMLSpanElement | null)[]>([])
  const rightXhairs = useRef<(HTMLSpanElement | null)[]>([])
  const readoutRef = useRef<HTMLOutputElement | null>(null)

  // null = the loop is running; a number = pinned at that timestamp (scrubbing).
  const [scrubMs, setScrubMs] = useState<number | null>(null)
  const scrubRef = useRef<number | null>(null)
  const inViewRef = useRef(false)
  const draggingRef = useRef(false)

  // Stable callables so JSX handlers (range input, pointer drag, Escape key,
  // resume button) can reach into the current effect run without the effect
  // itself re-subscribing on every render.
  const paintRef = useRef<(e: number) => void>(() => {})
  const beginScrubRef = useRef<(v: number) => void>(() => {})
  const resumeRef = useRef<() => void>(() => {})

  const [finePointer, setFinePointer] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    setFinePointer(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  useEffect(() => {
    function paint(e: number) {
      let loadingOp: number
      let wordMul: number
      let p: number // reveal progress 0..1 (drives blur)
      let lit: number // global glow amount
      let rushBack = -1 // >=0 during the seam rewind
      if (e < LOAD) {
        loadingOp = Math.min(1, e / 200)
        wordMul = 0
        p = 0
        lit = 0
      } else if (e < LOAD + REVEAL) {
        const r = e - LOAD
        loadingOp = Math.max(0, 1 - r / 220)
        wordMul = Math.min(1, r / 220)
        p = r / REVEAL
        lit = Math.min(1, r / 180)
      } else if (e < LOAD + REVEAL + HOLD) {
        loadingOp = 0
        wordMul = 1
        p = 1
        lit = 1
      } else {
        const rr = (e - LOAD - REVEAL - HOLD) / RUSH // 0..1
        loadingOp = 0
        p = 1
        wordMul = Math.max(0, 1 - rr * 1.4) // words clear out before the loop
        lit = 1 - clamp01((rr - 0.55) / 0.45) // comet dims as it arrives home
        rushBack = (N - 1) * (1 - rr)
      }

      // left: one uniform, linear blur ramp; resolution == p. Same BLUR_MAX
      // and OP_FLOOR as the right panel, so only the cadence differs.
      const lBlur = ((1 - p) * BLUR_MAX).toFixed(2)
      const lOp = String((OP_FLOOR + p * OP_RANGE) * wordMul)
      for (const el of leftRefs.current) {
        if (!el) continue
        el.style.filter = `blur(${lBlur}px)`
        el.style.opacity = lOp
      }
      // right: out-of-order golden-ratio reveal; accumulate mean resolution.
      // Identical BLUR_MAX and OP_FLOOR; the per-word start time is the only
      // thing the cadence changes.
      let sum = 0
      for (let i = 0; i < rightRefs.current.length; i++) {
        const el = rightRefs.current[i]
        if (!el) continue
        const local = clamp01((p - WORD_START[i]!) / WORD_SPAN)
        el.style.filter = `blur(${((1 - local) * BLUR_MAX).toFixed(2)}px)`
        el.style.opacity = String((OP_FLOOR + local * OP_RANGE) * wordMul)
        sum += local
      }
      const meanLocal = sum / (rightRefs.current.length || WORDS.length)

      if (leftLoad.current) leftLoad.current.style.opacity = String(loadingOp)
      if (rightLoad.current) rightLoad.current.style.opacity = String(loadingOp)

      // comets track each panel's own resolution (so the light syncs the text)
      const leftA = rushBack >= 0 ? rushBack : p * (N - 1)
      const rightA = rushBack >= 0 ? rushBack : meanLocal * (N - 1)
      paintStrip(leftXhairs.current, leftA, lit)
      paintStrip(rightXhairs.current, rightA, lit)

      // The readout while the loop is running is written straight to the DOM,
      // not React state (that would be a per-frame re-render). While scrubbing,
      // the <output>'s text is React-controlled instead (see the JSX below), so
      // skip the imperative write and let that render win.
      if (readoutRef.current && scrubRef.current === null) {
        const shown = Math.min(e, SCRUB_MAX)
        readoutRef.current.textContent = `${(shown / 1000).toFixed(2)}s / ${(SCRUB_MAX / 1000).toFixed(2)}s`
      }
    }
    paintRef.current = paint

    // Loop control is mutable so it can be reassigned only in the running
    // (non-reduced-motion) branch below; beginScrub/resume close over these
    // by reference, so calling them before reassignment (the reduced-motion
    // branch, where there is no loop at all) is always a safe no-op.
    let stopLoop: () => void = () => {}
    let startLoop: () => void = () => {}

    const beginScrub = (v: number) => {
      const clamped = clampMs(v, SCRUB_MAX)
      scrubRef.current = clamped
      setScrubMs(clamped)
      stopLoop()
      paint(clamped)
    }
    const resume = () => {
      if (reduced) return // no loop to resume to; the scrubber stays live
      scrubRef.current = null
      setScrubMs(null)
      if (inViewRef.current) startLoop()
    }
    beginScrubRef.current = beginScrub
    resumeRef.current = resume

    if (reduced) {
      // The loop never runs, but the scrubber is fully live: start pinned at
      // mid-reveal, where the two cadences diverge most, so a reduced-motion
      // visitor can inspect the whole stimulus on their own terms instead of
      // only ever seeing the frozen end state.
      const initial = LOAD + REVEAL * 0.55
      scrubRef.current = initial
      setScrubMs(initial)
      paint(initial)
      return
    }

    let raf = 0
    let start: number | null = null
    const frame = (now: number) => {
      if (start === null) start = now
      paint((now - start) % TOTAL)
      raf = requestAnimationFrame(frame)
    }
    startLoop = () => {
      if (scrubRef.current !== null) return // pinned; do not resume on our own
      if (!raf) {
        start = null
        raf = requestAnimationFrame(frame)
      }
    }
    stopLoop = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    let io: IntersectionObserver | null = null
    if (wrapRef.current && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        ([en]) => {
          const intersecting = en?.isIntersecting ?? false
          inViewRef.current = intersecting
          if (intersecting) startLoop()
          else stopLoop()
        },
        { threshold: 0.3 },
      )
      io.observe(wrapRef.current)
    } else {
      inViewRef.current = true
      startLoop()
    }
    return () => {
      stopLoop()
      io?.disconnect()
    }
  }, [reduced])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('.scrub-row, .scrub-range')) return
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    beginScrubRef.current(clamp01((e.clientX - rect.left) / rect.width) * SCRUB_MAX)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    beginScrubRef.current(clamp01((e.clientX - rect.left) / rect.width) * SCRUB_MAX)
  }
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
    // Leave the scrub pinned: the reviewer is inspecting a frame, don't yank it away.
  }

  const rangeValue = scrubMs ?? 0

  return (
    <div
      ref={wrapRef}
      className="flex flex-col gap-3"
      onKeyDown={(e) => {
        if (e.key === 'Escape') resumeRef.current()
      }}
    >
      <div
        className="grid sm:grid-cols-2 gap-4 md:gap-5"
        onPointerDown={finePointer ? handlePointerDown : undefined}
        onPointerMove={finePointer ? handlePointerMove : undefined}
        onPointerUp={finePointer ? handlePointerUp : undefined}
        onPointerCancel={finePointer ? handlePointerUp : undefined}
      >
        <Panel label="blur → unblur" sub="linear" wordRefs={leftRefs} loadRef={leftLoad} xhairRefs={leftXhairs} />
        <Panel
          label="authored cadence"
          sub="out of order · phi-decay"
          wordRefs={rightRefs}
          loadRef={rightLoad}
          xhairRefs={rightXhairs}
        />
      </div>

      <div className="scrub-row">
        <span className="scrub-label">+ scrub the stimulus</span>
        <output ref={readoutRef} className="scrub-readout" aria-live="off">
          {(rangeValue / 1000).toFixed(2)}s / {(SCRUB_MAX / 1000).toFixed(2)}s
        </output>
      </div>
      <input
        type="range"
        className="scrub-range"
        min={0}
        max={SCRUB_MAX}
        step={10}
        value={rangeValue}
        onChange={(e) => beginScrubRef.current(Number(e.currentTarget.value))}
        aria-label="scrub the reveal timeline"
        aria-valuetext={`${(rangeValue / 1000).toFixed(2)} seconds of ${(SCRUB_MAX / 1000).toFixed(2)}`}
      />
      {scrubMs !== null && !reduced && (
        <button
          type="button"
          className="scrub-resume"
          onClick={() => resumeRef.current()}
          aria-label="resume the looping comparison"
        >
          resume loop
        </button>
      )}
    </div>
  )
}

function Panel({
  label,
  sub,
  wordRefs,
  loadRef,
  xhairRefs,
}: {
  label: string
  sub: string
  wordRefs: React.MutableRefObject<(HTMLSpanElement | null)[]>
  loadRef: React.MutableRefObject<HTMLDivElement | null>
  xhairRefs: React.MutableRefObject<(HTMLSpanElement | null)[]>
}) {
  return (
    <div
      className="panel-accent rounded-2xl p-6 md:p-7 flex flex-col"
      style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
    >
      {/* the response frame */}
      <div className="relative flex-1 min-h-[132px] flex items-center">
        <p aria-hidden="true" className="text-lg md:text-xl leading-relaxed" style={{ fontFamily: 'var(--font-ui)' }}>
          {WORDS.map((w, i) => (
            // data-stimulus-word: these glyphs spend most of their life
            // deliberately unreadable (blurred, at the shared opacity floor).
            // That IS the stimulus, so an automated contrast check has to be
            // told to skip them; the attribute is the hook it uses.
            <span
              key={i}
              data-stimulus-word
              ref={(el) => {
                wordRefs.current[i] = el
              }}
              style={{ display: 'inline-block', marginRight: '0.28em', opacity: 0 }}
            >
              {w}
            </span>
          ))}
        </p>
        {/* loading beat */}
        <div
          ref={loadRef}
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5"
          style={{ opacity: 0 }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="thinking-dot"
              style={{ background: 'var(--stage-text)', animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
      </div>

      {/* title moved to the bottom-left, sitting above the crosshair runway */}
      <div className="mt-5">
        <div
          className="flex items-baseline justify-between mb-1 text-[10px] tracking-[0.16em]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span style={{ color: 'color-mix(in oklab, var(--stage-text) 82%, transparent)' }}>{label}</span>
          <span style={{ color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)' }}>{sub}</span>
        </div>
        <div className="xhair-strip" aria-hidden="true">
          {Array.from({ length: N }).map((_, i) => (
            <span
              key={i}
              className="xhair"
              ref={(el) => {
                xhairRefs.current[i] = el
              }}
              style={{ color: 'var(--stage-text)' }}
            >
              +
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

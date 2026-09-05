'use client'

import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
import cadence from '@/data/traces/derived/cadence.json'

// An instrument-panel visualizer for the golden-ratio motion the mycelium mode
// runs on. A reticle (box + crosshair) glides along a cubic-bezier that holds
// slow then sweeps: the φ-decay easing, authored before any trajectory was
// recorded. Alongside it, static and unanimated, is the recorded word-lock
// cadence from the traced sampler: the median (and 25th-75th band) fraction of
// words locked by word rank, across 20 runs. That recorded curve is close to
// linear, because the schedule commits a fixed number of tokens per denoising
// step; phi is the shape mycelium's cadence chooses to perform instead. Below
// the plot, "lock" ticks sit at intervals that shrink by 1/φ; each lights as
// the reticle passes, so you watch the authored cadence go from deliberate to
// a sudden flood, the way an answer resolves.
//
// Motion notes:
// - Driven along ARC LENGTH (getPointAtLength) at constant velocity, with the
//   trail revealed by the same fraction, so the reticle always rides the
//   leading edge and the glide stays smooth.
// - A phased loop (draw → hold → fade → reset) dissolves instead of teleporting.
// - A one-shot WAAPI pulse lands the arrival.
// - Plays only while in view, restarting from zero on entry.
// All of it is written straight to the SVG from one rAF loop , no per-frame
// React work, no CSS-transform vs viewBox scaling quirks.

const PHI = 1.61803398875

// The curve, borrowed from --ease-phi-sweep: a long low hold, then a sweep.
const C1X = 0.7
const C1Y = 0.0
const C2X = 0.18
const C2Y = 1.0

// viewBox geometry
const W = 360
const H = 250
const PAD = { l: 42, r: 24, t: 20, b: 44 }
const PW = W - PAD.l - PAD.r
const PH = H - PAD.t - PAD.b

const X = (n: number) => PAD.l + n * PW
const Y = (n: number) => PAD.t + (1 - n) * PH

// Recorded word-lock cadence (lowconf-b32, n=20 runs): median lock fraction by
// word rank, plus the 25th-75th band. Static, unanimated, built once at module
// scope from the same X()/Y() mapping the phi curve uses.
type CadenceSeries = {
  n: number
  rank: (number | null)[]
  lock_fraction_median: (number | null)[]
  lock_fraction_p25: (number | null)[]
  lock_fraction_p75: (number | null)[]
}

const RECORDED_CADENCE = (cadence as Record<string, CadenceSeries>)['lowconf-b32']!

function buildRecordedCadencePaths(series: CadenceSeries): { median: string; band: string } {
  const medianPts: { x: number; y: number }[] = []
  for (let i = 0; i < series.rank.length; i++) {
    const r = series.rank[i]
    const m = series.lock_fraction_median[i]
    if (r == null || m == null) continue
    medianPts.push({ x: X(r), y: Y(m) })
  }
  const median = medianPts.length
    ? `M ${medianPts.map((p) => `${p.x} ${p.y}`).join(' L ')}`
    : ''

  const upperPts: { x: number; y: number }[] = []
  const lowerPts: { x: number; y: number }[] = []
  for (let i = 0; i < series.rank.length; i++) {
    const r = series.rank[i]
    const p25 = series.lock_fraction_p25[i]
    const p75 = series.lock_fraction_p75[i]
    if (r == null || p25 == null || p75 == null) continue
    upperPts.push({ x: X(r), y: Y(p75) })
    lowerPts.push({ x: X(r), y: Y(p25) })
  }
  let band = ''
  if (upperPts.length && lowerPts.length) {
    const top = `M ${upperPts.map((p) => `${p.x} ${p.y}`).join(' L ')}`
    const bottom = lowerPts
      .slice()
      .reverse()
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ')
    band = `${top} ${bottom} Z`
  }
  return { median, band }
}

const RECORDED_CADENCE_PATHS = buildRecordedCadencePaths(RECORDED_CADENCE)

// Lock cadence: gaps shrink by 1/φ each step, normalized to [0,1]. Ticks bunch
// toward the end , the "drilling, then flooded" acceleration.
const LOCK_TICKS: number[] = (() => {
  const n = 8
  const gaps = Array.from({ length: n }, (_, k) => Math.pow(1 / PHI, k))
  const total = gaps.reduce((s, g) => s + g, 0)
  const out: number[] = []
  let acc = 0
  for (let k = 0; k < n; k++) {
    out.push(acc / total)
    acc += gaps[k]!
  }
  out.push(1)
  return out
})()

const CURVE_PATH = `M ${X(0)} ${Y(0)} C ${X(C1X)} ${Y(C1Y)} ${X(C2X)} ${Y(C2Y)} ${X(1)} ${Y(1)}`

// Phase timing. The draw is the only long part; everything else stays snappy.
const DRAW_MS = 1700
const HOLD_MS = 620
const OUT_MS = 420
const GAP_MS = 200
const FADE_IN_MS = 220
const TOTAL_MS = DRAW_MS + HOLD_MS + OUT_MS + GAP_MS

// Constant-velocity along the path looks mechanical; a gentle ease-in-out on the
// draw makes the reticle leave and arrive softly without distorting the curve it
// traces (the curve shape still tells the φ story).
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function GoldenCurve() {
  const reduced = usePrefersReducedMotion()
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const playedRef = useRef<SVGGElement | null>(null)
  const reticleRef = useRef<SVGGElement | null>(null)
  const pulseRef = useRef<SVGGElement | null>(null)
  const trailRef = useRef<SVGPathElement | null>(null)
  const tickRefs = useRef<(SVGLineElement | null)[]>([])

  useEffect(() => {
    const trail = trailRef.current
    const played = playedRef.current
    if (!trail || !played) return
    const L = trail.getTotalLength()

    // Place the reticle + trail + ticks at draw fraction f (0..1 of the path).
    function place(f: number) {
      const pt = trail!.getPointAtLength(f * L)
      reticleRef.current?.setAttribute('transform', `translate(${pt.x} ${pt.y})`)
      trail!.style.strokeDashoffset = String(1 - f)
      for (let i = 0; i < LOCK_TICKS.length; i++) {
        const el = tickRefs.current[i]
        if (el) el.style.opacity = X(LOCK_TICKS[i]!) <= pt.x + 0.5 ? '1' : '0.2'
      }
    }
    const setOpacity = (o: number) => {
      played!.style.opacity = String(o)
    }

    if (reduced) {
      place(1)
      setOpacity(1)
      return
    }

    let raf = 0
    let cycleStart: number | null = null
    let locked = false

    const frame = (now: number) => {
      if (cycleStart === null) cycleStart = now
      let e = now - cycleStart
      if (e >= TOTAL_MS) {
        cycleStart = now
        e = 0
        locked = false
      }

      if (e < DRAW_MS) {
        place(easeInOut(e / DRAW_MS))
        setOpacity(Math.min(1, e / FADE_IN_MS))
      } else if (e < DRAW_MS + HOLD_MS) {
        place(1)
        setOpacity(1)
        if (!locked) {
          locked = true
          // Arrival beat: the reticle lands with a quick scale pulse.
          pulseRef.current?.animate(
            [{ transform: 'scale(1)' }, { transform: 'scale(1.26)' }, { transform: 'scale(1)' }],
            { duration: 380, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
          )
        }
      } else if (e < DRAW_MS + HOLD_MS + OUT_MS) {
        place(1)
        setOpacity(1 - (e - DRAW_MS - HOLD_MS) / OUT_MS)
      } else {
        setOpacity(0)
      }
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (!raf) {
        cycleStart = null
        locked = false
        raf = requestAnimationFrame(frame)
      }
    }
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    // Play only while visible; restart the draw each time it scrolls into view.
    let io: IntersectionObserver | null = null
    if (wrapRef.current && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) start()
          else stop()
        },
        { threshold: 0.3 },
      )
      io.observe(wrapRef.current)
    } else {
      start()
    }

    return () => {
      stop()
      io?.disconnect()
    }
  }, [reduced])

  const gridN = [0, 0.25, 0.5, 0.75, 1]
  const faint = 'color-mix(in oklab, var(--stage-text) 12%, transparent)'
  const dim = 'color-mix(in oklab, var(--stage-text) 30%, transparent)'

  return (
    <div
      ref={wrapRef}
      className="rounded-2xl p-5 md:p-6"
      style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
    >
      <div
        className="mb-3 text-[10px] lowercase tracking-[0.16em]"
        style={{ fontFamily: 'var(--font-mono)', color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)' }}
      >
        + φ-decay easing
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ height: 'auto', display: 'block', overflow: 'visible' }}
        role="img"
        aria-label="An easing curve where each interval shrinks by one over phi: slow at first, then a sudden sweep to resolved."
      >
        <defs>
          <filter id="phi-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* grid */}
        {gridN.map((n) => (
          <line key={`v${n}`} x1={X(n)} y1={Y(0)} x2={X(n)} y2={Y(1)} stroke={faint} strokeWidth={1} />
        ))}
        {gridN.map((n) => (
          <line key={`h${n}`} x1={X(0)} y1={Y(n)} x2={X(1)} y2={Y(n)} stroke={faint} strokeWidth={1} />
        ))}

        {/* axis labels */}
        <text
          x={X(0)}
          y={Y(0) + 26}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em' }}
          fill={dim}
        >
          time →
        </text>
        <text
          x={X(0) - 8}
          y={Y(1) - 8}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em' }}
          fill={dim}
        >
          resolved
        </text>

        {/* recorded word-lock cadence (median + p25-p75 band): static, behind
            everything animated, so the reticle still reads as the subject */}
        {RECORDED_CADENCE_PATHS.band && (
          <path d={RECORDED_CADENCE_PATHS.band} fill="var(--muted)" fillOpacity={0.1} stroke="none" />
        )}
        {RECORDED_CADENCE_PATHS.median && (
          <path
            d={RECORDED_CADENCE_PATHS.median}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={1.25}
            strokeDasharray="3,3"
          />
        )}

        {/* legend */}
        <g style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}>
          <line x1={X(0) + 2} y1={Y(1) + 12} x2={X(0) + 14} y2={Y(1) + 12} stroke="var(--accent)" strokeWidth={1.5} />
          <text x={X(0) + 18} y={Y(1) + 15} fill={dim} className="lowercase">
            phi decay, authored
          </text>
          <line
            x1={X(0) + 2}
            y1={Y(1) + 24}
            x2={X(0) + 14}
            y2={Y(1) + 24}
            stroke="var(--muted)"
            strokeWidth={1.25}
            strokeDasharray="3,3"
          />
          <text x={X(0) + 18} y={Y(1) + 27} fill={dim} className="lowercase">
            recorded, median of 20 runs
          </text>
        </g>

        {/* full curve, the faint track , always visible */}
        <path d={CURVE_PATH} fill="none" stroke={dim} strokeWidth={1.5} />

        {/* the played layer: trail + ticks + reticle, faded in/out as one unit */}
        <g ref={playedRef} style={{ opacity: 0 }}>
          <path
            ref={trailRef}
            d={CURVE_PATH}
            fill="none"
            stroke="var(--stage-text)"
            strokeWidth={2.4}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1}
            filter="url(#phi-glow)"
          />

          {/* lock cadence ticks */}
          {LOCK_TICKS.map((p, i) => (
            <line
              key={i}
              ref={(el) => {
                tickRefs.current[i] = el
              }}
              x1={X(p)}
              y1={Y(0) + 8}
              x2={X(p)}
              y2={Y(0) + 15}
              stroke="var(--stage-text)"
              strokeWidth={1.5}
              style={{ opacity: 0.2 }}
            />
          ))}

          {/* reticle: outer g translates along the path, inner g handles the pulse */}
          <g ref={reticleRef} transform={`translate(${X(0)} ${Y(0)})`}>
            <g
              ref={pulseRef}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              filter="url(#phi-glow)"
            >
              <rect x={-9} y={-9} width={18} height={18} fill="none" stroke="var(--stage-text)" strokeWidth={1.4} />
              <line x1={-14} y1={0} x2={14} y2={0} stroke="var(--stage-text)" strokeWidth={1} />
              <line x1={0} y1={-14} x2={0} y2={14} stroke="var(--stage-text)" strokeWidth={1} />
              <circle cx={0} cy={0} r={1.6} fill="var(--stage-text)" />
            </g>
          </g>
        </g>
      </svg>

      <div
        className="flex items-center justify-between mt-3 text-[10px] lowercase tracking-[0.16em]"
        style={{ fontFamily: 'var(--font-mono)', color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)' }}
      >
        <span>cubic-bezier(.7, 0, .18, 1)</span>
        <span>interval ×= 1 / φ ≈ 0.618</span>
      </div>
    </div>
  )
}

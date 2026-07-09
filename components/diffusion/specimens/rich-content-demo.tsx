'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'

// Rich-content specimen with a LIVING loading state. Before any word exists,
// the card breathes in organic green: a wellness brand's identity, present in
// the very first frame. The loading state is not dead time for a spinner. It
// is alive, on-brand, and already part of the answer. The green then recedes
// to a soft aura as the answer resolves over it, proving the contract carries
// rich content too: bold, italics, a size jump, color, and an emoji all
// diffuse in the same seeded order, each keeping its formatting. Loops.
// On-screen-gated, reduced-motion safe.

type Seg = { t: string; b?: boolean; i?: boolean; c?: string; big?: boolean; muted?: boolean }

const LINES: Seg[][] = [
  [{ t: 'Your morning reset ', b: true, big: true }, { t: '\u{1F33F}', big: true }],
  [{ t: 'Take ' }, { t: 'five quiet minutes', i: true }, { t: ' of daylight, before any screen.' }],
  [
    { t: 'Hydrate', b: true, c: '#177A52' },
    { t: ', then one slow breath. Your focus is a ' },
    { t: 'renewable', b: true, c: '#177A52' },
    { t: ' resource.' },
  ],
  [{ t: 'Spend it like it is scarce, and it lasts all day.', i: true, muted: true }],
]

// Seeded reveal order across all segments, so it resolves non-sequentially.
const FLAT_COUNT = LINES.reduce((n, line) => n + line.length, 0)
function seededRanks(n: number): number[] {
  let seed = 99173
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
  const rank = new Array<number>(n).fill(0)
  arr.forEach((flatIdx, pos) => {
    rank[flatIdx] = pos
  })
  return rank
}
const RANKS = seededRanks(FLAT_COUNT)
let _c = 0
const LINES_RANKED = LINES.map((line) => line.map((seg) => ({ ...seg, rank: RANKS[_c++] ?? 0 })))

type Phase = 'loading' | 'resolving' | 'hold' | 'releasing'

const LOAD_MS = 2000 // living-green loading mood, no text yet
const STEP = 135 // gap between segment reveals
const HOLD = 2300 // fully-resolved hold
const FADE = 760 // text fades, green blooms back before next cycle

export function RichContentDemo({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      setPhase('hold')
      setRevealed(FLAT_COUNT)
      return
    }

    let timers: ReturnType<typeof setTimeout>[] = []
    let running = false
    let inView = false
    const clearTimers = () => {
      timers.forEach(clearTimeout)
      timers = []
    }
    const runCycle = () => {
      clearTimers()
      setPhase('loading')
      setRevealed(0)
      // After the green loading mood, the answer resolves over a receding aura.
      timers.push(
        setTimeout(() => {
          setPhase('resolving')
          for (let i = 1; i <= FLAT_COUNT; i++) {
            timers.push(setTimeout(() => setRevealed(i), i * STEP))
          }
          const resolveDur = (FLAT_COUNT + 1) * STEP
          timers.push(setTimeout(() => setPhase('hold'), resolveDur))
          timers.push(setTimeout(() => setPhase('releasing'), resolveDur + HOLD))
          timers.push(
            setTimeout(() => {
              if (running) runCycle()
            }, resolveDur + HOLD + FADE),
          )
        }, LOAD_MS),
      )
    }
    const start = () => {
      if (running) return
      running = true
      runCycle()
    }
    const stop = () => {
      running = false
      clearTimers()
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = !!entry?.isIntersecting
        if (inView && !document.hidden) start()
        else stop()
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    const onVis = () => {
      if (document.hidden) stop()
      else if (inView) start()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [reduced])

  return (
    <div
      ref={ref}
      className={`relative h-full w-full overflow-hidden flex items-center ${className}`}
      style={{ background: '#FBFBFD', fontFamily: 'var(--font-ui)' }}
    >
      {/* The living loading state: organic green that IS the brand, present
          before any word. Recedes to a soft aura as the answer arrives. */}
      <div className="rc-field" data-phase={phase} aria-hidden="true">
        <span className="rc-wash" />
        <span className="rc-blob rc-b1" />
        <span className="rc-blob rc-b2" />
        <span className="rc-blob rc-b3" />
      </div>

      <div
        className="relative z-10 px-7 md:px-9 py-7 w-full"
        style={{
          transition: 'opacity 700ms cubic-bezier(0.16,1,0.3,1)',
          opacity: phase === 'releasing' ? 0 : 1,
        }}
      >
        {LINES_RANKED.map((line, li) => (
          <div
            key={li}
            style={{
              marginBottom: li === 0 ? '0.7em' : '0.35em',
              lineHeight: 1.5,
              color: '#1F1F1F',
              fontSize: li === 0 ? '1.4rem' : '1.05rem',
            }}
          >
            {line.map((seg, si) => {
              const isOn = reduced || seg.rank < revealed
              return (
                <span
                  key={si}
                  style={{
                    fontWeight: seg.b ? 700 : 400,
                    fontStyle: seg.i ? 'italic' : 'normal',
                    color: seg.c ?? (seg.muted ? '#666666' : undefined),
                    fontSize: seg.big ? '1.15em' : undefined,
                    opacity: isOn ? 1 : 0,
                    filter: isOn ? 'blur(0px)' : 'blur(7px)',
                    transition:
                      'opacity 440ms cubic-bezier(0.16,1,0.3,1), filter 440ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  {seg.t}
                </span>
              )
            })}
          </div>
        ))}
      </div>

      <style>{`
        .rc-field {
          position: absolute;
          inset: 0;
          pointer-events: none;
          transition: opacity 760ms cubic-bezier(0.16,1,0.3,1);
        }
        /* Loading + releasing: the green is the screen. Resolving + hold: it
           recedes to a soft brand aura behind the words. */
        .rc-field[data-phase="loading"],
        .rc-field[data-phase="releasing"] { opacity: 1; }
        .rc-field[data-phase="resolving"],
        .rc-field[data-phase="hold"] { opacity: 0.3; }

        .rc-wash {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(130% 115% at 38% 28%, #CFE9C0 0%, #DCF0D2 55%, #ECF5E7 100%);
        }
        .rc-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(24px);
          will-change: transform;
        }
        .rc-b1 {
          width: 64%; height: 80%; left: -10%; top: -14%;
          background: radial-gradient(circle at 50% 50%, #45B783, rgba(69,183,131,0) 70%);
          animation: rc-d1 9.5s ease-in-out infinite alternate;
        }
        .rc-b2 {
          width: 58%; height: 72%; right: -12%; top: 4%;
          background: radial-gradient(circle at 50% 50%, #1F9D6B, rgba(31,157,107,0) 70%);
          animation: rc-d2 11.5s ease-in-out infinite alternate;
        }
        .rc-b3 {
          width: 70%; height: 70%; left: 16%; bottom: -22%;
          background: radial-gradient(circle at 50% 50%, #B9D98C, rgba(185,217,140,0) 72%);
          animation: rc-d3 13.5s ease-in-out infinite alternate;
        }
        @keyframes rc-d1 { from { transform: translate(0,0) scale(1); } to { transform: translate(14%,10%) scale(1.16); } }
        @keyframes rc-d2 { from { transform: translate(0,0) scale(1.08); } to { transform: translate(-12%,8%) scale(0.92); } }
        @keyframes rc-d3 { from { transform: translate(0,0) scale(0.96); } to { transform: translate(8%,-12%) scale(1.18); } }

        @media (prefers-reduced-motion: reduce) {
          .rc-blob { animation: none; }
          .rc-field { transition: none; }
        }
      `}</style>
    </div>
  )
}

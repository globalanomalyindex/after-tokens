'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { arrivalOf, fade, typewriter } from '@/lib/arrival/references'
import { crystal } from '@/lib/diffusion/modes/crystal'
import { arrivalProfile } from '@/lib/arrival/profile'
import type { ModeName, ModeStrategy } from '@/lib/diffusion/types'

// Same words, three arrivals, one clock. The typewriter every chat product
// ships, a uniform fade, and the grammar, side by side on the same answer
// with the same total duration, so whatever differs is the shape of the
// arrival and nothing else. Under each, its profile for this text.

const ARRIVALS: { mode: ModeName; strategy: ModeStrategy; name: string; note: string }[] = [
  { mode: 'typewriter', strategy: typewriter, name: 'typewriter', note: 'one open loop, always at the cursor' },
  { mode: 'fade', strategy: fade, name: 'fade', note: 'no loop, then everything at once' },
  { mode: 'crystal', strategy: crystal, name: 'crystallize', note: 'two loops, each closing in reading order' },
]

type Props = { prompt: string; answer: string }

const pct = (x: number) => `${Math.round(x * 100)}%`

export function ArrivalsTrio({ prompt, answer }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [replay, setReplay] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const profiles = useMemo(
    () =>
      ARRIVALS.map((a) => {
        const arr = arrivalOf(a.strategy, answer, prompt)
        return arrivalProfile({ atoms: arr.atoms, locks: arr.locks, total: arr.total })
      }),
    [answer, prompt],
  )

  return (
    <div ref={ref} data-demo>
      <div className="grid gap-4 md:grid-cols-3">
        {ARRIVALS.map((a, i) => {
          const p = profiles[i]!
          return (
            <figure key={a.mode} className="m-0 flex flex-col">
              <div className="stage flex-1 p-5 md:p-6 min-h-[260px] flex flex-col">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="label keep-case" style={{ color: 'color-mix(in oklab, var(--stage-text) 80%, transparent)' }}>
                    {a.name}
                  </span>
                  <span className="label" style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}>
                    {(p.total / 1000).toFixed(1)}s
                  </span>
                </div>
                {active ? (
                  <DiffusionText
                    key={`${a.mode}-${replay}`}
                    mode={a.mode}
                    trigger="immediate"
                    topic={prompt}
                    className="text-[15px] md:text-base leading-relaxed"
                  >
                    {answer}
                  </DiffusionText>
                ) : (
                  <span aria-hidden="true" className="block text-[15px] md:text-base leading-relaxed opacity-0">
                    {answer}
                  </span>
                )}
              </div>
              <figcaption className="pt-3">
                <p className="text-sm leading-snug" style={{ color: 'var(--ink-2)' }}>
                  {a.note}
                </p>
                <dl className="readout mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5" style={{ color: 'var(--muted)' }}>
                  <dt>open loops</dt>
                  <dd>up to {p.tension.max}</dd>
                  <dt>reader waits</dt>
                  <dd>{pct(p.fluency.previewCost)}{' '}of fixations</dd>
                  <dt>phrase order</dt>
                  <dd>τ {p.fluency.tau >= 0 ? '+' : ''}{p.fluency.tau.toFixed(2)}</dd>
                  <dt>end weight</dt>
                  <dd>{p.peak.endWeight.toFixed(2)}×</dd>
                </dl>
              </figcaption>
            </figure>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs leading-relaxed max-w-xl" style={{ color: 'var(--muted)' }}>
          the prompt: “{prompt}” · the same {profiles[0]!.words}{' '}words and the same {(profiles[0]!.total / 1000).toFixed(1)}{' '}seconds in all three
        </p>
        <button
          type="button"
          onClick={() => setReplay((k) => k + 1)}
          className="replay-btn replay-btn-on-surface cursor-pointer inline-flex items-center gap-1.5 shrink-0"
          style={{ color: 'var(--muted)' }}
          aria-label="Replay all three arrivals"
        >
          <span aria-hidden="true" className="replay-glyph">↻</span>
          replay all
        </button>
      </div>
    </div>
  )
}

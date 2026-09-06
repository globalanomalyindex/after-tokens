'use client'

import { useMemo } from 'react'
import { LockMap } from './lock-map'
import { arrivalOf, fade, scatter, typewriter } from '@/lib/arrival/references'
import { computeCrystalSchedule, crystal } from '@/lib/diffusion/modes/crystal'
import { mycelium } from '@/lib/diffusion/modes/mycelium'
import { fog } from '@/lib/diffusion/modes/fog'
import { aurora } from '@/lib/diffusion/modes/aurora'
import { mitosis } from '@/lib/diffusion/modes/mitosis'
import { ARRIVAL, ARRIVAL_ORDER, type ArrivalKey } from '@/lib/traces/findings'
import type { ModeStrategy } from '@/lib/diffusion/types'

// Eight arrivals of one answer, drawn as lock maps, each with the medians of
// its profile over the eight fixtures. The grammar is the last one, in the
// accent, with its nuclei ringed.

const STRATEGIES: Record<ArrivalKey, ModeStrategy | undefined> = {
  typewriter,
  fade,
  scatter,
  fog,
  aurora,
  mitosis,
  mycelium,
  crystal,
  'crystal-unbounded': undefined,
  'crystal-1': undefined,
  'crystal-3': undefined,
  'crystal-strict': undefined,
}

const NAMES: Record<ArrivalKey, string> = {
  typewriter: 'typewriter',
  fade: 'fade',
  scatter: 'scatter',
  fog: 'fog',
  aurora: 'aurora',
  mitosis: 'mitosis',
  mycelium: 'mycelium',
  crystal: 'crystallize',
  'crystal-unbounded': 'crystallize, no budget',
  'crystal-1': 'crystallize, one loop',
  'crystal-3': 'crystallize, three loops',
  'crystal-strict': 'crystallize, no anchor',
}

const pct = (x: number) => `${Math.round(x * 100)}%`
const signed = (x: number) => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`

type Props = { answer: string; prompt: string }

export function ProfileFigure({ answer, prompt }: Props) {
  const maps = useMemo(
    () =>
      ARRIVAL_ORDER.map((key) => {
        const strategy = STRATEGIES[key]!
        const arr = arrivalOf(strategy, answer, prompt)
        const nuclei =
          key === 'crystal'
            ? new Set(computeCrystalSchedule(arr.atoms).phrases.filter((ph) => ph.end > ph.start).map((ph) => arr.atoms[ph.nucleus]!.index))
            : undefined
        return { key, ...arr, nuclei }
      }),
    [answer, prompt],
  )
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
      {maps.map((m) => {
        const med = ARRIVAL.arrivals[m.key]
        const isGrammar = m.key === 'crystal'
        return (
          <figure key={m.key} className="m-0">
            <LockMap atoms={m.atoms} locks={m.locks} total={m.total} accent={isGrammar} nuclei={m.nuclei} compact />
            <figcaption className="mt-2">
              <span className="block text-sm font-medium" style={{ color: isGrammar ? 'var(--cobalt)' : 'var(--ink)' }}>
                {NAMES[m.key]}
              </span>
              <dl className="readout mt-1 grid grid-cols-[auto_1fr] gap-x-3" style={{ color: 'var(--muted)' }}>
                <dt>loops</dt>
                <dd>≤ {med.tensionMax}</dd>
                <dt>waits</dt>
                <dd>{pct(med.previewCost)}</dd>
                <dt>order</dt>
                <dd>τ {signed(med.tau)}</dd>
                <dt>end</dt>
                <dd>{med.endWeight.toFixed(2)}×</dd>
              </dl>
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}

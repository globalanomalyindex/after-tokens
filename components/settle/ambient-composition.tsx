'use client'

import type { CSSProperties } from 'react'

export type AmbientCondition = 'static' | 'breathe' | 'reshape'

type Props = {
  active: boolean
  motion: boolean
  condition?: AmbientCondition
  complete: boolean
  runId: string | number
  tempo?: number
}

// Authored composition, not a prediction of answer lines, words or length.
// Every condition uses these exact shapes and starts at the same phase.
const BARS = [
  { width: '88%', top: '.55em' },
  { width: '64%', top: '1.92em' },
  { width: '92%', top: '3.31em' },
  { width: '72%', top: '4.69em' },
  { width: '80%', top: '6.05em' },
] as const

/** Nonlexical activity composition. It accepts no source tokens, candidates,
 * final text, line geometry or progress estimate. CSS owns persistent phase;
 * active/motion only pause it, and a new run remounts it deliberately.
 * Completion removes all bars immediately. The parent owns any separate
 * finish response and must not delay readable final text for this ornament. */
export function AmbientComposition({ active, motion, condition = 'reshape', complete, runId, tempo = 1 }: Props) {
  if (complete) return null
  const rate = Number.isFinite(tempo) ? Math.max(.7, Math.min(1.4, tempo)) : 1
  return (
    <div key={runId} className="ambient-composition" aria-hidden="true"
      data-ambient-composition data-material="solid-rounded-skeleton-v1" data-condition={condition} data-active={active} data-motion={motion ? 'on' : 'off'}
      style={{ ['--ambient-period' as string]: `${4800 / rate}ms` } as CSSProperties}>
      {BARS.map((bar, index) => (
        <span key={index} className="ambient-composition__bar" style={{
          ['--ambient-left' as string]: '0%',
          ['--ambient-width' as string]: bar.width,
          ['--ambient-top' as string]: bar.top,
        } as CSSProperties}>
          <span className="ambient-composition__ink" />
        </span>
      ))}
    </div>
  )
}

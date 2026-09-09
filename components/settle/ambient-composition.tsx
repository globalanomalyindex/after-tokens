'use client'

import type { CSSProperties } from 'react'

export type AmbientCondition = 'coherent' | 'static' | 'independent'

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
  { left: '4%', width: '77%', top: '.55em', period: 4400, drift: 7100 },
  { left: '10%', width: '86%', top: '1.92em', period: 6300, drift: 6700 },
  { left: '2%', width: '83%', top: '3.31em', period: 5100, drift: 7900 },
  { left: '15%', width: '71%', top: '4.69em', period: 6900, drift: 7300 },
  { left: '6%', width: '79%', top: '6.05em', period: 5600, drift: 8300 },
] as const

/** Nonlexical activity composition. It accepts no source tokens, candidates,
 * final text, line geometry or progress estimate. CSS owns persistent phase;
 * active/motion only pause it, and a new run remounts it deliberately.
 * Completion removes all bars immediately. The parent owns any separate
 * finish response and must not delay readable final text for this ornament. */
export function AmbientComposition({ active, motion, condition = 'coherent', complete, runId, tempo = 1 }: Props) {
  if (complete) return null
  const rate = Number.isFinite(tempo) ? Math.max(.7, Math.min(1.4, tempo)) : 1
  return (
    <div key={runId} className="ambient-composition" aria-hidden="true"
      data-ambient-composition data-condition={condition} data-active={active} data-motion={motion ? 'on' : 'off'}
      style={{ ['--ambient-period' as string]: `${5400 / rate}ms` } as CSSProperties}>
      {BARS.map((bar, index) => (
        <span key={index} className="ambient-composition__bar" style={{
          ['--ambient-left' as string]: bar.left,
          ['--ambient-width' as string]: bar.width,
          ['--ambient-top' as string]: bar.top,
          ['--ambient-independent-period' as string]: `${bar.period / rate}ms`,
          ['--ambient-drift-period' as string]: `${bar.drift / rate}ms`,
        } as CSSProperties}>
          <span className="ambient-composition__ink" />
        </span>
      ))}
    </div>
  )
}

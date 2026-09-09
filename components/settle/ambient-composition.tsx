'use client'

import type { CSSProperties } from 'react'
import { SkeletonDivision } from './skeleton-division'

export type AmbientCondition = 'static' | 'breathe' | 'reshape'

type Props = {
  active: boolean
  motion: boolean
  condition?: AmbientCondition
  complete: boolean
  runId: string | number
  tempo?: number
  rowCount?: number
  lineHeightPx?: number
  barHeightPx?: number
}

// Authored composition, not a prediction of answer lines, words or length.
// Every condition uses these exact shapes and starts at the same phase.
type Pill = readonly [x0: number, width0: number, x1: number, width1: number]
type Row = { width: number; phase: number; newborn?: number; pills: readonly Pill[] }
const ROWS: readonly Row[] = [
  { width: 88, phase: 0, pills: [[0, 100, 0, 100]] },
  { width: 92, phase: 0, newborn: 1, pills: [[0, 25, 0, 20], [27, 0, 22, 13], [27, 32, 37, 25], [61, 16, 64, 13], [79, 21, 79, 21]] },
  { width: 96, phase: 0, pills: [[0, 100, 0, 100]] },
  { width: 84, phase: .43, newborn: 2, pills: [[0, 33, 0, 24], [35, 24, 26, 22], [61, 0, 50, 15], [61, 39, 67, 33]] },
  { width: 70, phase: .82, newborn: 2, pills: [[0, 18, 0, 18], [20, 31, 20, 23], [53, 0, 45, 12], [53, 21, 59, 15], [76, 24, 76, 24]] },
]

/** Nonlexical activity composition. A capped row estimate and measured type
 * rhythm adapt its space; no cell maps to a token, word or confidence value.
 * Persistent CSS clocks survive row exposure, pause and resume. The parent
 * owns the separate exact-size handoff and whole-answer arrival. */
export function AmbientComposition({ active, motion, condition = 'reshape', complete, runId, tempo = 1, rowCount = 5, lineHeightPx, barHeightPx }: Props) {
  if (complete) return null
  const rate = Number.isFinite(tempo) ? Math.max(.7, Math.min(1.4, tempo)) : 1
  const period = 4800 / rate
  return (
    <div key={runId} className="ambient-composition" aria-hidden="true"
      data-ambient-composition data-material="adaptive-cell-skeleton-v5" data-condition={condition} data-active={active} data-motion={motion ? 'on' : 'off'}
      style={{ ['--ambient-period' as string]: `${period}ms`, ['--glimmer-period' as string]: `${8000 / rate}ms`,
        ['--ambient-line-height' as string]: lineHeightPx ? `${lineHeightPx}px` : '1.625em',
        ['--ambient-bar-height' as string]: barHeightPx ? `${barHeightPx}px` : '.9em',
      } as CSSProperties}>
      {condition === 'reshape' && <SkeletonDivision lineHeightPx={lineHeightPx} barHeightPx={barHeightPx} />}
      <div className="ambient-composition__field">
      {Array.from({ length: 14 }, (_, index) => {
        const row = ROWS[index % ROWS.length]!
        return (
        <span key={index} className="ambient-composition__bar" data-row={index} data-shown={index < rowCount} data-kind={row.pills.length === 1 ? 'line' : 'cluster'} style={{
          ['--ambient-left' as string]: '0%',
          ['--ambient-width' as string]: `${row.width}%`,
          ['--ambient-top' as string]: `calc(${index} * var(--ambient-line-height) + (var(--ambient-line-height) - var(--ambient-bar-height)) / 2)`,
          ['--cluster-delay' as string]: `${-period * row.phase}ms`,
        } as CSSProperties}>
          <span className="ambient-composition__row-content">
          {row.pills.map(([x0, width0, x1, width1], pill) => <span key={pill}
            className="ambient-composition__presence" data-pill={pill}
            data-new={pill === row.newborn || undefined}
            data-moving={x0 !== x1 || width0 !== width1 || undefined}
            style={{
              ['--pill-x0' as string]: `${x0}%`, ['--pill-w0' as string]: `${width0}%`,
              ['--pill-x1' as string]: `${x1}%`, ['--pill-w1' as string]: `${width1}%`,
              ['--pill-x-peak' as string]: `${x0 + 1.025 * (x1 - x0)}%`,
              ['--pill-w-peak' as string]: `${width0 + 1.025 * (width1 - width0)}%`,
            } as CSSProperties}>
            <span className="ambient-composition__ink" />
          </span>)}
          </span>
        </span>
      )})}
      </div>
    </div>
  )
}

'use client'

import { useMemo, type CSSProperties } from 'react'
import { fieldCells, fieldExtent } from '@/lib/settle/field'
import type { FieldCell, SettleState } from '@/lib/settle/types'
import type { MarkShape } from '@/lib/settle/voice'

// The field: the sampler's own field of positions, one cell each, drawn as
// a single line as wide as the request. It shows state and never text, so it
// is hidden from assistive technology; the margin's words carry its meaning.
//
// Motion here is where the settling is watched. A cell that commits drops
// into place. A run of cells that changes state together sweeps, each a few
// milliseconds after the last, so a burst reads as a burst. A run of end
// cells is drawn as one floor whose edges move smoothly as the run grows.
// None of it changes what the cells say; reduced motion removes all of it.

type Props = {
  state: SettleState
  mark?: MarkShape
  className?: string
}

export function Field({ state, mark = 'tick', className = '' }: Props) {
  const cells = useMemo(() => fieldCells(state), [state])
  const n = state.bound ?? fieldExtent(cells)
  // the stagger index: a cell's place inside its run of equal-state neighbors,
  // so a run that just changed together sweeps from its start
  const items = useMemo(() => {
    const out: { cell: FieldCell; k: number }[] = []
    let runStart = 0
    let previous: FieldCell['state'] | null = null
    cells.forEach((cell, i) => {
      if (cell.state !== previous) {
        runStart = i
        previous = cell.state
      }
      out.push({ cell, k: i - runStart })
    })
    return out
  }, [cells])
  if (!cells.length) return null
  return (
    <div
      className={`settle-field ${className}`}
      data-mark={mark}
      data-status={state.status}
      aria-hidden="true"
      style={{ ['--n' as string]: n } as CSSProperties}
    >
      {items.map(({ cell, k }) => (
        // keyed by state as well as position: a cell that changes state
        // remounts, which is what restarts its settle
        <span
          key={`${cell.position}:${cell.state}`}
          className="settle-cell"
          data-state={cell.state}
          style={{ ['--span' as string]: cell.span, ['--k' as string]: k } as CSSProperties}
        />
      ))}
      {cells.filter((cell) => cell.state === 'end').map((run) => (
        // keyed by the run's last position, which stays put while the run
        // grows toward the front, so its edges transition instead of jumping
        <span
          key={`floor:${run.position + run.span - 1}`}
          className="settle-floor"
          style={{ left: `${(run.position / n) * 100}%`, width: `${(run.span / n) * 100}%` }}
        />
      ))}
    </div>
  )
}

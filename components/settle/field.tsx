'use client'

import { useMemo, type CSSProperties } from 'react'
import { fieldCells, fieldExtent } from '@/lib/settle/field'
import type { SettleState } from '@/lib/settle/types'
import type { MarkShape } from '@/lib/settle/voice'

// The field: the sampler's own field of positions, one cell each, drawn as
// a single line as wide as the request. It shows state and never text, so it
// is hidden from assistive technology; the margin's words carry its meaning.

type Props = {
  state: SettleState
  mark?: MarkShape
  className?: string
}

export function Field({ state, mark = 'tick', className = '' }: Props) {
  const cells = useMemo(() => fieldCells(state), [state])
  if (!cells.length) return null
  const n = state.bound ?? fieldExtent(cells)
  return (
    <div
      className={`settle-field ${className}`}
      data-mark={mark}
      aria-hidden="true"
      style={{ ['--n' as string]: n } as CSSProperties}
    >
      {cells.map((cell) => (
        // keyed by state as well as position: a cell that changes state
        // remounts, which is what restarts its bloom
        <span
          key={`${cell.position}:${cell.state}`}
          className="settle-cell"
          data-state={cell.state}
          style={cell.span > 1 ? ({ ['--span' as string]: cell.span } as CSSProperties) : undefined}
        />
      ))}
    </div>
  )
}

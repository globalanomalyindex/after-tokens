'use client'

import { formingText, heldText } from '@/lib/settle/reader'
import type { SettleState } from '@/lib/settle/types'
import type { MarkShape } from '@/lib/settle/voice'

// The margin: the source's state in words, beside a mark that breathes while
// the source is active and rests at every terminal state. The words are the
// contract's; the mark's shape, breath and hue are the brand's.

/** What the source is doing, for the margin and for the live region. */
export function statusSegments(state: SettleState, paused = false, detail = true): string[] {
  if (paused) return ['paused']
  switch (state.status) {
    case 'waiting':
      return ['waiting for the source']
    case 'receiving': {
      if (!detail) return ['receiving']
      const settled = state.bound !== null ? `${state.receivedCount} of ${state.bound} settled` : `${state.receivedCount} settled`
      const holding = heldText(state) || formingText(state) ? (formingText(state) ? 'forming' : 'holding') : null
      return holding ? ['receiving', settled, holding] : ['receiving', settled]
    }
    case 'complete':
      return state.previousPassages ? ['complete', 'revision applied'] : ['complete']
    case 'stopped':
      return heldText(state) || formingText(state) ? ['source stopped', 'unfinished text held'] : ['source stopped']
    case 'error':
      return ['source error']
    case 'revision':
      return ['revision available']
  }
}

/** The segments joined, for the live region and for tests. */
export function statusWords(state: SettleState, paused = false, detail = true): string {
  return statusSegments(state, paused, detail).join(' · ')
}

type Props = {
  state: SettleState
  mark?: MarkShape
  paused?: boolean
  className?: string
}

export function Margin({ state, mark = 'tick', paused = false, className = '' }: Props) {
  return (
    <div className={`settle-margin readout ${className}`}>
      <span className="settle-mark" data-shape={mark} aria-hidden="true" />
      <span className="settle-status">
        {statusSegments(state, paused).map((segment, i) => <span key={i}>{i > 0 ? `· ${segment}` : segment}</span>)}
      </span>
    </div>
  )
}

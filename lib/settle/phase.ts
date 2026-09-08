import type { SettleState } from './types'
import { lowestEnd } from './carve'

// The phase of an answer, read off the field: how much of it is committed and
// how much of the rest the source already holds a confident guess for. It is
// a description of the state, for the margin, and never a promise about what
// comes next. The words are the ones a writer would use for their own draft.

export type Phase = 'sketching' | 'drafting' | 'polishing' | 'closing'

export type Resolution = {
  /** the positions the answer can still occupy: up to the lowest committed end, else the bound */
  positions: number
  committed: number
  drafted: number
  /** committed share plus half the drafted share, 0 to 1 */
  resolve: number
  phase: Phase
}

export function resolution(state: SettleState): Resolution {
  const cut = lowestEnd(state)
  const keys = Object.keys(state.tokens).map(Number)
  const positions = Math.max(1, cut ?? state.bound ?? (keys.length ? Math.max(...keys) + 1 : 1))
  let committed = 0
  for (const position of keys) if (position < positions && !state.tokens[position]?.end) committed += 1
  let drafted = 0
  for (const key of Object.keys(state.drafts)) {
    const position = Number(key)
    if (position < positions && state.drafts[position]?.shown && !state.tokens[position]) drafted += 1
  }
  const resolve = Math.min(1, committed / positions + 0.5 * (drafted / positions))
  const phase: Phase = resolve < 0.15 ? 'sketching' : resolve < 0.5 ? 'drafting' : resolve < 0.85 ? 'polishing' : 'closing'
  return { positions, committed, drafted, resolve, phase }
}

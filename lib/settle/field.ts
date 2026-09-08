import type { FieldCell, SettleState } from './types'

// The field is the sampler's own field of positions, one cell each. It shows
// state and never text: where the source has committed, where the holes are
// that keep the page waiting, and, as end tokens settle, how long the answer
// is going to be. Nothing in it is authored.

/** How far past the last committed position the field reaches when no bound is known. */
export const FIELD_HORIZON = 16

export function fieldCells(state: SettleState): FieldCell[] {
  if (state.source === 'snapshot') return []
  const committed = Object.keys(state.tokens).map(Number)
  const maxCommitted = committed.length ? Math.max(...committed) : -1
  // the extent is the request's bound, or a horizon past the last commit.
  // once the prefix has reached an end token, positions past it that never
  // committed are beyond the answer; committed end tokens past it stay end
  const extent = state.bound ?? Math.max(1, maxCommitted + 1 + FIELD_HORIZON)

  // character offsets of the prefix tokens, so a position can be classed by
  // whether its text is on the page, forming, or held
  const ends: number[] = []
  let length = 0
  for (const token of state.prefixTokens) {
    length += token.text.length
    ends.push(length)
  }

  const cells: FieldCell[] = []
  for (let position = 0; position < extent; position += 1) {
    let cellState: FieldCell['state']
    if (position < state.prefixTokens.length) {
      const end = ends[position]!
      cellState = end <= state.releasedLength ? 'released' : end <= state.wordSafeLength ? 'forming' : 'held'
    } else {
      const token = state.tokens[position]
      const past = state.endAt !== null && position > state.endAt
      cellState = token ? (token.end ? 'end' : past ? 'beyond' : 'committed') : past ? 'beyond' : 'open'
    }
    const last = cells[cells.length - 1]
    const collapses = cellState === 'end' || cellState === 'beyond'
    if (collapses && last && last.state === cellState && last.position + last.span === position) last.span += 1
    else cells.push({ position, state: cellState, span: 1 })
  }
  return cells
}

/** How many positions the field spans, counting a collapsed end run once. */
export function fieldExtent(cells: readonly FieldCell[]): number {
  return cells.reduce((n, cell) => n + cell.span, 0)
}

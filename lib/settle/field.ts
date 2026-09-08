import type { FieldCell, SettleState } from './types'

// The field is the sampler's own field of positions, one cell each. It shows
// state and never text: where the source has committed, where the holes are
// that keep the page waiting, and, as end tokens settle, how long the answer
// is going to be. Nothing in it is authored.

/** How far past the last committed position the field reaches when no bound is known. */
export const FIELD_HORIZON = 16

export function fieldCells(state: SettleState): FieldCell[] {
  if (state.source === 'snapshot') return []
  // a completed answer with no committed positions is a revised page: no field beneath it
  if (state.status === 'complete' && Object.keys(state.tokens).length === 0) return []
  const committed = Object.keys(state.tokens).map(Number)
  const maxCommitted = committed.length ? Math.max(...committed) : -1
  // the extent is the request's bound, or a horizon past the last commit.
  // a committed end token at any position bounds the answer to before it,
  // so everything past the lowest committed end is beyond the answer
  const extent = state.bound ?? Math.max(1, maxCommitted + 1 + FIELD_HORIZON)
  let cut: number | null = null
  for (const position of committed) if (state.tokens[position]?.end && (cut === null || position < cut)) cut = position

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
      const past = cut !== null && position > cut
      cellState = past ? 'beyond' : token ? (token.end ? 'end' : 'committed') : 'open'
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

import { FIELD_HORIZON } from './field'
import type { Commit, SettleState } from './types'

// The carved zone: every position after the word-safe prefix, in order, as
// what the sampler has made of it. An open position is a slot of noise. A
// committed token whose word is not yet complete is a held slot. A complete
// word is drawn where it will stand, in the sampler's own order, dim. A run
// of end tokens collapses to one end mark. A committed end token at any
// position bounds the answer to before it, so the zone is cut at the lowest
// committed end and shortens from the tail as the model decides the answer's
// length. Nothing here is a guess:
// no letters are drawn that the source has not committed, and a word is
// drawn only when every token of it and its boundaries are in.

export type CarveItem =
  | { kind: 'word'; position: number; span: number; text: string }
  | { kind: 'slot'; position: number; state: 'open' | 'held' }
  | { kind: 'end'; position: number; span: number }

const startsWithSpace = (t: Commit | undefined) => Boolean(t && /^\s/.test(t.text))
const endsWithSpace = (t: Commit | undefined) => Boolean(t && /\s$/.test(t.text))

/** How many prefix tokens are inside the word-safe length. */
export function wordSafeTokens(state: SettleState): number {
  let count = 0
  let length = 0
  for (const token of state.prefixTokens) {
    if (length + token.text.length > state.wordSafeLength) break
    length += token.text.length
    count += 1
  }
  return count
}

/** The lowest committed end position: an upper bound on the answer's length. */
export function lowestEnd(state: SettleState): number | null {
  let lowest: number | null = null
  for (const key of Object.keys(state.tokens)) {
    const position = Number(key)
    if (state.tokens[position]?.end && (lowest === null || position < lowest)) lowest = position
  }
  return lowest
}

export function carve(state: SettleState): CarveItem[] {
  if (state.source === 'snapshot') return []
  const tokens = state.tokens
  const committed = Object.keys(tokens).map(Number)
  const maxCommitted = committed.length ? Math.max(...committed) : -1
  const extent = state.bound ?? Math.max(1, maxCommitted + 1 + FIELD_HORIZON)
  const cut = lowestEnd(state)
  const items: CarveItem[] = []
  let p = wordSafeTokens(state)
  while (p < extent) {
    if (cut !== null && p >= cut) {
      // the answer ends at or before the lowest committed end: one mark,
      // spanning the run of end tokens that starts there, and nothing after
      let span = 1
      while (tokens[cut + span]?.end) span += 1
      if (p === cut) items.push({ kind: 'end', position: cut, span })
      break
    }
    const token = tokens[p]
    if (!token) {
      items.push({ kind: 'slot', position: p, state: 'open' })
      p += 1
      continue
    }
    // a run of committed content tokens [p, q), stopping at the cut
    let q = p
    while (tokens[q] && !tokens[q]!.end && (cut === null || q < cut)) q += 1
    // a word at the run's start is cleanly begun only when nothing before it
    // can be a piece of it: it starts with whitespace, the previous token
    // is committed and ends with whitespace, or it is the first position
    const previous = tokens[p - 1]
    let clean = p === 0 || startsWithSpace(token) || (Boolean(previous) && !previous!.end && endsWithSpace(previous))
    let wordStart = p
    for (let i = p; i < q; i += 1) {
      const next = tokens[i + 1]
      const boundary = endsWithSpace(tokens[i]) || (Boolean(next) && (next!.end || startsWithSpace(next)))
      if (!boundary) continue
      if (clean) {
        let text = ''
        for (let j = wordStart; j <= i; j += 1) text += tokens[j]!.text
        items.push({ kind: 'word', position: wordStart, span: i - wordStart + 1, text })
      } else {
        for (let j = wordStart; j <= i; j += 1) items.push({ kind: 'slot', position: j, state: 'held' })
      }
      wordStart = i + 1
      clean = true
    }
    // whatever is left of the run has no boundary after it: held
    for (let j = wordStart; j < q; j += 1) items.push({ kind: 'slot', position: j, state: 'held' })
    p = q
  }
  return items
}

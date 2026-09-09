import { FIELD_HORIZON } from './field'
import { guessKey } from './reader'
import type { Commit, SettleState } from './types'

// The carved zone: every position after the page, in order, as what the
// sampler has made of it. An open position is reserved blank space. An open
// position the model holds a confident guess for shows that guess as a draft:
// the model's own current prediction, visibly provisional, never a fact. A
// committed token whose word is not yet complete is drawn as the piece it is.
// A complete word is drawn where it will stand, in the sampler's own order.
// A run of end tokens collapses to one end mark. A committed end token at any
// position bounds the answer to before it, so the zone is cut at the lowest
// committed end and shortens from the tail as the model decides the answer's
// length. The honesty line: nothing committed is ever drawn as a guess, and
// nothing guessed is ever drawn as committed. A draft is the source's guess at
// that instant, and it is drawn as one.

export type CarveItem =
  /** a complete committed word; forming when it is in the word-safe prefix, waiting for its passage */
  | { kind: 'word'; position: number; span: number; text: string; forming: boolean }
  /** a committed piece of a word that is not complete yet */
  | { kind: 'piece'; position: number; text: string }
  /** the source's current guess at an open position, above the floor; end when it guesses the answer ends here */
  | { kind: 'draft'; position: number; text: string; p: number; end: boolean }
  /** the reel below the floor: the source's argmax at an open position at any probability, drawn as a smear blurred past reading */
  | { kind: 'spin'; position: number; text: string; p: number }
  /** an open position with no guess worth drawing, or a position past the answer's end */
  | { kind: 'slot'; position: number; state: 'open' | 'beyond' }
  /** the lowest committed end and the run of end tokens that starts there */
  | { kind: 'end'; position: number; span: number }

const startsWithSpace = (t: Commit | undefined) => Boolean(t && /^\s/.test(t.text))
const endsWithSpace = (t: Commit | undefined) => Boolean(t && /\s$/.test(t.text))

/** Recorded tokenizer end spellings, as a draft may guess them. */
const END_SPELLINGS = new Set(['<|endoftext|>', '<|im_end|>'])
const SPECIAL = /<\|[^|]*\|>/

/** How many prefix tokens are inside a character length of the prefix. */
function tokensWithin(state: SettleState, chars: number): number {
  let count = 0
  let length = 0
  for (const token of state.prefixTokens) {
    if (length + token.text.length > chars) break
    length += token.text.length
    count += 1
  }
  return count
}
/** How many prefix tokens are inside the word-safe length. */
export function wordSafeTokens(state: SettleState): number {
  return tokensWithin(state, state.wordSafeLength)
}
/** How many prefix tokens are on the page. */
export function releasedTokens(state: SettleState): number {
  return tokensWithin(state, state.releasedLength)
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

/** Whether an item draws letters a following piece could attach to. */
const hasLetters = (item: CarveItem | undefined) => Boolean(item && (item.kind === 'word' || item.kind === 'piece' || item.kind === 'spin' || (item.kind === 'draft' && !item.end)))

/**
 * The draft to draw at an open position, if any. A guess shows only above the
 * floor (the reducer's `shown`), only when it is a piece a reader could
 * place: a guess that continues a word (no leading whitespace, has letters)
 * is drawn only when the position before it draws letters it can attach to,
 * so a stray word tail never floats in blank space. A guess of the end
 * spelling is drawn as an end belief. A guess of a line break is drawn as
 * a break (the message's shape arrives before its words); other whitespace
 * alone and other special tokens draw nothing.
 */
function draftAt(state: SettleState, position: number, previous: CarveItem | undefined, prior: Set<string>): CarveItem | null {
  const draft = state.drafts[position]
  if (!draft?.shown) return spinAt(state, position, previous, prior)
  if (END_SPELLINGS.has(draft.text)) return { kind: 'draft', position, text: '', p: draft.p, end: true }
  if (SPECIAL.test(draft.text)) return null
  // a guessed line break is the shape of the message before its words: drawn as a break, never as letters
  if (!draft.text.trim()) return draft.text.includes('\n') ? { kind: 'draft', position, text: '\n', p: draft.p, end: false } : null
  const continues = !/^\s/.test(draft.text) && /[\p{L}\p{N}]/u.test(draft.text)
  if (continues && !hasLetters(previous)) return null
  return { kind: 'draft', position, text: draft.text, p: draft.p, end: false }
}

/**
 * The reel below the floor at an open position with no draft to show: the
 * source's argmax at any probability, drawn as a smear blurred past reading
 * so the reel spins wherever the model is guessing something about the
 * position. Only a piece with letters or digits is drawn (the end spelling,
 * a special token, a break, whitespace and bare punctuation draw nothing:
 * the shape of the message is carved from confident guesses only, and a
 * smear of punctuation would read as one), the prior (the reducer's, kept
 * with hysteresis) is drawn as blank, and a piece that continues a word
 * waits for letters to attach to, as a draft does.
 */
function spinAt(state: SettleState, position: number, previous: CarveItem | undefined, prior: Set<string>): CarveItem | null {
  const spin = state.spins[position]
  if (!spin || END_SPELLINGS.has(spin.text) || SPECIAL.test(spin.text) || !/[\p{L}\p{N}]/u.test(spin.text)) return null
  if (prior.has(guessKey(spin.text))) return null
  const continues = !/^\s/.test(spin.text)
  if (continues && !hasLetters(previous)) return null
  return { kind: 'spin', position, text: spin.text, p: spin.p }
}

export function carve(state: SettleState): CarveItem[] {
  if (state.source === 'snapshot') return []
  const tokens = state.tokens
  const committed = Object.keys(tokens).map(Number)
  // a completed answer with no committed positions is a revised page: nothing stands after it
  if (state.status === 'complete' && committed.length === 0) return []
  const maxCommitted = committed.length ? Math.max(...committed) : -1
  const extent = state.bound ?? Math.max(1, maxCommitted + 1 + FIELD_HORIZON)
  const cut = lowestEnd(state)
  const safe = wordSafeTokens(state)
  const prior = new Set(state.prior)
  const items: CarveItem[] = []
  // the zone begins where the page ends: in-order words waiting for their
  // passage are its first items, marked forming. A passage boundary can
  // fall inside a token (the whitespace after a sentence is usually the
  // first character of the next token), so the first token draws only the
  // part of it the page has not taken
  const first = releasedTokens(state)
  let consumed = 0
  for (let i = 0; i < first; i += 1) consumed += state.prefixTokens[i]!.text.length
  const offset = Math.max(0, state.releasedLength - consumed)
  const textOf = (j: number) => (j === first ? tokens[j]!.text.slice(offset) : tokens[j]!.text)
  let p = first
  while (p < extent) {
    if (cut !== null && p >= cut) {
      // the answer ends at or before the lowest committed end: one mark,
      // spanning the run of end tokens that starts there. What lies past it
      // is beyond the answer; it is kept as collapsed positions so a
      // surface can close them smoothly rather than dropping them at once
      let span = 1
      while (tokens[cut + span]?.end) span += 1
      if (p === cut) items.push({ kind: 'end', position: cut, span })
      for (let b = Math.max(p, cut + 1); b < extent; b += 1) items.push({ kind: 'slot', position: b, state: 'beyond' })
      break
    }
    const token = tokens[p]
    if (!token) {
      items.push(draftAt(state, p, items[items.length - 1], prior) ?? { kind: 'slot', position: p, state: 'open' })
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
        for (let j = wordStart; j <= i; j += 1) text += textOf(j)
        items.push({ kind: 'word', position: wordStart, span: i - wordStart + 1, text, forming: i < safe })
      } else {
        for (let j = wordStart; j <= i; j += 1) items.push({ kind: 'piece', position: j, text: textOf(j) })
      }
      wordStart = i + 1
      clean = true
    }
    // whatever is left of the run has no boundary after it: pieces
    for (let j = wordStart; j < q; j += 1) items.push({ kind: 'piece', position: j, text: textOf(j) })
    p = q
  }
  return items
}

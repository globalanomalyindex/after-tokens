import { PROVISIONAL_FLOOR } from '@/lib/diffusion/traces'
import { passageBoundary, wordSafeLength } from './boundary'
import type { Commit, DraftState, Policy, SettleEvent, SettleState, SpinState } from './types'

/** A draft is shown once its probability clears this floor; below it the
 *  source's guess is the corpus prior and would say the same word everywhere.
 *  One number for the whole piece (lib/diffusion/traces.ts). */
export const DRAFT_FLOOR = PROVISIONAL_FLOOR

// The reducer is pure. Given the same events it yields the same page, the same
// forming text, the same field, and the same status, whatever comes later. It
// is Margin's reducer (Codex, 7 September 2026) with a token-level prefix, a
// word-completeness rule, a word policy, and the request bound.

export function createSettleState(policy: Policy = 'sentence', bound: number | null = null): SettleState {
  return {
    policy, status: 'waiting', passages: [], prefixTokens: [], prefix: '', wordSafeLength: 0, releasedLength: 0,
    tokens: {}, drafts: {}, spins: {}, nextPosition: 0, receivedCount: 0, bound: Number.isSafeInteger(bound) && bound! > 0 ? bound : null,
    endAt: null, lastEventAtMs: 0, revisionText: null, error: null, source: null, version: 0, previousPassages: null,
  }
}

/** Committed, contiguous, word-complete text that has not yet completed a passage. */
export function formingText(state: SettleState): string {
  return state.prefix.slice(state.releasedLength, state.wordSafeLength)
}

/** Committed, contiguous text still waiting for a word boundary. Never drawn. */
export function heldText(state: SettleState): string {
  return state.prefix.slice(state.wordSafeLength)
}

/** The page's text, as one string. */
export function pageText(state: SettleState): string {
  return state.prefix.slice(0, state.releasedLength)
}

function release(state: SettleState, final: boolean): SettleState {
  const additions = []
  let released = state.releasedLength
  const safe = final ? state.prefix.length : state.wordSafeLength
  while (released < safe) {
    const pending = state.prefix.slice(released, safe)
    const end = passageBoundary(pending, state.policy) || (final ? pending.length : 0)
    if (!end) break
    additions.push({
      id: `v${state.version}-p${state.passages.length + additions.length}`,
      text: pending.slice(0, end),
      availableAtMs: state.lastEventAtMs,
    })
    released += end
  }
  if (!additions.length) return state
  return { ...state, releasedLength: released, passages: [...state.passages, ...additions] }
}

function failed(state: SettleState, message: string, atMs = state.lastEventAtMs): SettleState {
  return { ...state, status: 'error', error: message, lastEventAtMs: atMs }
}

export function reduceSettle(state: SettleState, event: SettleEvent): SettleState {
  // The first terminal event wins. A replacement takes the explicit revision
  // path; a late transport callback cannot rewrite a finished page.
  const canRevise = state.status === 'complete' || state.status === 'revision'
  const revisionAction = canRevise && (event.type === 'revision' || event.type === 'apply-revision')
  if ((canRevise || state.status === 'stopped' || state.status === 'error') && !revisionAction) return state
  if (!Number.isFinite(event.atMs) || event.atMs < 0 || event.atMs < state.lastEventAtMs) return failed(state, 'Invalid or decreasing event timestamp.')
  const next = { ...state, lastEventAtMs: event.atMs }

  if (event.type === 'revision') {
    if (!canRevise) return failed(next, 'A revision requires an explicitly completed source.')
    return { ...next, status: 'revision', revisionText: event.text }
  }
  if (event.type === 'apply-revision') {
    if (state.status !== 'revision' || state.revisionText === null) return state
    const text = state.revisionText
    // the revised page replaces the answer whole: nothing of the earlier
    // field remains to draw beneath it
    return release({
      ...next, status: 'complete', prefix: text, prefixTokens: [], wordSafeLength: text.length, releasedLength: 0,
      tokens: {}, drafts: {}, spins: {}, endAt: null,
      passages: [], previousPassages: state.passages, version: state.version + 1, revisionText: null,
    }, true)
  }
  if (event.type === 'stop') return { ...next, status: 'stopped' }
  if (event.type === 'error') return failed(next, event.message)
  if (event.type === 'snapshot') {
    if (state.source === 'commit') return failed(next, 'Cannot change a commitment stream into a snapshot stream.')
    if (!event.final) return { ...next, source: 'snapshot', status: 'receiving' }
    return release({ ...next, source: 'snapshot', status: 'complete', prefix: event.text, prefixTokens: [], wordSafeLength: event.text.length, releasedLength: 0 }, true)
  }
  if (state.source === 'snapshot') return failed(next, 'A snapshot stream requires an explicitly final snapshot.')
  if (event.type === 'draft') {
    // a guess changes nothing the reader can count on: no prefix, no page,
    // no status beyond the source being active. A guess at a committed
    // position is ignored; an empty guess withdraws one. A guess shows once
    // its probability clears the floor and keeps showing while its text
    // holds, so a guess hovering at the floor does not blink.
    const drafts: Record<number, DraftState> = { ...state.drafts }
    for (const guess of event.guesses) {
      if (!Number.isSafeInteger(guess.position) || guess.position < 0 || state.tokens[guess.position]) continue
      if (guess.text === '' || !(guess.p > 0)) { delete drafts[guess.position]; continue }
      const previous = drafts[guess.position]
      const shown = guess.p >= DRAFT_FLOOR || Boolean(previous?.shown && previous.text === guess.text)
      drafts[guess.position] = { text: guess.text, p: guess.p, shown }
    }
    return { ...next, drafts, source: 'commit', status: state.status === 'waiting' ? 'receiving' : state.status }
  }
  if (event.type === 'spin') {
    // the reel below the floor: the source's argmax at an open position at
    // any probability. It changes nothing the reader can count on, is never
    // legible, and is ignored at a committed position; an empty text
    // withdraws it.
    const spins: Record<number, SpinState> = { ...state.spins }
    for (const guess of event.guesses) {
      if (!Number.isSafeInteger(guess.position) || guess.position < 0 || state.tokens[guess.position]) continue
      if (guess.text === '') { delete spins[guess.position]; continue }
      spins[guess.position] = { text: guess.text, p: Number.isFinite(guess.p) ? Math.max(0, guess.p) : 0 }
    }
    return { ...next, spins, source: 'commit', status: state.status === 'waiting' ? 'receiving' : state.status }
  }
  if (event.type === 'finish') {
    if (!Number.isSafeInteger(event.tokenCount) || event.tokenCount < 0) return failed(next, 'Invalid final token count.')
    if (state.nextPosition !== event.tokenCount || state.receivedCount !== event.tokenCount) return failed(next, 'Incomplete or contradictory final token prefix.')
    return release({ ...next, source: 'commit', status: 'complete', bound: event.tokenCount, wordSafeLength: state.prefix.length }, true)
  }

  const tokens = { ...state.tokens }
  const drafts = { ...state.drafts }
  const spins = { ...state.spins }
  // The whole batch is validated before any of it extends the prefix: a
  // conflict must never expose the other tokens of its batch.
  for (const token of event.tokens) {
    if (!Number.isSafeInteger(token.position) || token.position < 0) return failed(next, 'Invalid token position.')
    if (state.bound !== null && token.position >= state.bound) return failed(next, `Commitment at position ${token.position} outside the bound of ${state.bound}.`)
    const existing = tokens[token.position]
    if (existing && (existing.text !== token.text || Boolean(existing.end) !== Boolean(token.end))) return failed(next, `Conflicting commitment at position ${token.position}.`)
    tokens[token.position] = { ...token }
    // a commitment ends the guess at its position, and the reel with it
    delete drafts[token.position]
    delete spins[token.position]
  }
  const prefixTokens: Commit[] = [...state.prefixTokens]
  let { prefix, nextPosition } = state
  let endAt: number | null = state.endAt
  let complete = false
  while (tokens[nextPosition]) {
    const token = tokens[nextPosition]!
    if (token.end) {
      complete = true
      endAt = nextPosition
      break
    }
    prefixTokens.push(token)
    prefix += token.text
    nextPosition += 1
  }
  return release({
    ...next, status: complete ? 'complete' : 'receiving', source: 'commit', tokens, drafts: complete ? {} : drafts, spins: complete ? {} : spins, prefix, prefixTokens, nextPosition, endAt,
    wordSafeLength: wordSafeLength(prefixTokens, complete), receivedCount: Object.keys(tokens).length,
  }, complete)
}

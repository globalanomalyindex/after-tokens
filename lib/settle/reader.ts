import { passageBoundary, wordSafeLength } from './boundary'
import type { Commit, Policy, SettleEvent, SettleState } from './types'

// The reducer is pure. Given the same events it yields the same page, the same
// forming text, the same field, and the same status, whatever comes later. It
// is Margin's reducer (Codex, 7 September 2026) with a token-level prefix, a
// word-completeness rule, a word policy, and the request bound.

export function createSettleState(policy: Policy = 'sentence', bound: number | null = null): SettleState {
  return {
    policy, status: 'waiting', passages: [], prefixTokens: [], prefix: '', wordSafeLength: 0, releasedLength: 0,
    tokens: {}, nextPosition: 0, receivedCount: 0, bound: Number.isSafeInteger(bound) && bound! > 0 ? bound : null,
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
    return release({
      ...next, status: 'complete', prefix: text, prefixTokens: [], wordSafeLength: text.length, releasedLength: 0,
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
  if (event.type === 'finish') {
    if (!Number.isSafeInteger(event.tokenCount) || event.tokenCount < 0) return failed(next, 'Invalid final token count.')
    if (state.nextPosition !== event.tokenCount || state.receivedCount !== event.tokenCount) return failed(next, 'Incomplete or contradictory final token prefix.')
    return release({ ...next, source: 'commit', status: 'complete', bound: event.tokenCount, wordSafeLength: state.prefix.length }, true)
  }

  const tokens = { ...state.tokens }
  // The whole batch is validated before any of it extends the prefix: a
  // conflict must never expose the other tokens of its batch.
  for (const token of event.tokens) {
    if (!Number.isSafeInteger(token.position) || token.position < 0) return failed(next, 'Invalid token position.')
    if (state.bound !== null && token.position >= state.bound) return failed(next, `Commitment at position ${token.position} outside the bound of ${state.bound}.`)
    const existing = tokens[token.position]
    if (existing && (existing.text !== token.text || Boolean(existing.end) !== Boolean(token.end))) return failed(next, `Conflicting commitment at position ${token.position}.`)
    tokens[token.position] = { ...token }
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
    ...next, status: complete ? 'complete' : 'receiving', source: 'commit', tokens, prefix, prefixTokens, nextPosition, endAt,
    wordSafeLength: wordSafeLength(prefixTokens, complete), receivedCount: Object.keys(tokens).length,
  }, complete)
}

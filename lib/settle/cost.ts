import { createSettleState, formingText, reduceSettle } from './reader'
import type { Policy, Replay, SettleState } from './types'

// The cost instrument. It measures what a policy makes a reader wait for on a
// recording, on the recording's own clock. Every figure here is a property of
// the reducer on this corpus; none is a reader outcome.

export type PolicyCost = {
  /** when the first passage landed on the page, or null when none did */
  firstPassageAt: number | null
  /** when the source completed, stopped or errored */
  completionAt: number | null
  /** mean, over characters, of release time minus the time the character joined the contiguous prefix */
  meanExtraHold: number | null
  /** mean, over characters, of word-safe time minus join time: the cost of the word rule alone */
  meanWordSafeLag: number | null
  /** the largest amount of prefix text off the page at once, in UTF-16 code units */
  maxQueued: number
  /** how many passages the page received */
  passages: number
  /** median passage length in code units */
  medianPassageChars: number | null
  /** the share of the run during which forming text was visible */
  formingShare: number | null
  /** the final page text equals the source's exact output */
  exactFinal: boolean
  /** characters drawn before their token committed; must be zero */
  precommitExposure: number
  /** the total code units of the final output, whitespace included */
  characters: number
}

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

/**
 * Replays a recording through the reducer under a policy and accounts for
 * every character: when it joined the prefix, when it became word-safe, when
 * it reached the page. `finalText` is the source's exact output, used only as
 * a retrospective equality oracle; the reducer never sees it.
 */
export function measureReplay(replay: Replay, policy: Policy, finalText: string): PolicyCost {
  let state: SettleState = createSettleState(policy, replay.bound ?? null)
  const joinedAt: number[] = []
  const safeAt: number[] = []
  const releasedAt: number[] = []
  let maxQueued = 0
  let precommitExposure = 0
  let formingMs = 0
  let lastAt = 0
  let lastForming = false
  const events = [...replay.events].sort((a, b) => a.atMs - b.atMs)
  for (const event of events) {
    if (lastForming) formingMs += event.atMs - lastAt
    const before = state
    state = reduceSettle(state, event)
    // account for the prefix growing, then for release and word safety
    for (let i = before.prefix.length; i < state.prefix.length; i += 1) joinedAt[i] = event.atMs
    for (let i = before.wordSafeLength; i < state.wordSafeLength; i += 1) safeAt[i] = event.atMs
    for (let i = before.releasedLength; i < state.releasedLength; i += 1) {
      releasedAt[i] = event.atMs
      // released text must come from committed prefix; a character on the
      // page whose token had not joined the prefix is an exposure
      if (joinedAt[i] === undefined || joinedAt[i]! > event.atMs) precommitExposure += 1
    }
    maxQueued = Math.max(maxQueued, state.prefix.length - state.releasedLength)
    if (state.prefix.slice(0, state.releasedLength) !== finalText.slice(0, state.releasedLength)) precommitExposure += 1
    lastAt = event.atMs
    lastForming = formingText(state).length > 0
  }
  const n = state.prefix.length
  const holds: number[] = []
  const lags: number[] = []
  for (let i = 0; i < n; i += 1) {
    if (joinedAt[i] !== undefined && releasedAt[i] !== undefined) holds.push(releasedAt[i]! - joinedAt[i]!)
    if (joinedAt[i] !== undefined && safeAt[i] !== undefined) lags.push(safeAt[i]! - joinedAt[i]!)
  }
  const terminal = state.status === 'complete' || state.status === 'stopped' || state.status === 'error'
  return {
    firstPassageAt: state.passages[0]?.availableAtMs ?? null,
    completionAt: terminal ? state.lastEventAtMs : null,
    meanExtraHold: holds.length ? holds.reduce((a, b) => a + b, 0) / holds.length : null,
    meanWordSafeLag: lags.length ? lags.reduce((a, b) => a + b, 0) / lags.length : null,
    maxQueued,
    passages: state.passages.length,
    medianPassageChars: median(state.passages.map((p) => p.text.length)),
    formingShare: replay.durationMs > 0 ? formingMs / replay.durationMs : null,
    exactFinal: state.prefix === finalText && state.passages.map((p) => p.text).join('') === finalText,
    precommitExposure,
    characters: finalText.length,
  }
}

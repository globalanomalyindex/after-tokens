import type { SettleState } from './types'

export const MIN_ANSWER_ROWS = 5
export const MAX_ANSWER_ROWS = 14

export type AnswerEnvelopeEstimate = {
  rowCount: number
  knownAdvancePx: number
  knownNewlines: number
  committedFragments: number
}

export type CandidateEnvelopeEstimate = {
  rowCount: number
  candidateAdvancePx: number
  candidateNewlines: number
}

function boundedRows(advancePx: number, newlines: number, availableWidthPx: number): number {
  const estimate = Number.isFinite(availableWidthPx) && availableWidthPx > 0
    ? Math.ceil(1.1 * advancePx / availableWidthPx + .5 * newlines) + 1
    : MIN_ANSWER_ROWS
  return Math.max(MIN_ANSWER_ROWS, Math.min(MAX_ANSWER_ROWS, estimate))
}

/** Coarse space for a received, revisable whole candidate. It carries no
 * commitment, token positions, final formatting or convergence inference. */
export function estimateCandidateEnvelope(
  candidate: string,
  availableWidthPx: number,
  measureAdvance: (text: string) => number,
): CandidateEnvelopeEstimate {
  const pieces = candidate.split(/\r\n|\r|\n/)
  const candidateNewlines = pieces.length - 1
  let candidateAdvancePx = 0
  for (const piece of pieces) {
    if (!piece) continue
    const advance = measureAdvance(piece)
    if (Number.isFinite(advance) && advance > 0) candidateAdvancePx += advance
  }
  return { rowCount: boundedRows(candidateAdvancePx, candidateNewlines, availableWidthPx), candidateAdvancePx, candidateNewlines }
}

/** A deliberately approximate ink budget, not a prediction of final lines.
 * Only commitments already in the state may contribute. A committed EOS
 * excludes itself and later positions even before the prefix reaches it. */
export function estimateAnswerEnvelope(
  state: Pick<SettleState, 'tokens'>,
  availableWidthPx: number,
  measureAdvance: (text: string) => number,
): AnswerEnvelopeEstimate {
  const tokens = Object.values(state.tokens)
  const end = tokens.reduce((first, token) => token.end ? Math.min(first, token.position) : first, Infinity)
  let knownAdvancePx = 0
  let knownNewlines = 0
  let committedFragments = 0
  for (const token of tokens) {
    if (token.end || token.position >= end) continue
    committedFragments += 1
    const pieces = token.text.split(/\r\n|\r|\n/)
    knownNewlines += pieces.length - 1
    for (const piece of pieces) {
      if (!piece) continue
      const advance = measureAdvance(piece)
      if (Number.isFinite(advance) && advance > 0) knownAdvancePx += advance
    }
  }
  return {
    rowCount: boundedRows(knownAdvancePx, knownNewlines, availableWidthPx),
    knownAdvancePx, knownNewlines, committedFragments,
  }
}

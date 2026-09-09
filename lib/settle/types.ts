// Settle: the causal reading surface. The renderer receives events, never an
// answer, and draws only what the source has committed. The contract is in
// docs/superpowers/specs/2026-09-07-settle-design.md, section 4.1.

/** What lands on the page: a word, sentence, paragraph, or the complete answer at source finality. */
export type Policy = 'word' | 'sentence' | 'paragraph' | 'answer'

/** One irreversible commitment: a token at a position. `end` marks an end-of-sequence token. */
export type Commit = { position: number; text: string; end?: boolean }

/** The source's current guess for a position it has not committed: its
 *  provisional argmax and that guess's probability. An empty text withdraws
 *  the guess. A draft is never a commitment and never reaches the page. */
export type Draft = { position: number; text: string; p: number }

export type SettleEvent =
  | { type: 'commit'; atMs: number; tokens: Commit[] }
  | { type: 'draft'; atMs: number; guesses: Draft[] }
  /** the source's provisional argmax at open positions at any probability: the reel below the floor, never legible, never a commitment */
  | { type: 'spin'; atMs: number; guesses: Draft[] }
  | { type: 'finish'; atMs: number; tokenCount: number }
  | { type: 'snapshot'; atMs: number; text: string; final: boolean }
  | { type: 'revision'; atMs: number; text: string }
  | { type: 'apply-revision'; atMs: number }
  | { type: 'stop'; atMs: number }
  | { type: 'error'; atMs: number; message: string }

export type Passage = { id: string; text: string; availableAtMs: number }
export type DraftState = { text: string; p: number; shown: boolean }
export type SpinState = { text: string; p: number }

export type Status = 'waiting' | 'receiving' | 'complete' | 'stopped' | 'error' | 'revision'

export type SettleState = {
  policy: Policy
  status: Status
  /** what is on the page, in order */
  passages: Passage[]
  /** the contiguous committed prefix, as the tokens that make it */
  prefixTokens: Commit[]
  /** the contiguous committed prefix, as text; or an explicitly final snapshot */
  prefix: string
  /** how much of the prefix is word-complete, as a character length */
  wordSafeLength: number
  /** how much of the prefix is on the page, as a character length */
  releasedLength: number
  /** every committed position, contiguous or not */
  tokens: Record<number, Commit>
  /** the source's current guess at each open position it has one for;
   *  `shown` is whether it has cleared the floor (with hysteresis) */
  drafts: Record<number, DraftState>
  /** the source's current provisional argmax at each open position, at any
   *  probability: what the reel spins through below the floor. Never text. */
  spins: Record<number, SpinState>
  /** the guesses that are the source's prior for an unknown position: the
   *  ones it makes at many open positions at once, as compared keys, kept
   *  with hysteresis so the field does not blink as a count crosses the line */
  prior: string[]
  /** the first position not yet in the prefix */
  nextPosition: number
  receivedCount: number
  /** the request's bound on positions, when known */
  bound: number | null
  /** the position of the committed end token the prefix reached, once it has */
  endAt: number | null
  lastEventAtMs: number
  revisionText: string | null
  error: string | null
  /** a stream is commitments or snapshots; it cannot switch */
  source: 'commit' | 'snapshot' | null
  version: number
  previousPassages: Passage[] | null
}

export type Replay = {
  id: string
  label: string
  provenance: string
  events: SettleEvent[]
  durationMs: number
  /** the request's bound, known before the first event */
  bound?: number
}

/** One cell of the field: a token position and what the source has done with it. */
export type CellState = 'released' | 'forming' | 'held' | 'committed' | 'end' | 'open' | 'beyond'
export type FieldCell = { position: number; state: CellState; span: number }

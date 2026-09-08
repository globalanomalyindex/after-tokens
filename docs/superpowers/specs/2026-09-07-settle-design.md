# Settle: a causal reading surface for diffusion text

Date: 7 September 2026. Base: ab95e6a. Status: design locked, implementing.

This spec supersedes `2026-09-06-crystallize-arrival-grammar-design.md` for the reading surface, and absorbs the Codex proposal "After Tokens: Margin" (branch `codex/after-tokens-margin`, handoff of 7 September 2026). It keeps Margin's reading contract and its causal audit, rejects Margin's conclusion that the answer should carry no trace of the process, and replaces the crystallize grammar with a system that shows the process only where the process is real.

## 1. The question, restated

The brief asks how text from a diffusion language model should reach a reader so that the same answer feels clean, calm, beautiful, and brand-able. The crystallize pass answered with a choreography of the final answer. The Margin pass answered with a still page and a breathing mark. Both were answering a narrower question than the brief.

A diffusion sampler produces two kinds of fact at every step. It commits tokens, at positions, irreversibly. And, by committing, it reveals the shape of the answer: how long it is, where it is settled, where it is still open. A typewriter can show only the first kind. The crystallize reveal invented the second kind from the answer key. Margin threw the second kind away. Settle shows both, and shows each in the place a reader can use it.

## 2. What the audit established

The Codex audit of `ab95e6a` is accepted in full. Its findings are facts about this repository, and the new system is built so that none of them can recur.

- The reveal knew the answer. `traceAnswerText` joined the final word table; the component tokenized and measured the complete answer before the first step, reserving every final word's width. A live renderer has none of this.
- A word was shown at its first token. 700 of 3,880 corpus words (18.04 percent) span more than one commitment step; the curated subset has 188 of 1,205 (15.60 percent). The old resolving state rendered final text for all of them. That is potential exposure of text the model had not produced. 353 of the 700 happened to match the provisional guess; 347 did not.
- "Length fixed" was retrospective. `tail_done_step` is the last commit anywhere in a tail identified after the fact. Causally, the answer's length is known only when the contiguous committed prefix reaches its first end token. The stored statistic precedes that moment in 42 of 60 traces.
- "No phrase ever reads out of order" was false. `withReadingOrder` lets each phrase's earliest word bypass the sequence; the report's median within-phrase inversion share is 0.056.
- The 540 ms / 36 percent figures are medians of per-trace summaries at a shaped replay pace on 18 curated traces. They are not comparable to any causal cost.

Consequences carried into this spec: no final-text lookup, no geometry reservation, no salience map, no claim of length before the prefix reaches the end, and every number that appears in copy is computed by a reproducible report and stored in `lib/traces/findings.ts`.

## 3. What Margin got right, and where it stops

Kept, as the foundation of the reading surface:

- The event contract: timestamped commits by position, a bounded finish, revisable snapshots with explicit finality, revisions as events, stop and error as distinct terminal states.
- The reducer's discipline: a batch is validated before any of it is released; the prefix grows only through positions actually received; a terminal state cannot be overwritten by a late callback.
- Release by complete passage under a policy, with no timeout that relabels a fragment as complete, and finality releasing the exact remainder.
- Readable text never blurs, scrambles, pulses in weight, or moves. Selection and rereading are preserved.
- Brand outside the glyphs. Status in words. Reduced motion changes decoration only.
- The measured cost of holding: first passage at a median of 38 completed forward passes under sentence release, 128 under paragraph release, on 57 nonempty traces.

Where it stops:

- Margin renders nothing diffusion-specific. A reader cannot tell a diffusion source from a sentence-chunked autoregressive stream. The brief's premise, that this generation pattern deserves its own presentation, is left on the table.
- The margin mark is a 7 by 8 pixel bracket. Three voices differ by hue and breath period. That is a status indicator with a color option, and it cannot carry a brand.
- Holding the contiguous prefix invisible until a sentence completes is the whole source of Margin's waiting cost: a mean of 23.49 extra passes per character after the text was already available and in order. Margin pays that cost to keep the page still. Settle keeps the page still and does not pay it, because the held text is shown as forming, in a register that says so.
- The case study argues against its own predecessor and stops. The audit is the strongest chapter in the portfolio, and it deserves a design that goes somewhere.

## 4. The system

An answer has two surfaces and a margin.

**The page** is where the reader reads. It holds released passages as ordinary, selectable text in the product's own face. Text on the page never changes, never moves, and never animates. A passage arrives once, whole, with a soft onset (opacity only, at most 240 ms, none under reduced motion).

**The field** is where the reader watches, and it is carved into the text (8 September). Every position after the word-safe prefix is drawn as what the sampler has made of it: an open position is a slot of static standing where a word will, a committed piece of a word whose other pieces are out is a held slot, a complete word stands where it will, dim, in the sampler's own order, and a run of end tokens collapses to one end mark, so the zone shortens from the tail as the model decides the length. The zone reflows as slots become words; it is watched, never read. `lib/settle/carve.ts` derives it. The strip, one cell per position beneath the page (`lib/settle/field.ts`), is the field's compact form, for a product that wants the text zone quiet; it shows state and never text.

Between them, **the forming text**: the contiguous, committed, word-complete text that has reached the end of the page but has not yet completed a passage under the policy. It is drawn dim, in place, at the end of the last passage, and it brightens into the page when its passage completes. It is real text from the sampler, in reading order, and it never changes once drawn. It is not selectable, and it is hidden from assistive technology, because it is not yet a place to read.

**The margin** carries the source's state, in words, beside a small mark that breathes while the source is active and comes to rest at completion, stop, error, or revision. The mark's stroke, bloom, breath, and hue are the brand's. The words are not.

### 4.1 The contract

Given identical event histories, the surface renders identical page text, identical forming text, identical field cells, and identical status, whatever comes later.

1. Nothing is drawn that the source has not committed. No final-text lookup, no reserved widths, no salience map, no forecast of length.
2. A word is drawn only when it is complete. A token boundary is a word boundary when the following token is committed and begins with whitespace, when the token itself ends with whitespace, or when the following position is a committed end. A token with an uncommitted successor is held.
3. Text on the page never changes, moves, or reflows. When a sentence closes, the page's ink settles through its words' letterforms, bottom to top, in one movement over the onset; their shapes and places do not change. The carved zone after the page reflows as hairlines become words. An available word is drawn in a secondary ink that clears 4.5:1 on both of the brand's grounds, computed per brand (`secondaryInk` in `lib/settle/voice.ts`); where a palette leaves no room to dim, a tint toward the accent carries the state.
4. The page grows by whole passages under one of three policies. `word` releases each complete word as it joins the prefix (the forming text is then always empty). `sentence` releases at terminal punctuation followed by whitespace, holding abbreviations, inline code, lists, and fenced code (Margin's boundary). `paragraph` releases at a blank line outside code. No timeout and no length escape relabels a fragment as complete. Confirmed finality releases the exact remainder.
5. Out-of-order text appears only after the page, never inside it. A committed word may stand where it will, in the secondary ink, among noise. Noise is never content: the glyphs at an open position are random, cycle, and never settle, and a word's letters resolve out of them only after every piece of the word has committed (a decode over the onset, at the word's final width).
6. An exact length is claimed only when the contiguous prefix reaches a committed end token. Before that, a committed end token at any position bounds the answer to before it: the carved zone and the strip are cut at the lowest committed end, and nothing past it is drawn.
7. Revisable snapshots stay out of the page until an explicitly final snapshot. A later revision keeps the prior page visible and offers a review and apply action. Applying keeps the previous version.
8. Source complete, source stopped, source error, presentation paused, and revision available are distinct states, named in the margin.
9. A brand changes what cells, marks, and onsets look like and how they move. It never changes when text becomes available or is released.
10. Reduced motion removes the mark's breath, the cell bloom, and the onset. It changes nothing else.

### 4.2 The reducer

`lib/settle/reader.ts` is Margin's reducer, extended.

```ts
export type Policy = 'word' | 'sentence' | 'paragraph'
export type Commit = { position: number; text: string; end?: boolean }
export type SettleEvent =
  | { type: 'commit'; atMs: number; tokens: Commit[] }
  | { type: 'finish'; atMs: number; tokenCount: number }
  | { type: 'snapshot'; atMs: number; text: string; final: boolean }
  | { type: 'revision'; atMs: number; text: string }
  | { type: 'apply-revision'; atMs: number }
  | { type: 'stop'; atMs: number }
  | { type: 'error'; atMs: number; message: string }
export type Passage = { id: string; text: string; availableAtMs: number }
export type Status = 'waiting' | 'receiving' | 'complete' | 'stopped' | 'error' | 'revision'
export type SettleState = {
  policy: Policy
  status: Status
  passages: Passage[]
  /** the contiguous committed prefix, as tokens */
  prefixTokens: Commit[]
  /** the contiguous prefix as text */
  prefix: string
  /** the word-complete share of the prefix, as a character length */
  wordSafeLength: number
  /** text released to the page, as a character length of prefix */
  releasedLength: number
  /** committed positions beyond the prefix */
  tokens: Record<number, Commit>
  nextPosition: number
  receivedCount: number
  /** the request bound, when known from a finish event or supplied at creation */
  bound: number | null
  /** the position of the first committed end token reached by the prefix, or null */
  endAt: number | null
  lastEventAtMs: number
  revisionText: string | null
  error: string | null
  source: 'commit' | 'snapshot' | null
  version: number
  previousPassages: Passage[] | null
}
export function createSettleState(policy?: Policy, bound?: number): SettleState
export function reduceSettle(state: SettleState, event: SettleEvent): SettleState
export function formingText(state: SettleState): string   // prefix.slice(releasedLength, wordSafeLength)
export function heldText(state: SettleState): string      // prefix.slice(wordSafeLength)
```

Rules, in addition to Margin's:

- `wordSafeLength` advances per rule 4.1.2 over `prefixTokens`. At finality it equals the prefix length.
- Under `word`, `releasedLength` tracks `wordSafeLength`; each newly safe span becomes a passage. Under `sentence` and `paragraph`, Margin's `boundary()` runs over the pending word-safe text only, so a passage boundary is never claimed inside an incomplete word.
- `endAt` is set when the prefix reaches a committed end token. `bound` is set from `createSettleState` (the request's `max_new_tokens`) or from a valid `finish`.

### 4.3 The field

`lib/settle/field.ts` derives cells from state.

```ts
export type CellState = 'released' | 'forming' | 'held' | 'committed' | 'end' | 'open'
export type FieldCell = { position: number; state: CellState; span?: number }
export function fieldCells(state: SettleState, extent: number): FieldCell[]
```

- `extent` is `state.bound` when known, else the largest committed position plus a horizon of 16.
- Positions inside the released prefix are `released`; inside the forming text `forming`; inside the held remainder `held`. Committed positions beyond the prefix are `committed`; committed end tokens are `end`; the rest are `open`.
- Consecutive `end` cells collapse into one cell with `span`. Once `endAt` is set, cells beyond it are dropped: the field is exactly as long as the answer.
- A `committed` cell that has been waiting behind an `open` hole is what a reader sees when the page stalls. The field makes the wait legible without dramatizing it.

### 4.4 The voice

`lib/settle/voice.ts`. Five tokens, each with a range that is an invariant.

| token | range | what it changes | what it keeps |
|---|---|---|---|
| `mark` | `tick`, `dot`, `dash`, `square` | the glyph of a field cell and of the margin mark | cell state legible at every size |
| `bloom` | 0 to 1 | how much a cell flares when it commits, gone within 600 ms | no flare on released text |
| `onset` | 0 to 240 ms | the opacity ramp of a passage arriving on the page | never a transform, never a blur, zero under reduced motion |
| `tempo` | 0.7 to 1.4 | the breath period of the margin mark while receiving (2400 ms base) | rest at every terminal state |
| `grain` | 0 to 1 | the contrast between open cells and committed cells, and how dim forming text rests | forming text at least 3:1 against its surface; open cells visible |

The accent hue, the faces, and the radius stay in `BrandTokens`. The `preview` switch (forming text on or off) is a product setting, not a voice token: a product that wants Margin's stillness turns it off and pays Margin's hold.

Presets keep the five existing brands: after-tokens (tick, bloom 0.6, onset 160, tempo 1, grain 0.5), halcyon (dot, 0.3, 240, 0.85, 0.65), felt (square, 0.9, 200, 1.05, 0.45), pulse (dash, 0.4, 180, 0.95, 0.6), voltage (tick, 0, 0, 1.3, 0.35).

### 4.5 Replay

`lib/settle/replay.ts` is Margin's adapter unchanged in substance: `replayTrace(trace, pace)` reads only `tokens[].pos`, `tokens[].text`, `tokens[].step`, `step_ms`, `sampler.max_new_tokens`, and the model name. It never reads `answer`, `words`, `tail`, or `tail_done_step`. `settleAt(replay, elapsedMs, policy)` reduces only events at or before the elapsed time. The bound is passed to `createSettleState` from `sampler.max_new_tokens`, which a request knows before generation begins.

Paces: `recorded` (raw forward-pass clock, labeled as such), a uniform synthetic clock in milliseconds per step (labeled synthetic), and `scaled` (recorded durations divided by a factor, labeled "recorded pace at 1/N", used to show what a faster model changes without inventing a clock).

### 4.6 Cost

`lib/settle/cost.ts` and `tests/settle/report.test.ts` regenerate `lib/traces/settle.json` with, per trace and per policy, on both the uniform step clock and the recorded clock:

- first passage (completed passes), causal completion, mean per-character extra hold after joining the prefix, and maximum queued text (Margin's four),
- forming share: the share of the run during which forming text is visible,
- bursts: the number of passage releases and the median passage length in characters,
- word-safe lag: the mean passes between a token joining the prefix and becoming word-safe (the cost of rule 4.1.2, on its own),
- exact final output and precommit exposure (both must be 60 of 60 and zero).

`findings.ts` gains a `CAUSAL` object with the audit numbers and a `SETTLE` object re-exported from `settle.json`. No number appears in copy that is not in one of them.

## 5. The site

Eleven sections, in reading order. Ids are stable for the nav and the e2e specs.

| id | title on the page | the argument |
|---|---|---|
| `hook` | after tokens | "wait for the water to clear." The system, live, on a real recording. |
| `problem` | the wrong shape | the typewriter is the wrong shape for this source; a choreography of the answer key is the wrong answer to that. What a sampler actually does, drawn from a recording. |
| `audit` | the first version cheated | the causal audit of the crystallize reveal, with a figure that shows, at one step, what was drawn beside what had committed. |
| `contract` | what the reader can count on | the ten rules, the three policies, the fragment problem (a condition arrives with its sentence). |
| `field` | what settles first | the field: extent, holes, bursts. The two sampler shapes, drawn from recordings: blocks fill left to right and release a line at a time; the schedule-free sampler settles its end first and lands its words last. |
| `cost` | what waiting costs | the measured cost of each policy, the forming text's share, and what a faster clock changes. |
| `voice` | a voice in the margin | five tokens, five brands, the invariants, live. |
| `previews` | in the wild | three product frames on the real engine: a desktop assistant thread, a search answer, a phone. |
| `playground` | try it | source, policy, preview, voice, pace, with a live cost readout, and a labeled comparison with the retrospective reveal. |
| `evidence` | what is known | the psychology ledger, corrected; the study; the guardrails. |
| `open` | open | limits, what a live integration needs, reproducibility, credits. |

The visual identity is unchanged: Sligoil Micro for headings and the wordmark, Instrument Sans for reading, JetBrains Mono for readouts, bone and ink, dark stages, cobalt as the page's one accent, the quiet right-edge rail. Copy is lowercase outside demos. No em dashes anywhere. American English. No sentence of the form "X, not Y."

### 5.1 Components

```
lib/settle/         types.ts reader.ts boundary.ts field.ts voice.ts replay.ts fixtures.ts cost.ts
tests/settle/       reader.test.ts word-policy.test.ts field.test.ts replay.test.ts voice.test.ts report.test.ts
components/settle/  settle-answer.tsx   the product component: page, forming text, field, margin
                    field.tsx           the cell line
                    margin.tsx          the mark and the status words
                    settle-stage.tsx    a demo stage: source picker, policy, preview, voice, pace, replay controls, clock
                    exposure-figure.tsx the audit figure: one trace, one step, drawn beside committed
                    cost-table.tsx      the policy comparison from settle.json
components/sections/ section-{hook,problem,audit,contract,field,cost,voice,previews,playground,evidence,open}.tsx
```

Deleted: `section-profile.tsx`, `section-sampler.tsx`, `section-grammar.tsx`, `components/arrival/{grammar-stage,voice-stage,profile-figure,arrivals-trio}.tsx`, `components/trajectories/trace-stage.tsx`, `components/playground/playground.tsx` (replaced). Kept: the legacy `DiffusionText` engine and its modes as the retrospective reference the audit and the playground compare against, `lib/arrival/profile.ts` and `phrases.ts` as tools, `UnmaskMap` and `LockMap` as figures.

### 5.2 Motion

Every motion has a purpose or it is cut.

- Passage onset: opacity from 0 to 1 over `onset` ms on an exponential ease-out. Purpose: a soft onset is less likely to capture a reader's attention mid-sentence than an abrupt one. Zero under reduced motion.
- Forming to page: color from the forming register to the page register over `onset` ms. Same purpose.
- Cell bloom: a cell scales from 1 to 1 + 0.6 × bloom and back over 240 ms when it commits. Purpose: the eye can find where the sampler just worked. None under reduced motion.
- Margin breath: opacity 0.85 to 0.35 and back over 2400 / tempo ms while receiving. Purpose: the source is alive. None under reduced motion; the status words carry the state.
- Nothing else moves. No entrance stagger on the page, no halo, no weight change, no exhale.

### 5.3 Accessibility

The page is a `region` labeled as the answer; passages are plain spans. Forming text is `aria-hidden`. The field is `aria-hidden` and its meaning is carried by the status words. The status words live in a polite, atomic live region and change only on state changes, not on every commit. Controls are native buttons and selects. Reduced motion is honored in CSS and in the choreography. Contrast: forming text at least 3:1, page text at least 4.5:1, on every brand.

## 6. Evidence and claims

The case study makes exactly these claims about this repository, and no claim about a reader:

- Under this contract, across all 60 recordings, zero characters are drawn before their tokens commit, and every final output matches the sampler's exactly, under all three policies.
- The cost of each policy on this corpus, as measured.
- The field's cells are the sampler's positions; nothing in the field is authored.

The psychology ledger is rewritten from the literature review of 7 September 2026 (see `docs/research-note.md` section 9). Zeigarnik is retired as a design law. Closure is retired. Peak-end survives only as "end quietly." Rereading (Schotter, Tran and Rayner 2014) and abrupt-onset capture justify the page's stillness and the soft onset. Fluency-truth is a guardrail, not a goal. The five-claim study is replaced by the two-experiment design from Margin (availability-faithful and matched-duration), with qualification accuracy and time to a correct usable answer as primary outcomes and false-answer acceptance as a guardrail.

## 7. Acceptance

1. `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `GITHUB_PAGES=true pnpm build`, and `CI=1 pnpm exec playwright test --project=chromium` pass.
2. Every number in copy resolves to `findings.ts`; `settle.json` regenerates from `pnpm traces:settle`.
3. A throwing-getter test proves the replay adapter never reads `answer`, `words`, `tail`, or `tail_done_step`.
4. Reduced motion changes decoration only; a test proves release timing is identical with motion on and off.
5. Axe reports zero violations on the full page.
6. The eleven sections render at desktop and at 375 px with no horizontal overflow.

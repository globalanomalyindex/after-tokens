# The design record, in order

Three passes made this piece. Each is recorded here with what it got right, what it got wrong, and what the next pass kept. The first two records are preserved in full below the third, because the argument of the case study is the sequence.

## Pass three: Settle (7 September 2026)

### 1. The question, restated

The brief asks how text from a diffusion language model should reach a reader so that the same answer feels clean, calm, beautiful and brand-able. The crystallize pass answered with a choreography of the final answer. The Margin pass answered with a still page and a breathing mark. Both answered a narrower question than the brief.

A diffusion sampler produces two kinds of fact at every step: it commits tokens, at positions, irreversibly, and by committing it reveals the shape of the answer. A typewriter shows only the first kind. Crystallize invented the second from the answer key. Margin threw it away. Settle shows both, each where a reader can use it.

### 2. The audit, accepted

The Codex pass of 7 September audited `ab95e6a` against its own recordings. Its findings are reproduced by `pnpm traces:settle` and cited from `lib/traces/findings.ts`:

- The reveal knew the answer: it joined the final word table, measured it, and reserved every word's final width before the first step.
- 700 of 3,880 words (18.04 percent; 188 of 1,205 in the curated set) span more than one commit step, and the old rule drew their final spelling at the first piece. 353 matched the model's guess at that moment.
- The "length fixed" label was a retrospective statistic; it preceded the causally known length in 42 of 60 runs.
- "No phrase ever reads out of order" was contradicted by the report's own 0.056 median inversion share.
- The 540 ms and 36 percent figures described a shaped replay of 18 curated runs and are not comparable to any causal cost.

### 3. What Margin got right, and where it stopped

Kept: the event contract (commits by position, a bounded finish, snapshots with explicit finality, revisions as events, stop and error as distinct states); the reducer's discipline (validate a batch before releasing any of it; the prefix grows only through received positions; a terminal state cannot be overwritten); release by complete passage with no timeout; readable text that never blurs, scrambles, pulses or moves; brand outside the glyphs; status in words; reduced motion changes decoration only; the cost instrument.

Rejected: rendering nothing diffusion-specific; a 7-pixel bracket in three hues as a brand surface; paying the whole hold in blankness; a case study that argued against its predecessor and stopped.

### 4. The system

The page: released passages, still, selectable. The forming text: committed, contiguous, word-complete text beyond the last passage, dim, brightening into the page. The field: one line of cells, one per token position of the request's bound, showing open, committed, end, held, forming and released, with end runs collapsed to their share. The margin: status words and a breathing mark.

Ten rules, in `docs/superpowers/specs/2026-09-07-settle-design.md` section 4.1, kept by `lib/settle/reader.ts`. The word rule, new in this pass: a token boundary is a word boundary when the next committed token begins with whitespace, the token itself ends with whitespace, or the next position is a committed end. It costs 3.3 steps on average and closes the 18 percent exposure.

Three policies: each word, each sentence, each paragraph. The field derives from state in `lib/settle/field.ts`. The voice is five tokens with ranges in `lib/settle/voice.ts`: mark, bloom, onset (at most 240 ms), tempo, grain.

### 4b. The field, carved into the text (8 September)

The first Settle build kept out-of-order state in a strip of cells beneath the page. Watched, it still read as a typewriter: the page and the forming text both grow by contiguous prefix, so everything readable arrived left to right and the diffusion lived in a strip too thin to carry it. The carved zone (`lib/settle/carve.ts`) moves the field into the text: every position after the word-safe prefix is a slot of static where a word will stand, a complete word stands where it will in the sampler's own order, a held piece stays a slot, and end runs collapse so the zone is carved down from the tail. Rule 5 now reads: out-of-order text appears only after the page, never inside it; an open position is a slot and never letters. The strip remains as the field's compact form.

### 4c. Ink settling (8 September)

The carved zone's hatched slots gave the surface a mechanical texture, and its three registers were more than the reader needed. The refinement, from a review of the live page: a word's shape is fixed the moment it is available, and only its ink changes. An available word appears in a secondary ink that is readable (the page's ink moved toward the ground as far as a 4.5:1 floor allows, computed per brand and ground; a tint toward the accent where a palette cannot dim, as on felt). When its sentence closes, the page's ink settles through the letterforms, bottom to top, in one coordinated movement over the onset, and the word does not move. Placeholders became quiet hairlines. The hypothesis this states for the study: one calm transition inside newly ready words feels more coherent than many independent marks.

### 4d. The noise (8 September)

Marks, whether hairlines or haze, read as a ruler under the text and the words still arrived from nowhere. The piece's original promise was watching an answer denoise. The honest version of that promise: an open position shows a short run of noise glyphs in the answer's own face, dim, cycling slowly and never settling, so they never spell anything; when a word commits, its letters resolve out of that noise left to right over the onset, at the word's final width, in the secondary ink; when its sentence closes, the page's ink settles through it. The audit's line holds, because no letter of a word is drawn before the source has committed every piece of it, and rule 5 now says what noise is: never content.

### 5. The cost, measured

On all sixty recordings on the uniform step clock: first passage at a median of 12 steps (word), 39 (sentence), 128 (paragraph); extra wait after text is in order at a mean of 3.3, 24.5 and 44.7 steps; forming text visible for a median 90 percent of the run under sentence and paragraph; 60 of 60 exact outputs and zero characters drawn early under every policy. Margin's sentence policy paid its 23.5-step hold in blankness; Settle draws the held text for 90 percent of the run.

### 6. Retired

The tension budget, the salience map and nucleus, the two-channel reveal, the arrival profile as a design instrument (kept as a tool), the exhale, the "length fixed" label, the 540 ms and 36 percent figures, the sections that presented them, and the reward-grammar psychology as design law. The legacy engine remains as the labeled retrospective reference the audit figure compares against.

### 7. The literature, corrected

Recorded in `docs/research-note.md` section 9. In short: stability of read text is the one well-quantified harm (Liu et al. 2023), rereading must be preserved (Schotter, Tran and Rayner 2014), visible process and explained waits raise perceived value (Buell and Norton 2011; Maister 1985) and therefore need a guardrail (Reber and Schwarz 1999), pacing at linguistic boundaries is preferred (Zhu et al. 2026), the Zeigarnik memory effect does not replicate (Ghibellini and Meier 2025), closure is about contours, and peak-end is contested for mild experiences. No study tests non-sequential text arrival.

### 8. Credits

The causal audit and the first implementation of the reading contract were made by Codex on 7 September 2026 under the name Margin, on branch `codex/after-tokens-margin`, with a handoff document that this pass absorbs. The reducer in `lib/settle/reader.ts` is Margin's reducer extended; the boundary rules and the authored fixtures are Margin's; the cost instrument extends Margin's report.

---

## Pass two: the arrival grammar, reasoned from the ground up (6 September 2026)

*Preserved as written. The audit above found that the reveal it describes required the final answer; its profile numbers describe a replay that knew the answer and are cited nowhere else.*

### 1. The question, and what it hides

The brief was a question with a hidden premise: how do we make diffusion text rendering clean, simple, beautiful, and brand-able, using psychological principles such as the Zeigarnik effect, gestalt closure, and the peak-end rule, so that the same answer feels better through presentation alone? The premise was that the words are fixed and the arrival is free. That made the arrival a design object.

### 2. Diagnosis of the earlier build

Four structural problems: many levers and no spine; four nature metaphors diluting a system into four products; psychology cited rather than operationalized; chrome competing with the work.

### 3. Arrival as a design object

An arrival is one number per word, the time it becomes legible. From that vector, the phrase structure, and each word's salience, four properties follow: tension, closure, peak and end, fluency. Together they were the arrival profile, computed in `lib/arrival/profile.ts`.

### 4. What the profile said about the earlier arrivals

Fog and aurora held every phrase open through their sweep; mitosis scattered inside phrases; mycelium opened 4.5 loops at once. They stayed as reference arrivals.

### 5. The grammar: crystallize

At most two phrases open at once; the next phrase opened by salience; the nucleus locked first; every front advanced every step; a 320 ms pre-roll; about twenty steps at 140 to 260 ms; a ghost one step before a lock; an exhale after the last lock.

### 6. The two-channel reveal for recorded runs

The state channel ghosted a word at its first token commit; the reading channel made a word crisp only when every word before it in its phrase was crisp. The audit found the first channel drew final text at the first token and the second still left 5.6 percent of within-phrase pairs out of order.

### 7. The voice

Six tokens with ranges: tempo, attack, weight, glow, hush, swing.

### 8. What was retired, and why

The four metaphors' unbounded seeding, the closing wave, the four specimens, the drafting chrome, the monospace body face.

### 9. What is authored and what is measured

The trajectories measured a sampler; the profile measured arrivals; nothing measured a reader.

---

## Pass one: the four metaphors (27 May to 4 September 2026)

Fog dissipating, aurora, mitosis and mycelium as four reveal modes, each a nature metaphor for non-sequential arrival; a recorded-sampler mode added on 4 September; a reward grammar citing the Zeigarnik effect, gestalt closure and the peak-end rule. Superseded by pass two, which scored the four modes and retired them, and by pass three, which retired the psychology as design law.

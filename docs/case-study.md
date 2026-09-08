# After Tokens: a causal reading surface for diffusion text

**A product design and engineering case study**

| | |
|---|---|
| Role | Product design, interaction design, prototyping, front-end engineering (solo, with Claude as design and engineering partner; the causal audit and the first implementation of the reading contract by Codex, 7 September 2026) |
| Timeline | May to September 2026 |
| Status | Working prototype; the cost measured on sixty recorded runs; reader benefits untested; a two-experiment study designed |
| Live | https://after-tokens.vercel.app · source: https://github.com/globalanomalyindex/after-tokens |

## Overview

Diffusion language models do not write. They hold every position of an answer open at once and commit positions in the order they are sure of them, over a hundred or so denoising steps. Every chat product renders that process with a typewriter inherited from models that write one token at a time, and the typewriter misrepresents it twice: it draws the answer in an order the sampler did not use, and it puts half-formed words under the reader whenever a token is a piece of one.

After Tokens asks how an answer from this kind of model should reach a reader, and answers with a system called Settle. An answer has two surfaces and a margin. The page holds released passages as ordinary, still, selectable text. The field, one line of cells beneath the page, shows the sampler's own positions: where it has committed, where a hole is holding the page, and how long the answer will be. Between them, the forming text: committed, in-order, word-complete text that has not yet completed a passage, drawn dim and brightening into the page when it does. The margin says what the source is doing, in words, beside a mark whose shape, bloom, breath and hue are a brand's.

The claim is narrow and testable: under this contract nothing reaches the reader before the model commits it, every final output is exact, and the cost of waiting for complete passages is measured rather than argued away. Whether the surface helps a reader is a hypothesis with a study designed to break it.

## The challenge

The brief was a question: how do we make diffusion text rendering clean, simple, beautiful and brand-able, so that the same answer feels better through presentation alone? Two earlier answers to it shaped the final one.

The first, shipped on 6 September, was a reveal grammar called crystallize: words ghosted in and sharpened in a choreographed order, specified by four properties borrowed from the psychology of reading and reward. It was beautiful and it was a picture of the result. To choreograph the answer it needed the final words, their measured widths and a map of which mattered, and a live source has none of those.

The second, proposed a day later by an independent audit-and-redesign pass, was called Margin. It audited the crystallize build against its own recordings, found exactly how it had cheated, and replaced it with a causal reading contract: release only complete sentences as plain text, put a small breathing mark in the margin, and show nothing else. It was honest and it was invisible. A reader could not tell a diffusion source from a sentence-chunked autoregressive stream, and the wait it imposed was paid in blankness.

Settle keeps Margin's contract and Margin's rigor, and answers the question Margin declined: where the process is real, show it.

## Research

### What a real sampler does

Sixty denoising trajectories were recorded from a real masked diffusion language model (Qwen3 0.6B adapted with the MDLM objective, greedy, on an Apple M3) across twenty prompts and three sampler configurations, with a four-run LLaDA-8B corroboration set. Three shapes recur:

- Under the block sampler, half of consecutive commits land beside the previous one. Inside a block of 32 the easy positions fill first and one hard position holds the rest; when it fills, a whole clause joins the readable prefix at once. A causal renderer therefore sees text arrive in bursts, a clause at a time.
- Under the schedule-free sampler, every usable run committed its end-of-sequence tail before its last word. The model spends most of its steps deciding how short the answer is, then lands the words in a rush at the end.
- 18 percent of the corpus's words are spelled across more than one commit. A surface that draws a word at its first piece is guessing the rest.

### What the audit found

The independent audit of the crystallize build, reproduced by this repository's own report, established four facts about it:

- It knew the answer. The engine joined the final word table into a string, tokenized and measured it before the first step, and reserved every word's final width.
- It drew 700 of 3,880 words (18.04 percent) in their final spelling before all their tokens had committed; 353 of those happened to match the model's provisional guess at the time, and 347 did not.
- It announced the answer's length from a statistic computed after the fact in 42 of 60 runs. Causally, the length is known only when the committed prefix reaches its first end token.
- It claimed no phrase ever read out of order while its own report showed a median 5.6 percent of within-phrase pairs still did.

Every finding was accepted and the new system was built so none can recur.

### What the literature says

A review on 7 September 2026 checked each mechanism the first version had cited, separating what each source says from what it does not establish.

| mechanism | what the evidence says | consequence |
|---|---|---|
| stability of text under the eye (Liu et al., CHI 2023; Slattery, Angele and Rayner, 2011) | revising text already on screen correlates with distraction, fatigue and harder reading; a change under a fixation is detected unless timed to a saccade | the page never changes, moves, blurs or reweights |
| rereading (Schotter, Tran and Rayner, 2014) | preventing return to earlier words reduced comprehension | earlier passages stay, in place, selectable |
| visible process and explained waits (Buell and Norton, 2011; Maister, 1985; Zhang et al., 2024) | showing work raises perceived value; unexplained and uncertain waits feel longer | the field shows what the sampler has done and why the page waits, and never encodes confidence or correctness |
| pacing at linguistic boundaries (Zhu et al., CHI 2026; Tan and Nov, CHI 2026) | streaming paused at clause boundaries rated less demanding; an instant answer rated less thoughtful than a short visible delay | the page takes whole sentences; the forming text and field carry the delay |
| Zeigarnik effect (Ghibellini and Meier, 2025, meta-analysis) | the memory advantage for interrupted tasks does not replicate as a general effect | retired; the first version's tension budget is gone |
| gestalt closure (Elder and Zucker, 1994) | concerns contours of shapes | retired; a passage boundary is a linguistic rule, chosen and priced |
| peak-end (Alaybek et al., 2022; contested for mild experiences) | endings matter, and so does the average | kept only as: end quietly, at a real terminal state |
| fluency and truth (Reber and Schwarz, 1999; Alter and Oppenheimer, 2009) | easier-to-process statements are judged more likely true | a guardrail: the study measures false-answer acceptance |

No study tests non-sequential text arrival. No published design guidance for rendering diffusion text was found. Both gaps are part of why the work exists.

## The insight

A diffusion sampler produces two kinds of fact at every step. It commits tokens, at positions, irreversibly. And by committing, it reveals the shape of the answer: how long it is, where it is settled, where it is still open. A typewriter can show only the first kind. Crystallize invented the second kind from the answer key. Margin threw the second kind away.

The insight is that each kind of fact has a place a reader can use it. Committed, in-order, complete text belongs on the page, where it must hold still. The shape belongs beneath the page, as state and never as text, where it can move freely because nothing there is read. The boundary between them, the forming text, is the only place the two meet, and it is real text from the sampler that never changes once drawn.

## Design principles

1. **Draw only what the source has committed.** No final-text lookup, no reserved widths, no map of salience, no forecast of length.
2. **The page holds still.** Text on the page never changes, moves, blurs or reweights. A passage arrives once, whole.
3. **Show the process where it is real.** The field is the sampler's own positions. Nothing in it is authored.
4. **Price every wait.** A policy that holds text is measured on every recording, per clock, with denominators.
5. **Brand outside the words.** A voice changes cells, marks and onsets. It never changes when text is available.

## The solution: Settle

### The contract

Given the same events, the surface shows the same page, the same forming text, the same field and the same status, whatever comes later. Ten rules make that true, kept by a pure reducer:

1. Nothing is drawn that the source has not committed.
2. A word is drawn only when it is complete. A token whose successor is uncommitted is held, because it may be the first piece of a longer word. A boundary exists when the next committed token begins with whitespace, the token itself ends with whitespace, or the next position is a committed end.
3. Text is appended only at the end of the contiguous prefix. Nothing visible changes, except that forming text brightens into the page.
4. The page grows by whole passages under a policy: each word, each sentence, or each paragraph. No timeout relabels a fragment as complete; finality releases the exact remainder.
5. Out-of-order state appears only in the field, as cell state.
6. Length is claimed only when the prefix reaches a committed end token.
7. Revisable snapshots stay off the page until one is explicitly final. A later revision keeps the prior page and offers a review and apply action.
8. Complete, stopped, error, paused and revision available are distinct states, named in the margin.
9. A brand changes appearance and motion envelopes, never availability.
10. Reduced motion removes the breath, the bloom and the onset, and nothing else.

### The field

One line of cells as wide as the request's bound, one per token position. A cell is open, committed, end, held, forming or released; a run of end cells collapses into one that takes its true share, so the answer's extent reads as a floor growing in. Under the block sampler the field shows the hole, then the burst. Under the schedule-free sampler it shows the floor growing in from the right for a hundred steps, then the words landing in the last few, then the sentence settling onto the page. It replaces the three bouncing dots with a loading state that says what is happening: 84 of 128 positions settled, the end known, one hole holding the next sentence.

### The voice

A brand gets five tokens on the one surface, each inside a range that is an invariant:

| token | range | changes | keeps |
|---|---|---|---|
| mark | tick, dot, dash, square | the glyph of a cell and of the margin mark | every state legible |
| bloom | 0 to 1 | how much a cell flares when it commits | gone within 240 ms |
| onset | 0 to 240 ms | the opacity ramp of a passage arriving | never a transform, never a blur, zero under reduced motion |
| tempo | 0.7 to 1.4 | the breath of the margin mark | rest at every terminal state |
| grain | 0 to 1 | how faint open cells rest, how dim forming text rests | forming text at least 3:1 |

Five presets ship: After Tokens (tick), Halcyon (dot, slow, soft), Felt (square, heavy bloom), Pulse (dash, calm), Voltage (tick, no bloom, no onset).

### By the numbers

The cost of each policy over all sixty recordings, on the uniform step clock (one completed forward pass per step) and the raw forward-pass clock of the capture machine (about 119 ms per step for a 0.6B model on a laptop; a production model divides that by ten or more):

| measure | each word | each sentence | each paragraph |
|---|---|---|---|
| first passage on the page, median | 12 steps · 1.4 s | 39 steps · 4.6 s | 128 steps · 15.6 s |
| extra wait after text is in order, mean | 3.3 steps | 24.5 steps | 44.7 steps |
| of which the word rule alone | 3.3 steps | 3.3 steps | 3.3 steps |
| forming text visible, median share of the run | 0% | 90% | 90% |
| passages per answer, median | 16 of 8 characters | 3 of 107 characters | 1 of 414 characters |
| exact final output | 60 of 60 | 60 of 60 | 60 of 60 |
| characters drawn before commitment | 0 | 0 | 0 |

Margin held the in-order text invisible until its sentence closed and paid the whole hold in blankness. Settle releases the page on the same boundary at the same moment, so the page's wait is identical, and draws the held text dim beneath it for 90 percent of the run. The word rule, the price of never drawing a piece of a word, costs 3.3 steps on average.

## Process and decisions

- **Crystallize to Margin to Settle.** The first version optimized a reveal it could not produce live. The audit was accepted in full. Margin's reducer, event contract, boundary rules, revision handling and cost instrument were kept as the reading surface. Margin's conclusion, that the answer should carry no trace of the process, was rejected, along with a brand surface that consisted of a 7-pixel bracket in three colors.
- **The forming text.** Margin's waiting cost came entirely from holding in-order text invisible. Drawing it dim, as real text that never changes, keeps the page still and removes the blankness. It is not selectable and it is hidden from assistive technology, because it is not yet a place to read.
- **The word rule.** The audit's 18 percent is the case for it. The rule reads whitespace at token boundaries and costs 3.3 steps on average.
- **The field instead of ghost words.** The old surface showed the shape of the answer with illegible blurred slots at final width, which required the final answer. The field shows the same shape from the sampler's actual positions, which requires nothing.
- **Retired.** The tension budget, the salience map, the nucleus, the two-channel reveal, the arrival profile as a design instrument, the exhale, the "length fixed" label, and the 540 ms and 36 percent figures. The legacy engine is kept as a labeled retrospective reference the audit compares against.
- **The nature anchor.** Sediment settling in a column of water: the clear zone grows from the top down as the suspension drops out. The page is the clear zone, the field is the suspension, and the rule is to wait for the water to clear before reading it, while being able to watch it clear.

## Validation

Three claims about the repository, each tested: across all sixty recordings and three policies, zero characters reach the page before their tokens commit (a throwing-getter test proves the adapter never reads the answer); every final page equals the sampler's output to the character; and the cost of each policy is reported per run with denominators.

Nothing is claimed about a reader. The study is designed as two labeled experiments: an availability-faithful comparison under identical source events, and a matched-duration comparison to isolate preference. Conditions: the raw prefix, each word, each sentence with forming text, each sentence without it, each paragraph, counterbalanced within participants. Primary outcomes: qualification accuracy and time to a correct usable answer. Guardrails: false-answer acceptance and truth discrimination. Sample size from a pilot and a prespecified smallest useful effect. No participants have been recruited.

## Impact and limits

What shipped: a pure reducer and its contract, a replay adapter that cannot read the answer, a field derived from state, a five-token voice with invariants, a cost instrument that measures every policy on every recording, a corrected literature ledger, and a study design with its stimuli. What did not: any measurement of a reader; a live model on the other end; support for scripts without word spacing, for rich Markdown, or for samplers that remask committed tokens beyond the snapshot path. The corpus is one small model on one machine. The strongest argument against the design, that waiting costs more than stillness gives back, stands until the study runs.

## Reflections

The turn this time was to accept an audit of my own work in full and then refuse its conclusion. Margin was right about every fact and wrong about what to do with them, because it treated the process as something to hide rather than something to place. Once the two kinds of fact a sampler produces had two places on the surface, most of the earlier design fell away on its own, and what remained is simpler than either version it replaces, and the first whose every visible pixel can be traced to an event.

## Further exploration

A live sampler on the other end of the adapter; a field for reversible samplers; keyed blocks for Markdown and code; segmenters for scripts without word spacing; a unit smaller than a passage for structured answers; and the study.

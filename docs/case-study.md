# After Tokens: a causal reading surface for diffusion text

> Historical case-study draft. The current implementation and research narrative are in [the solid skeleton motion study](skeleton-motion-study-2026-09-09.md) and [implementation handoff](skeleton-handoff-2026-09-09.md). Earlier renderer descriptions below retain their original scope.

**A product design and engineering case study**

**Motion update, 9 September 2026:** the revised renderer now uses persistent source-token identity, fixed candidate reservations, local completion feedback and a persistent ambient treatment. [The implementation record](motion-direction-2026-09-09.md) explains what changed and what remains unvalidated. The reader study is still unrun; the revision does not claim zero reflow.

| | |
|---|---|
| Role | Product design, interaction design, prototyping, front-end engineering (solo, with Claude as design and engineering partner; the causal audit and the first implementation of the reading contract by Codex, 7 September 2026) |
| Timeline | May to September 2026 |
| Status | A concept exploration in a working prototype; the cost measured on sixty recorded runs; untested on readers; a two-experiment study designed |
| Live | https://globalanomalyindex.github.io/after-tokens/ · source: https://github.com/globalanomalyindex/after-tokens |

## Overview

Masked diffusion language models can predict many positions of an answer in parallel. The samplers recorded here commit positions irreversibly, sometimes within a sequential block schedule. Other samplers may revise predictions and need a different finality contract. A conventional typewriter presentation can hide the distributed work: it exposes only a growing left-to-right prefix and may show half-formed words whenever a token is a piece of one.

After Tokens asks how an answer from this kind of model should reach a reader, and answers with a system called Settle. Released passages use ordinary, still, selectable text. After them, committed pieces and complete words use a distinct available treatment; fitting source drafts remain visibly provisional. Dark stages use secondary ink. Translucent product bubbles use primary ink with an anchored dotted underline until release, preserving contrast without changing word width. Unresolved positions reserve a fixed amount of space and carry a small decorative breath. When several words become complete together, their local responses begin together. A passage release changes the same text’s available treatment and adds one short afterglow. Finished text rests. The margin names the source state; the brand controls the treatment without controlling availability.

The motion is **suspended → gathering → settling → resting**. Those are presentation states, not a claim about cognition or a percentage of completion. Exact final line geometry remains unknown until the source provides the text. Candidate updates cannot rewrite that geometry; commitments still can.

The claim is narrow and testable: under this contract nothing reaches the page before the model commits it, nothing committed is drawn as a guess and nothing guessed is drawn as committed, every final output is exact, and the cost of waiting for complete passages is measured rather than argued away. Whether the surface helps a reader is a hypothesis with a study designed to break it.

## The challenge

The brief was a question: how do we make diffusion text rendering clean, simple, beautiful and brand-able, so that the same answer feels better through presentation alone? Two earlier answers to it shaped the final one.

The first, shipped on 6 September, was a reveal grammar called crystallize: words ghosted in and sharpened in a choreographed order, specified by four properties borrowed from the psychology of reading and reward. It was beautiful and it was a picture of the result. To choreograph the answer it needed the final words, their measured widths and a map of which mattered, and a live source has none of those.

The second, proposed a day later by an independent audit-and-redesign pass, was called Margin. It audited the crystallize build against its own recordings, found exactly how it had cheated, and replaced it with a causal reading contract: release only complete sentences as plain text, put a small breathing mark in the margin, and show nothing else. It was honest and it was invisible. A reader could not tell a diffusion source from a sentence-chunked autoregressive stream, and the wait it imposed was paid in blankness.

Settle keeps Margin's contract and Margin's rigor, and answers the question Margin declined: where the process is real, show it.

## Research

### What a real sampler does

Sixty denoising trajectories were recorded from a real masked diffusion language model (Qwen3 0.6B adapted with the MDLM objective, greedy, on an Apple M3) across twenty prompts and three sampler configurations, with a four-run LLaDA-8B corroboration set. Four observations recur:

- Under the block sampler, half of consecutive commits land beside the previous one. Inside a block of 32 the easy positions fill first and one hard position holds the rest; when it fills, a whole clause joins the readable prefix at once. A causal renderer therefore sees text arrive in bursts, a clause at a time.
- Under the schedule-free sampler, every usable run committed its end-of-sequence tail before its last word. The model spends most of its steps deciding how short the answer is, then lands the words in a rush at the end.
- 18 percent of the corpus's words are spelled across more than one commit. A surface that draws a word at its first piece is guessing the rest.
- At every step the model already holds a guess for every position it has not committed. At the 0.25 floor the surface draws at, a guess is eligible before the width-fit check for 17 percent of open-position steps and is the token that later commits two thirds of the time, and next-step probability increases are larger beside a new commitment than at other open positions. That association is not a causal effect on the neighboring word or a confidence score for answer correctness.

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
| stability of text under the eye (Liu et al., CHI EA 2023, late-breaking work; Slattery, Angele and Rayner, 2011) | revising text already on screen went with self-reported distraction and fatigue and lower reading comfort, all reader experience rather than comprehension; a change under a fixation is detected unless timed to a saccade | the page never changes, moves, blurs or reweights |
| rereading (Schotter, Tran and Rayner, 2014) | preventing return to earlier words reduced comprehension | earlier passages stay, in place, selectable |
| visible process and explained waits (Buell and Norton, 2011; Maister, 1985; Zhang et al., 2024) | showing work raises perceived value when the result is good and lowers it when the result disappoints; unexplained and uncertain waits feel longer | the field shows source state and why release waits; token probability in a draft is distinguished from answer correctness |
| response latency (Tan, Messerschmidt, Yin and Nov, CHI 2026; refreshed 9 September) | the study compared 2, 9 and 20 seconds before the first token, not instant output; thoughtfulness ratings were lower at 2 seconds than at 9 or 20; no significant latency effect on logged interactions or workload | does not justify adding a delay or a subsecond animation duration; the earlier Zhu clause-pacing citation was not verified in this refresh and is withdrawn as support |
| Zeigarnik effect (Ghibellini and Meier, 2025, meta-analysis) | the memory advantage for interrupted tasks does not replicate as a general effect | retired; the first version's tension budget is gone |
| gestalt closure (Elder and Zucker, 1994) | concerns contours of shapes | retired; a passage boundary is a linguistic rule, chosen and priced |
| peak-end (Alaybek et al., 2022; contested for mild experiences) | endings matter, and so does the average | kept only as: end quietly, at a real terminal state |
| fluency and truth (Reber and Schwarz, 1999, a small early demonstration with color contrast; Alter and Oppenheimer, 2009) | easier-to-process statements are judged more likely true | a guardrail: the study measures false-answer acceptance |
| motion that carries mass (Lasseter, 1987; Thomas and Johnston, 1981; Chang and Ungar, 1993) | craft arguments and a design paper with no user study: squash and stretch defines an object's rigidity and mass, and solidity and reinforcement make an interface's changes easier to follow | one local response acknowledges a real completion; timings and any impression of tactility remain design choices |
| motion in the periphery (Bartram, Ware and Calvert, 2003) | motion beside a primary task is detected far better than a color change; traveling and zooming icons were rated most distracting, slow linear motion and slow blink least; distraction was self-reported, on notification icons beside a task rather than on text | a guardrail: ambient treatment stays local to unresolved decoration; readable glyphs keep their shape and finished text rests |
| animated transitions (Heer and Robertson, 2007) | animated transitions beat abrupt changes for tracking objects and judging change; simple staging helped a little and was preferred, heavy staging hurt; measured on charts rather than on text | reduce layout changes first, coordinate necessary movement, and avoid stacking independent effects on one event; chart results do not establish a text benefit |

Our literature search did not identify a study testing this specific diffusion presentation. Adjacent work supplies hypotheses and constraints, not a demonstration that Settle improves reading. The motion refresh and primary-source links are in the research note, section 9.8.

## The insight

The recorded commit-based samplers produce irreversible token commitments at specific positions. Those commitments also constrain the answer's remaining extent and expose which positions remain open. They do not provide its exact final line geometry. A conventional typewriter emphasizes the contiguous prefix; this project also explores how to show the distributed state without using an answer key.

The insight is that each kind of fact needs a clear presentation. Committed, in-order, complete text belongs on the page, where it must hold still. The provisional zone can show what remains unresolved, including source drafts and committed pieces. People can still read that zone; calling it provisional does not make its movement or incomplete meaning harmless. The boundary between the two, the forming text, is real text from the sampler whose passage is not yet complete.

## Design principles

1. **Draw only what the source has, drawn as what it is.** Committed text is drawn as committed, the source's own current guess is drawn as a guess, and no guess reaches the page. No final-text lookup, no hidden final-word widths, no map of salience, no forecast of length.
2. **Protect the reader’s place.** Released text keeps its position and shape while later events arrive. Completion feedback is local decoration around a readable base, not a reason to move or briefly obscure the words.
3. **Show the process where it is real.** The field is the sampler's own positions and the sampler's own guesses at them. What is authored is the floor a guess must clear, how it is drawn, and the words for the phase.
4. **Price every wait.** A policy that holds text is measured on every recording, per clock, with denominators.
5. **Brand the treatment, preserve the contract.** A voice changes decorative ink, ambient rhythm and completion envelopes. It never changes when text is available or what the source has committed.

## The solution: Settle

### The contract

Given the same events, the surface shows the same page, the same forming text, the same field and the same status, whatever comes later. Ten rules make that true, kept by a pure reducer:

1. Nothing is drawn as the source's text that the source has not committed. The one thing an uncommitted position may draw is the source's own current guess for it, drawn as a guess.
2. A word is drawn only when it is complete. A committed fragment may be visible, but complete-word status and release wait for its boundary. A boundary exists when the next committed token begins with whitespace, the token itself ends with whitespace, or the next position is a committed end.
3. Released text keeps its baseline and readable shape while later events arrive. Completion feedback is decorative and local. Fixed candidate reservations do not change with guessed text; new committed content can still reflow the provisional zone. Available text clears the contrast floor on its actual background: secondary ink on dark stages, primary ink with a dotted underline in translucent product bubbles.
4. The page grows by whole passages under a policy: each word, each sentence, or each paragraph. No timeout relabels a fragment as complete; finality releases the exact remainder.
5. Out-of-order material appears only after released text. Open positions hold a content-independent reservation. A fitting source guess above the display floor can appear in provisional ink; other unresolved positions remain nonlexical. Committed pieces are fixed source text, and complete words need committed boundaries. A guessed newline cannot insert an authoritative break. No guessed text reaches the released page.
6. An exact length is claimed only when the prefix reaches a committed end token; a committed end token anywhere bounds the answer to before it, and nothing past it is drawn.
7. Revisable snapshots stay off the page until one is explicitly final. A later revision keeps the prior page and offers a review and apply action.
8. Complete, stopped, error, paused and revision available are distinct states, named in the margin.
9. A brand changes appearance and motion envelopes, never availability.
10. Reduced motion and the motion-off control remove decorative and spatial animation without changing source availability, release or final output. Pausing, leaving the viewport or hiding the document pauses activity. Terminal states rest.

### The field

Each open position reserves 2.8ch. That is an authored estimate independent of the candidate’s spelling and the eventual answer. The field can show distributed activity before a contiguous prefix is ready, without pretending to know final word widths, paragraph heights or list structure. Committed end tokens constrain its remaining extent. A strip below the answer remains an optional compact representation; the default carries activity in the text area itself.

The margin’s phase names are also authored. The committed share plus half the drafted share assigns sketching, drafting, polishing or closing. Those labels summarize available state. They are not a forecast, model cognition or a measure of answer correctness.

### The draft

The recordings contain each masked position’s provisional argmax and token probability. The existing display policy admits guesses at a 0.25 floor, with hysteresis and an attachment rule; a repeated prior is suppressed. The revised layout adds a width-fit check: a complete candidate is legible only when it fits inside the fixed reservation. Longer candidates stay nonlexical instead of showing a clipped word or pushing their neighbors. Consequently the historical draft statistics below describe policy eligibility, not the current rate of visible drafts after the fit check.

Candidate whitespace is flattened inside the reservation. It cannot create a real newline or regroup the text’s parents. A persistent decorative layer carries the breath, so a new guess does not restart an entrance animation. The visible draft itself has static typography and provisional ink. The treatment does not ask a reader to infer that greater brightness means a more truthful answer.

### Motion that gathers and settles

The phone feedback exposed a structural issue: an inline width can ease smoothly while a line wrap still occurs in a single frame. The 8 September implementation also changed parent groups when candidate whitespace changed, restarted its breathing rows, and stacked a reel, blur, bounce and sentence ripple on the same events. Its nine-second desktop measurement reduced mean motion from 3.69 to 2.38 px per legible cell per frame, but its largest frame remained approximately 101 px. That historical result did not solve phone reflow or establish reader benefit.

The revision replaces changing candidate widths with fixed reservations and keeps each source token mounted through candidate replacement, word completion and passage release. Multi-token words retain their token children; release changes their styling rather than replacing them with a new passage tree. Source text and presentation state are separate: committed glyphs are readable immediately, including while feedback is playing. There is no reel entrance, letter-by-letter blur, bounce or reading-order ripple.

**Suspended.** An unresolved region has a persistent 5.6-second decorative breath, with opacity moving between 0.12 and 0.20. Four region phase groups start at negative offsets, so the breath is present immediately and does not form a traveling wave. These are authored settings, not research-derived optima.

**Gathering.** Source updates change their own positions. Short fitting drafts remain still; candidate spelling and guessed whitespace cannot repeatedly rearrange the reading area. Several regions may develop together, exactly when the source supplies them.

**Settling.** A newly complete word can receive a 200 ms local afterglow. A newly released passage receives one 400 ms local afterglow and transitions to released ink within the brand’s 0–240 ms onset where the palette uses a distinct available ink. Product bubbles retain primary ink and remove the available-state underline. Simultaneous changes are processed together. Feedback is suppressed when a significant relocation is occurring and never gates readability or release.

**Resting.** Earlier released text receives no repeated response. The ambient layer pauses when presentation pauses or becomes hidden and ends at a terminal state. Reduced motion and the explicit motion-off control preserve static state distinctions and the same source timeline.

Necessary small layout moves are coordinated in a single measurement-and-write transaction, using a 320 ms translation from the current visible position. Large reflows place committed text immediately at its authoritative location rather than flying it diagonally across the phone. That is a legibility choice, not a claim that the displacement has vanished. Exact final layout is still unknown; large jumps remain part of the validation surface.

The three product previews now use the recorded source clock, correcting a previous scale of 2 that ran twice as fast despite “half pace” copy. The separate concept phone already used the recorded clock. The phone answer bubbles now hold their width while text forms. Playback controls sit above the growing answer, and preview replay controls sit above the frames, so growth does not move a control away between pointer-down and activation. Replay controls label half and twice recorded pace accurately; changing replay speed is not a claim about production inference.

### Why this belongs to diffusion

Masked diffusion can update many positions together. The renderer responds locally to the locations and timestamps actually supplied, without inventing a left-to-right reveal. LLaDA distinguishes parallel masked prediction from sequential progression between blocks; the design reflects both patterns, including steps that commit just one position. [Nie et al., section 2.4 and Appendix B.4](https://arxiv.org/html/2502.09992v3)

A numbered list can visibly develop in several places. Independently releasing its items additionally requires known structural ranges, explicit completeness signals and a semantic release policy. The current global-prefix reducer does not implement independent list finality. A guessed newline, token probability or final-answer lookup cannot establish it, and the prototype claims no speed multiplier for lists.

The closest research supports testing this direction. Caption stabilization motivates reducing disturbance, simple chart transitions motivate preserving identity, and rereading research motivates keeping earlier words available. None validates this exact diffusion treatment. The completion cue is intended to feel satisfying; no dopamine response, comprehension gain or preference improvement has been measured. [Liu et al.](https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/), [Heer and Robertson](https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf), [Schotter et al.](https://journals.sagepub.com/doi/10.1177/0956797614531148)

The engineering verification and reader study answer different questions. Rendering tests can establish exact text, causal availability, identity preservation and idle behavior. The unrun reader comparison must test layout fixes alone against layout fixes plus ambient and completion feedback, with identical source events. It must include narrow phones, place loss, comfort, qualification accuracy and provisional-as-final mistakes. [Implementation and validation record](motion-direction-2026-09-09.md)

### The voice

A brand gets five tokens on the one surface, each inside a range that is an invariant:

| token | range | changes | keeps |
|---|---|---|---|
| mark | tick, dot, dash, square | the glyph of a cell and of the margin mark | every state legible |
| bloom | 0 to 1 | local word and passage afterglow strength | 200 ms for a word, 400 ms for a passage; earlier text does not replay |
| onset | 0 to 240 ms | transition from available to released ink | readable immediately; zero onset and reduced motion remove completion treatment |
| tempo | 0.7 to 1.4 | the breath of the margin mark | rest at every terminal state |
| grain | 0 to 1 | secondary-ink distinction where the background permits it | product bubbles use primary ink and an underline; contrast is checked on the actual background |

Five presets ship: After Tokens (tick), Halcyon (dot, slow, soft), Felt (square, heavy bloom), Pulse (dash, calm), Voltage (tick, no bloom, no onset).

### By the numbers

The cost of each policy over all sixty recordings, on the uniform step clock (one completed forward pass per step) and the raw forward-pass clock of the capture machine (about 119 ms per step for a 0.6B model on a laptop). Production latency and commit patterns require separate measurement on the actual model, sampler, hardware and transport; these seconds are not a universal speed multiplier:

| measure | each word | each sentence | each paragraph |
|---|---|---|---|
| first passage on the page, median | 12 steps · 1.4 s | 39 steps · 4.6 s | 128 steps · 15.6 s |
| extra wait after text is in order, mean | 3.3 steps | 24.5 steps | 44.7 steps |
| of which the word rule alone | 3.3 steps | 3.3 steps | 3.3 steps |
| forming text visible, median share of the run | 0% | 90% | 90% |
| passages per answer, median | 16 of 8 characters | 3 of 107 characters | 1 of 414 characters |
| exact final output | 60 of 60 | 60 of 60 | 60 of 60 |
| characters drawn before commitment | 0 | 0 | 0 |

Margin held the in-order text invisible until its sentence closed and paid the whole hold in blankness. Settle releases the page on the same boundary at the same moment, so the page's wait is identical, and draws the held text dim beneath it for 90 percent of the run. The word rule, which keeps incomplete words off the released page, costs 3.3 steps on average.

The drafts, over the same recordings (content positions of every recording with at least eight content tokens; a pair is one open content position at one step; at the display floor, under the source display policy before the new width-fit check; accuracy by decoded text):

| measure | value |
|---|---|
| a draft is eligible, share of open-position steps | 0.1699 |
| an eligible draft matches the token that later commits | 0.6657 |
| steps with at least one eligible draft | 0.9272 |
| steps a draft qualifies before commitment, median | 8 |
| eligible drafts that never change again before commitment | 0.6145 |

| by sampler | lowconf-b32 | random-b32 | lowconf-b128 |
|---|---|---|---|
| a draft is eligible, share of open-position steps | 0.1301 | 0.1915 | 0.3115 |
| an eligible draft matches the token that later commits | 0.6103 | 0.718 | 0.5756 |
| steps of polish before the position commits, median | 4 | 14 | 11 |
| eligible share, first tenth of the run to the last | 0.036 to 0.623 | 0.098 to 0.801 | about 0.3, then 0.537 |
| adjacent-position probability change on the next step | 0.1096 (n = 1074) | 0.175 (n = 2121) | 0.1264 (n = 77) |
| next-step change at other open positions | 0.0067 | 0.0048 | 0.0022 |

About two thirds of the eligible drafts match the token eventually committed at that position. The larger next-step increase at adjacent positions is an association in these recordings, not an experimentally established causal effect of one word on another. Raising the floor buys accuracy with silence (0.227 of pairs drawn at 0.565 accuracy at a floor of 0.15; 0.153 at 0.705 at 0.25; 0.134 at 0.752 at 0.3; 0.086 at 0.878 at 0.5), and 0.25 keeps the one floor the piece already used. None of these numbers says that drawing a draft helps a reader.

## Process and decisions

- **A causal source before a visual system.** The first reveal used final text and geometry. The audit’s findings were reproduced; Settle retained the reducer, explicit finality, release policies and cost instrument.
- **Show the unresolved interval.** Margin hid all text waiting for a passage boundary. Settle makes committed forming text and source drafts visible in distinct registers. People may read those regions; calling them provisional does not exempt them from legibility or motion constraints.
- **Reject animation as a substitute for layout.** The 8 September reels combined width glides, rolling candidates, per-letter blur, bounce and a sentence ripple. Slower width interpolation reduced average movement in one measurement while leaving its largest jump almost unchanged. The motion revision addresses the geometry and reduces each real event to one response.
- **Keep the local source order.** Several complete words supplied together become readable together. The design adds no reading-order stagger, no hidden answer map and no claim that all list items must resolve in parallel.
- **Distinguish evidence from craft.** Caption stability, rereading and simple chart transitions motivate the experiment. They do not prove that a particular breath or settling duration improves reading. The dopamine claim, tension budget and closure bonus are absent from the product’s claims.
- **Retain the history.** The rejected cursor, motes, light bands, reels and width experiments remain in [the design record](redesign.md), labeled as earlier iterations. Their descriptions are not the current renderer specification.

## Validation

A controlled geometry observation compared revision `55ff175` with the revised renderer in Chromium at 390 × 844, replaying `weather__random-b32` at the recorded clock for 18 seconds, once per condition. The revision produced zero observed token remounts, zero frames with blurred or faded committed text, and zero released-glyph movement across 58,432 matched samples. **The worst identical committed-glyph displacement did not improve: 280.6 px after versus 276.5 px before.** Large provisional wraps remain. The sampled revision preceded the final editorial and accessibility refinements. This single-trace observation is neither reader validation nor a physical iPhone benchmark. [Machine-readable measurement, definitions and limits](motion-validation-2026-09-09.json)

Release checks passed: lint, type checking, 244 tests across 36 test files, the production build and the GitHub Pages static build. The full browser run passed all 21 checks across Chromium, WebKit and iPhone 14 emulation in 1.9 minutes. Emulation does not establish physical iPhone performance.

Browser QA also changed the surrounding interaction. The Felt product bubble’s translucent background exposed insufficient contrast in the secondary mix, so product bubbles now keep committed glyphs in primary ink and distinguish unreleased text with a dotted underline. Cost and voice tables are labeled, keyboard-scrollable regions. These are implementation corrections, not reader-study results.

Four claims about the repository, each tested: across all sixty recordings and three policies, zero characters reach the page before their tokens commit (a throwing-getter test proves the adapter never reads the answer); every final page equals the sampler's output to the character; a draft changes no page text, no prefix and no passage, a commitment ends the guess at its position, and a completed answer holds no drafts; and the cost of each policy, and what the drafts do, are reported per run with denominators from the recordings themselves.

Nothing is claimed about a reader. The study is designed as two labeled experiments: an availability-faithful comparison under identical source events, and a matched-duration comparison to isolate preference. Conditions: the raw prefix, each word, each sentence with forming text, each sentence without it, each paragraph, counterbalanced within participants. Primary outcomes: qualification accuracy and time to a correct usable answer. Guardrails: false-answer acceptance and truth discrimination. Sample size from a pilot and a prespecified smallest useful effect. No participants have been recruited.

## Impact and limits

What is implemented: the causal reducer and release contract, recorded-source adapter, a persistent field with fixed candidate reservations, immediate committed text, local word and passage feedback, ambient decoration, motion controls, brand tokens, the cost instrument, a corrected literature ledger and a reader-study plan. What is not established: improved reading, satisfaction, trust calibration or zero reflow. What is not integrated: a live model endpoint, full Markdown, independent list-item finality, scripts without word spacing, or reversible samplers beyond the snapshot path. The corpus is one small model on one machine. The strongest counterargument—that holding passages costs more than stability returns—remains open until the study runs.

## Reflections

The most useful turn was separating three questions: what the source actually knows, where text can safely stay, and what motion should acknowledge. A causal reducer answers the first. Layout and release policies answer the second. Motion has a smaller, clearer role: make a real state change perceptible, then let the reader keep their place. The prototype is a specific synthesis of those decisions, not a claim to have established a new psychological effect or historical priority for animated diffusion text.

## Further exploration

A live sampler on the other end of the adapter; a field for reversible samplers; keyed blocks for Markdown and code; segmenters for scripts without word spacing; a unit smaller than a passage for structured answers; and the study.

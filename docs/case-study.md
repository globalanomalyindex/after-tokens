# After Tokens: a causal reading surface for diffusion text

**A product design and engineering case study**

| | |
|---|---|
| Role | Product design, interaction design, prototyping, front-end engineering (solo, with Claude as design and engineering partner; the causal audit and the first implementation of the reading contract by Codex, 7 September 2026) |
| Timeline | May to September 2026 |
| Status | A concept exploration in a working prototype; the cost measured on sixty recorded runs; untested on readers; a two-experiment study designed |
| Live | https://after-tokens.vercel.app · source: https://github.com/globalanomalyindex/after-tokens |

## Overview

Diffusion language models do not write. They hold every position of an answer open at once and commit positions in the order they are sure of them, over a hundred or so denoising steps. Every chat product renders that process with a typewriter inherited from models that write one token at a time, and the typewriter misrepresents it twice: it draws the answer in an order the sampler did not use, and it puts half-formed words under the reader whenever a token is a piece of one.

After Tokens asks how an answer from this kind of model should reach a reader, and answers with a system called Settle. An answer has two surfaces and a margin. The page holds released passages as ordinary, still, selectable text. The field is carved into the text after it: an open position reserves blank space, an open position the model already has a confident guess for shows that guess as a draft in a ghost that sharpens with its probability, a committed piece of a word stands as the piece it is, and a word snaps in where it will stand, dim, the moment every piece of it is in, in the sampler's own order, while the zone shortens from the tail as the model decides the answer's length. A companion, a small soft body in the brand's color, hovers over the part of the answer that is still open and sends a few motes to each word as it is written. Between the page and the carved zone, the forming text: committed, in-order, word-complete text that has not yet completed a passage, brighter, brightening into the page when it does. The margin says what the source is doing, in words, beside a mark whose shape, bloom, breath and hue are a brand's.

The claim is narrow and testable: under this contract nothing reaches the page before the model commits it, nothing committed is drawn as a guess and nothing guessed is drawn as committed, every final output is exact, and the cost of waiting for complete passages is measured rather than argued away. Whether the surface helps a reader is a hypothesis with a study designed to break it.

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
- At every step the model already holds a guess for every position it has not committed. At the 0.25 floor the surface draws at, a guess is on screen for 17 percent of open-position steps and is the token that later commits two thirds of the time, and a commitment lifts the confidence of the positions beside it by more than an order of magnitude over the rest of the answer.

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
| visible process and explained waits (Buell and Norton, 2011; Maister, 1985; Zhang et al., 2024) | showing work raises perceived value when the result is good and lowers it when the result disappoints; unexplained and uncertain waits feel longer | the field shows what the sampler has done and why the page waits, and it never encodes confidence or correctness |
| pacing at linguistic boundaries (Zhu et al., CHI 2026; Tan and Nov, CHI 2026; forthcoming, citation details only moderately confirmed) | streaming paused at clause boundaries rated less demanding; an instant answer rated less thoughtful than a short visible delay; both stream left to right | the page takes whole sentences; the forming text and field carry the delay |
| Zeigarnik effect (Ghibellini and Meier, 2025, meta-analysis) | the memory advantage for interrupted tasks does not replicate as a general effect | retired; the first version's tension budget is gone |
| gestalt closure (Elder and Zucker, 1994) | concerns contours of shapes | retired; a passage boundary is a linguistic rule, chosen and priced |
| peak-end (Alaybek et al., 2022; contested for mild experiences) | endings matter, and so does the average | kept only as: end quietly, at a real terminal state |
| fluency and truth (Reber and Schwarz, 1999, a small early demonstration with color contrast; Alter and Oppenheimer, 2009) | easier-to-process statements are judged more likely true | a guardrail: the study measures false-answer acceptance |
| motion that carries mass (Lasseter, 1987; Thomas and Johnston, 1981; Chang and Ungar, 1993) | craft arguments and a design paper with no user study: squash and stretch defines an object's rigidity and mass, and solidity and reinforcement make an interface's changes easier to follow | the companion is a body with mass that leans, squashes and stretches along its own velocity, and the snap is one short settling; nothing is claimed as measured benefit |
| motion in the periphery (Bartram, Ware and Calvert, 2003) | motion beside a primary task is detected far better than a color change; traveling and zooming icons were rated most distracting, slow linear motion and slow blink least; distraction was self-reported, on notification icons beside a task rather than on text | a guardrail: nothing blinks, the companion drifts slowly on a soft spring, and the motes it sends are small, few and brief |
| animated transitions (Heer and Robertson, 2007) | animated transitions beat abrupt changes for tracking objects and judging change; simple staging helped a little and was preferred, heavy staging hurt; measured on charts rather than on text | every change of width in the zone is a slide, a word opens from the space it held, and nothing is staged in several steps |

No study tests non-sequential text arrival. No published design guidance for rendering diffusion text was found. Both gaps are part of why the work exists.

## The insight

A diffusion sampler produces two kinds of fact at every step. It commits tokens, at positions, irreversibly. And by committing, it reveals the shape of the answer: how long it is, where it is settled, where it is still open. A typewriter can show only the first kind. Crystallize invented the second kind from the answer key. Margin threw the second kind away.

The insight is that each kind of fact has a place a reader can use it. Committed, in-order, complete text belongs on the page, where it must hold still. The shape belongs beneath the page, as state and never as text, where it can move freely because nothing there is read. The boundary between them, the forming text, is the only place the two meet, and it is real text from the sampler that never changes once drawn.

## Design principles

1. **Draw only what the source has, drawn as what it is.** Committed text is drawn as committed, the source's own current guess is drawn as a guess, and no guess reaches the page. No final-text lookup, no reserved widths, no map of salience, no forecast of length.
2. **The page holds still.** Text on the page never changes, moves, blurs or reweights. A passage arrives once, whole.
3. **Show the process where it is real.** The field is the sampler's own positions and the sampler's own guesses at them. What is authored is the floor a guess must clear, how it is drawn, and the words for the phase.
4. **Price every wait.** A policy that holds text is measured on every recording, per clock, with denominators.
5. **Brand outside the words.** A voice changes cells, marks and onsets. It never changes when text is available.

## The solution: Settle

### The contract

Given the same events, the surface shows the same page, the same forming text, the same field and the same status, whatever comes later. Ten rules make that true, kept by a pure reducer:

1. Nothing is drawn as the source's text that the source has not committed. The one thing an uncommitted position may draw is the source's own current guess for it, drawn as a guess.
2. A word is drawn only when it is complete. A token whose successor is uncommitted is held, because it may be the first piece of a longer word. A boundary exists when the next committed token begins with whitespace, the token itself ends with whitespace, or the next position is a committed end.
3. Text on the page never changes, moves or reflows. When a sentence closes, the page's ink settles through its words' letterforms, bottom to top, in one movement; their shapes and places do not change. The zone after the page reflows as blanks, drafts and pieces become words, each position's width sliding from what it last drew to what it draws now. An available word is drawn in a secondary ink that clears 4.5:1 on both of the brand's grounds.
4. The page grows by whole passages under a policy: each word, each sentence, or each paragraph. No timeout relabels a fragment as complete; finality releases the exact remainder.
5. Out-of-order text appears only after the page, never inside it. An open position is reserved blank space; a confident guess at one is drawn as a draft, in a ghost that sharpens with its probability; a committed piece of a word is drawn as the piece it is; and a word is written where it will stand, in the secondary ink, only after every piece of it has committed, snapping in where it stands. The companion that answers it stays in the answer's open space and sends motes to the word; it never sits on a line of text, and no mote precedes a commitment.
6. An exact length is claimed only when the prefix reaches a committed end token; a committed end token anywhere bounds the answer to before it, and nothing past it is drawn.
7. Revisable snapshots stay off the page until one is explicitly final. A later revision keeps the prior page and offers a review and apply action.
8. Complete, stopped, error, paused and revision available are distinct states, named in the margin.
9. A brand changes appearance and motion envelopes, never availability.
10. Reduced motion removes the breath, the bloom, the onset, the snap, the drafts' lift and breath, and the companion's drift, wisps, motes, ring and dissolve, and nothing else. The companion is placed at its home and words are drawn sharp at once. What is drawn, and when, is identical.

### The field

The field is carved into the text. Every position after the word-safe prefix is drawn as what the sampler has made of it: reserved blank space while it is open and unguessed, the model's own current guess where it holds one worth drawing, the piece itself when a piece of a word is in and the rest is out, the word, dim, once every piece and its boundaries are in, and one end mark where the sampler has marked the end. Words appear across the zone in the sampler's own order; the zone shortens from the tail as the model decides the length; the page sweeps over the solved part. A word's progress is its register, carried by the word where the reader is looking. Under the block sampler the zone fills scattered inside a block, then a clause joins the page at once. Under the schedule-free sampler it is carved down from the tail for a hundred steps, then the words land in the last few, then the sentence settles onto the page. A strip of one cell per position beneath the page is the field's compact form, for a product that wants the text zone quiet. Either replaces the three bouncing dots with a loading state that says what is happening, where the answer will be. The margin names the phase the answer is in, read off the same field: the positions it can still occupy are the ones up to the lowest committed end, else the request's bound, and the committed share plus half the drafted share puts the answer in sketching, drafting, polishing or closing. It reads "receiving · drafting · 20 of 128 settled", and it is a description of the state that promises nothing about what comes next.

### The draft

The recordings hold, at every denoising step, the model's provisional argmax for every position it has not committed, with that guess's probability. Those are the drafts, and they are what makes the wait watchable: the answer goes from a rough draft to a polish to a final, in the model's own order, with nothing invented. A guess is drawn once its probability reaches 0.25, the one floor the piece already used, in a ghost of the secondary ink whose opacity and sharpness follow the probability. It keeps being drawn while its text holds, so a guess sitting at the floor does not blink. It is drawn only where a reader can place it, so a guess that continues a word waits for letters before it to attach to, and a guess that the answer ends here is kept in the state and draws no mark, because the cut already says where the answer ends. When the model changes its mind, the draft reconsiders, once per change. A commitment ends the guess at its position, a completed answer holds none, and no guess ever reaches the page. The line the audit demanded now runs in both directions: nothing committed is drawn as a guess, and nothing guessed is drawn as committed.

### The companion

The companion is a small soft body in the brand's color, a core whose outline changes shape slowly with two wisps turning around it: a small cloud, bone on the dark stage and cobalt on the phone. It lives in the answer's open space and never sits on a line of text. Its home is measured a few times a second, every 160 ms: horizontally at the middle of what is still open in the zone, the blank space and the drafts, and vertically in the gap 0.85 em under the last line written; over the first open slot while nothing is written yet; at the end of the page once the source is done. It reaches home on a soft spring, stiffness 13 and damping ratio 1, about a second with no overshoot, so as the answer fills and the open part moves the body drifts after it. While it waits it wanders on two slow sinusoids, about 4.5 px over periods between 3 and 6 seconds, and breathes on the brand's breath period. It stretches a little along its own velocity when it moves, up to 1.32 times, volume preserving, and rounds up as it stops.

It never goes to the words. When a word is written, every piece of it and its boundaries committed, the body sends three motes there, 45 ms apart, along a shallow arc that alternates sides, each flying 260 to 440 ms by distance, 0.3 em across and brief; it leans 7 px toward the word for 420 ms and squashes for 220 ms as it fires. The word stands soft, a 1.4 px blur and a slight sink, until the first mote lands, and then it snaps in: the 340 ms settle of blur to sharp, a rise, and a glow of the accent around the letters. Its color never changes through any of it, so a written word clears the contrast floor at every frame. Several words settling at once get several beams at once, which is what a sampler filling positions in parallel looks like. Where a mote cannot be sent, because the surface is off screen or the pool of 36 is exhausted, the word snaps at once. When a sentence closes the body rings once, over 640 ms, and a phone that can tick, ticks; when the source is done it swells, softens and dissolves over 1.1 s.

Three arguments hold it together. Slow motion in view is the least distracting kind and blinking the worst (Bartram, Ware and Calvert, 2003, measured on notification icons beside a primary task), so the body drifts rather than darts, the motes are small and brief and few, and nothing here blinks. Squash and stretch and follow-through are what give a drawn body mass and intent (Lasseter 1987, on the principles the Disney studio developed in the 1930s), and solidity in interface objects was argued for on the grounds that changes are easier to follow (Chang and Ungar 1993), so the body leans, squashes, stretches with its velocity and never teleports. And ambient looping motion is normally to be avoided: the published guidance is to use a static treatment unless a pulse is explicitly asked for (Emil Kowalski). Here it was explicitly asked for, so it carries a guardrail: the loop runs only while the surface is on screen and the recording is playing, pausing the recording holds the body, the wisps and the breath still, and reduced motion places the body at its home, sends no motes, and removes the wisps, the ring, the breath, the lift and the dissolve. What is drawn, and when, is identical either way.

Nothing here is claimed to help a reader. The motes are decoration attached to real commit events, and no beam ever precedes a commitment.

### The voice

A brand gets five tokens on the one surface, each inside a range that is an invariant:

| token | range | changes | keeps |
|---|---|---|---|
| mark | tick, dot, dash, square | the glyph of a cell and of the margin mark | every state legible |
| bloom | 0 to 1 | how much a cell flares when it commits | gone within 240 ms |
| onset | 0 to 240 ms | the opacity ramp of a passage arriving | never a transform, never a blur, zero under reduced motion |
| tempo | 0.7 to 1.4 | the breath of the margin mark | rest at every terminal state |
| grain | 0 to 1 | how faint open cells rest, how far the secondary ink sits from the page's | available words at least 4.5:1 on both of the brand's grounds |

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

The drafts, over the same recordings (content positions of every recording with at least eight content tokens; a pair is one open content position at one step; at the display floor, under the rule the surface uses; accuracy by decoded text):

| measure | value |
|---|---|
| a draft is drawn, share of open-position steps | 0.1699 |
| a drawn draft is the token that later commits | 0.6657 |
| steps with at least one draft on screen | 0.9272 |
| steps a draft shows before its position commits, median | 8 |
| drafts that never change again once drawn | 0.6145 |

| by sampler | lowconf-b32 | random-b32 | lowconf-b128 |
|---|---|---|---|
| a draft is drawn, share of open-position steps | 0.1301 | 0.1915 | 0.3115 |
| a drawn draft is the token that later commits | 0.6103 | 0.718 | 0.5756 |
| steps of polish before the position commits, median | 4 | 14 | 11 |
| drawn share, first tenth of the run to the last | 0.036 to 0.623 | 0.098 to 0.801 | about 0.3, then 0.537 |
| a commitment's lift on a neighbor's probability | 0.1096 (n = 1074) | 0.175 (n = 2121) | 0.1264 (n = 77) |
| the same lift on every other open position | 0.0067 | 0.0048 | 0.0022 |

Two thirds of what the surface draws as a guess is the word that later lands there, and a commitment lifts the confidence of the positions beside it by more than an order of magnitude over the rest of the answer: one word settling raises the confidence of the positions beside it, and the surface shows that happening. Raising the floor buys accuracy with silence (0.227 of pairs drawn at 0.565 accuracy at a floor of 0.15; 0.153 at 0.705 at 0.25; 0.134 at 0.752 at 0.3; 0.086 at 0.878 at 0.5), and 0.25 keeps the one floor the piece already used. None of these numbers says that drawing a draft helps a reader.

## Process and decisions

- **Crystallize to Margin to Settle.** The first version optimized a reveal it could not produce live. The audit was accepted in full. Margin's reducer, event contract, boundary rules, revision handling and cost instrument were kept as the reading surface. Margin's conclusion, that the answer should carry no trace of the process, was rejected, along with a brand surface that consisted of a 7-pixel bracket in three colors.
- **The forming text.** Margin's waiting cost came entirely from holding in-order text invisible. Drawing it dim, as real text that never changes, keeps the page still and removes the blankness. It is not selectable and it is hidden from assistive technology, because it is not yet a place to read.
- **The word rule.** The audit's 18 percent is the case for it. The rule reads whitespace at token boundaries and costs 3.3 steps on average.
- **The field instead of ghost words.** The old surface showed the shape of the answer with illegible blurred slots at final width, which required the final answer. The field shows the same shape from the sampler's actual positions, which requires nothing.
- **The draft register.** The zone was honest and empty: reserved blanks between written words, with nothing in them to watch. The recordings already held the model's guess for every open position at every step, so the zone shows it, above a floor, as a guess. It is the difference between watching an answer appear and watching it be written.
- **The snap and the piece.** A committed piece of a word is drawn as the piece it is, because its letters are facts, and the old glimmer drew none of them. The word's completion is the one event in the zone worth marking, so the word snaps in where it stands, in 340 ms, and its width slides from the width its positions actually held to its own, so the line moves instead of jumping.
- **A companion in the open space.** The earlier cursor sat on the lines, darted to each committed word and jittered on a phone, and the answer appeared under it left to right, which is the shape the piece exists to argue against. The companion stays in the free space of the answer, drifts after the part still open, and answers each written word with a few motes instead of a journey. The home rule, the spring, the wander, the arc and the timings are authored; the commitments the motes answer are the source's.
- **Retired.** The tension budget, the salience map, the nucleus, the two-channel reveal, the arrival profile as a design instrument, the exhale, the "length fixed" label, and the 540 ms and 36 percent figures. The legacy engine is kept as a labeled retrospective reference the audit compares against.
- **The nature anchor.** Sediment settling in a column of water: the clear zone grows from the top down as the suspension drops out. The page is the clear zone, the field is the suspension, and the rule is to wait for the water to clear before reading it, while being able to watch it clear.

## Validation

Four claims about the repository, each tested: across all sixty recordings and three policies, zero characters reach the page before their tokens commit (a throwing-getter test proves the adapter never reads the answer); every final page equals the sampler's output to the character; a draft changes no page text, no prefix and no passage, a commitment ends the guess at its position, and a completed answer holds no drafts; and the cost of each policy, and what the drafts do, are reported per run with denominators from the recordings themselves.

Nothing is claimed about a reader. The study is designed as two labeled experiments: an availability-faithful comparison under identical source events, and a matched-duration comparison to isolate preference. Conditions: the raw prefix, each word, each sentence with forming text, each sentence without it, each paragraph, counterbalanced within participants. Primary outcomes: qualification accuracy and time to a correct usable answer. Guardrails: false-answer acceptance and truth discrimination. Sample size from a pilot and a prespecified smallest useful effect. No participants have been recruited.

## Impact and limits

What shipped: a pure reducer and its contract, a replay adapter that cannot read the answer, a field derived from state, the model's own drafts drawn as drafts, a companion that lives in the answer's open space and sends motes to each word as it is written, a five-token voice with invariants, a cost instrument that measures every policy on every recording, a corrected literature ledger, and a study design with its stimuli. What did not: any measurement of a reader; a live model on the other end; support for scripts without word spacing, for rich Markdown, or for samplers that remask committed tokens beyond the snapshot path. The corpus is one small model on one machine. The strongest argument against the design, that waiting costs more than stillness gives back, stands until the study runs.

## Reflections

The turn this time was to accept an audit of my own work in full and then refuse its conclusion. Margin was right about every fact and wrong about what to do with them, because it treated the process as something to hide rather than something to place. Once the two kinds of fact a sampler produces had two places on the surface, most of the earlier design fell away on its own, and what remained is simpler than either version it replaces, and the first whose every visible pixel can be traced to an event.

## Further exploration

A live sampler on the other end of the adapter; a field for reversible samplers; keyed blocks for Markdown and code; segmenters for scripts without word spacing; a unit smaller than a passage for structured answers; and the study.

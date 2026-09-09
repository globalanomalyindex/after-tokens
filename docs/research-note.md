# How a masked diffusion language model commits its answer, and what an interface should do about it

**Historical scope:** the feathered ambient implementation and its verification below belong to revision `05914c1`. The latest solid-bar material is documented in the [skeleton motion study](skeleton-motion-study-2026-09-09.md) and [skeleton handoff](skeleton-handoff-2026-09-09.md). Their fresh validation is separate; this record is preserved rather than relabeled.

Christopher Robin Fiore. After Tokens project, 2026.

**Latest implementation, 9 September 2026:** the default prototype now uses an authored ambient bar composition and waits for the whole answer. The original 60-trace methods and earlier renderer findings below remain a historical research record; they do not measure the new motion. See the [current experiment and research rationale](field-experiment-2026-09-09.md), [implementation handoff](ambient-handoff-2026-09-09.md), [four new batched source captures](../data/experiments/README.md) and [whole-answer availability cost](../data/experiments/answer-policy-cost-2026-09-09.json). The latest revision passes lint, types, 268 tests across 40 files and 42 browser checks across Chromium, WebKit and iPhone 14 emulation. Eight rendering observations and both production builds are complete; reader benefit and physical iPhone behavior are unvalidated.

## Abstract

Masked diffusion language models generate text by iteratively unmasking positions in parallel. The order does not run left to right, and interfaces built for them are usually authored guesses about what that process looks like. This note reports sixty recorded denoising trajectories from a real masked diffusion model (0.6 billion parameters, instruction tuned, greedy decoding) across three sampler configurations, and measures how commit order relates to reading order, how far apart consecutive commits land, how often the model's provisional guess for a token changes before it commits, and how confident a commit actually is. The default sampler configuration, low-confidence remasking inside a fixed block schedule, turns out to be nearly sequential at the macro level. The block schedule is why; the confidence rule alone would not produce it. Removing the schedule collapses that order. These are measurements of one sampler on one model. They are offered as a stimulus for the separate, unresolved question of whether any particular reveal helps a reader.

## 1. Background

Masked diffusion language models replace autoregressive next-token prediction with iterative denoising over a masked sequence: every position starts masked, and each step reveals (unmasks) some positions based on a remasking rule, until none remain. LLaDA demonstrated this approach at scale with a low-confidence remasking rule inspired by the original masked diffusion formulation (Nie et al., arXiv:2502.09992). The MDLM objective that many of these models train against, including a randomized unmasking order as one of its samplers, was formalized by Sahoo et al. (arXiv:2406.07524). Dream 7B is a further diffusion language model release at a larger parameter count, trained with a similar objective. dLLM (arXiv:2602.22661) surveys the broader diffusion language model landscape and its samplers. The model used here, `dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1`, is documented on its Hugging Face model card as a Qwen3-0.6B base model adapted to the MDLM objective and instruction tuned, released under the Apache 2.0 license.

An interface that wants to represent this generation process honestly needs to know what the process actually looks like: in what order positions commit, how confident each commit is, and how the model's guess for an uncommitted position behaves before it settles. Absent that, any reveal timeline is an authored guess. That is the gap this note closes for one model and three samplers.

## 2. Method

`scripts/capture-trajectories.py` runs the model against 20 short prompts (covering explanation, summarization, poetry, brainstorming, factual recall, rewriting, and code debugging) under three sampler configurations, for 60 trajectories total:

- `lowconf-b32`: LLaDA-style low-confidence remasking inside four blocks of 32 positions each, the model card's default.
- `random-b32`: the original MDLM random unmasking order, inside the same four-block schedule.
- `lowconf-b128`: low-confidence remasking with no block schedule, one global field of 128 positions.

All three configurations use greedy decoding (temperature 0) and run for 128 denoising steps to generate 128 new tokens, so every step commits exactly one position and the step index doubles as that position's commit rank. Within a block schedule, each block's steps are spent only on that block's positions before the next block opens.

At every step the script records, for every still-masked position, the model's current argmax token and its max softmax probability, and it records which position (or positions, outside the one-per-step case) committed that step and at what probability. It also records wall-clock milliseconds for the forward pass. A position's provisional guess is compared step to step, and a flip is counted whenever that guess changes before the position commits.

Generated content is defined as the tokens before the first end-of-sequence token; everything from that point on is the tail. Content tokens are mapped onto whitespace-delimited words, the unit the interface renders, by decoding the token sequence progressively to get each token's character span and assigning a token to a word when their spans overlap. A word's lock step is the maximum (latest) commit step among its overlapping tokens.

Statistics are computed over content tokens only, tail excluded unless named:

- **kendall_tau_step_vs_position**: the rank correlation between commit step and reading position. +1 means commits proceed strictly left to right, 0 means no relationship, negative means right to left.
- **mean_jump**: the mean distance in positions between consecutive commits, compared against `expected_random_jump`, the value a uniformly random commit order would give for a sequence of the same length.
- **adjacent_commit_fraction**: the share of consecutive commits that land on a position adjacent to the previous one.
- **median_commit_conf** and **low_conf_commits_frac**: the model's softmax probability for the committed token at the moment it commits, and the share of commits made under 0.5 probability.
- **mean_flips_per_token** and **tokens_with_any_flip_frac**: how many times a position's provisional argmax changed before it committed, and what share of tokens changed at least once.
- **tail_before_last_content**: whether every end-of-sequence and padding position committed before the last content token did.

## 3. Results

Order statistics require at least 8 content tokens per trajectory (`min_content_tokens_for_order_stats` in `data/traces/summary.json`), since two tokens are trivially in order. `lowconf-b32` and `random-b32` used all 20 trajectories each (`n_used_for_order_stats` 20, `empty_answers` 0, `short_answers_excluded` 0 for both). `lowconf-b128` used 11 of 20 (`n_used_for_order_stats` 11): 3 trajectories came back with no content at all (`empty_answers` 3, the model committing its end-of-sequence tokens before any content), and a further 6 fell under the 8-token floor, for `short_answers_excluded` 9 in total.

| statistic | lowconf-b32 (n=20) | random-b32 (n=20) | lowconf-b128 (n=11) |
| --- | --- | --- | --- |
| commit-order / reading-order tau, median [range] | 0.96 [0.84, 0.99] | 0.75 [0.70, 0.76] | 0.38 [-0.33, 0.82] |
| mean jump between commits, median [range] | 2.5 [1.5, 6.7] | 10.8 [9.7, 11.6] | 2.9 [1.9, 3.7] |
| adjacent-commit fraction, median [range] | 0.51 [0.34, 0.67] | 0.07 [0.04, 0.10] | 0.50 [0.35, 0.71] |
| median commit confidence, median [range] | 0.57 [0.43, 0.99] | 0.46 [0.26, 0.97] | 0.76 [0.52, 0.88] |
| low-confidence commit share (p < 0.5), median [range] | 0.38 [0.10, 0.59] | 0.53 [0.25, 0.70] | 0.27 [0.00, 0.50] |
| flips per token, median [range] | 5.34 [2.06, 9.38] | 5.91 [2.61, 8.87] | 4.24 [2.06, 7.91] |
| tail committed before last content token, share of runs | 0.95 | 0.40 | 1.00 |

Median content length also differs sharply by configuration: 109 tokens for `lowconf-b32`, 115 for `random-b32`, and 15 for the 11 usable `lowconf-b128` runs, so the `lowconf-b128` jump and tau figures describe much shorter answers and are not directly comparable in scale to the other two. (The 8.5-token figure sometimes quoted for `lowconf-b128` is `summary.json`'s median over all 20 attempts at that configuration, including the 3 that returned no content and the 6 more excluded from order statistics for falling under the 8-token floor; it describes a different, larger population than the 11 usable runs and should not be read as their median.)

The paired comparison, run on the 11 prompts with enough content under all three configurations on `data/traces/summary.json`'s `paired` array, is consistent: in every one of the 11 pairs, mean jump under `lowconf-b32` is smaller than under `random-b32` by roughly a factor of four to eight. Tau under `lowconf-b32` exceeds tau under `random-b32` in all 11 pairs, and tau under `random-b32` exceeds tau under `lowconf-b128` in 9 of the 11; in the remaining 2 (`sky-blue`, `research-summary`) `lowconf-b128`'s tau is marginally higher than `random-b32`'s. The block schedule, present in both `lowconf-b32` and `random-b32` but absent from `lowconf-b128`, is what the tau ordering tracks most consistently. The remasking rule alone tracks it less well.

Two further figures, derived from the same traces in `data/traces/derived/` (`scripts/derive-trajectory-models.py`), do more than describe the sampler: they feed directly into the authored engine. Under `lowconf-b32`, a pending position's provisional guess changes a median of every 3.25 steps, which is 387 ms at the recorded per-step pace of 119 ms; the engine's pending-glyph cycle runs at 390 ms, the value adopted from that measurement. And the recorded word-lock cadence, the median lock fraction by word rank under `lowconf-b32`, never departs from a straight line by more than 0.119 (mean departure 0.057). The schedule commits a fixed number of tokens per denoising step; it does not accelerate toward the end.

## 4. Implications for interfaces

Each measurement has a direct design consequence for a reveal grammar.

The default sampler is nearly sequential (tau = +0.96). That is a property of the block schedule; low-confidence remasking by itself does not produce it. Removing the schedule drops tau to +0.38 on the same prompts, and swapping in random order while keeping the schedule only drops tau to +0.75. A reveal grammar cannot assume out-of-order commitment from the sampler family alone. It has to know whether a block schedule is in effect, because that is what produces (or removes) the near-typewriter macro order a viewer will actually see.

Commits cluster around confident anchors instead of scattering uniformly: the median jump between commits is 2.5 positions against roughly 37 for a uniformly random order, and about half of consecutive commits land on a neighbor of the previous one. A reveal that draws growth outward from a handful of seeds matches the recorded process more closely than a uniform scatter or a single scan line.

The sequence's length becomes certain late under both schedules that were measured: it lands close to the last words. Under the default sampler the tail sits inside the final block, so it finishes at roughly the 95 percent mark of the run while the last content word lands at roughly 99 percent. With no block schedule the sampler spends most of its steps on the empty tail before any content commits, and among the usable runs the tail still finishes only at roughly the 92 percent mark. A reveal should not commit to showing final length before the sampler itself has. For both samplers measured here, that commitment comes late.

A position's provisional guess is unstable before it commits, changing a median of 5.3 times per token, and 96 percent of tokens change at least once. Rendering a legible, continuously updating guess for every uncommitted position would show most words wrong several times before showing them right, which was the measured argument for keeping uncommitted content illegible in the first build. The settle surface answers it with a floor instead: a guess is drawn only at or above a probability of 0.25 (section 9.4), where it is on screen for 17 percent of open-position steps, is the token the position later commits two thirds of the time, and never changes again before committing in 61 percent of cases. Below the floor the guess is the corpus prior, and it is drawn as a smear blurred past reading, so the reel at that position visibly turns and no word can be read there (section 9.3).

Confidence at commit is not uniformly high: the median committed token has probability 0.57, and 38 percent of commits happen under even odds. A reveal that renders every commit with the same visual certainty overstates confidence for a substantial minority of words; per-word confidence, which the sampler already computes, is available to drive per-word visual weight.

## 5. Limitations

This is one model at 0.6 billion parameters, one sampler family (low-confidence remasking and random remasking, both from the MDLM/LLaDA tradition), greedy decoding only, twenty prompts, and one machine (an Apple M3 running PyTorch on Metal). No sampling temperature above zero, no nucleus or top-k variants, and no larger model in the same family were tested; a larger model or a different sampler may order its commits differently, and the near-sequential result for the default configuration should not be assumed to generalize past the model and schedule tested here. Order statistics exclude trajectories under 8 content tokens, since two tokens are trivially in order; that excluded 9 of the 20 `lowconf-b128` runs, 3 of which returned no content at all, a known failure mode of removing the block schedule (the sampler can commit its end-of-sequence tokens before any content token). The `lowconf-b128` usable trajectories had a median content length of roughly 15 tokens against over 100 for the block-scheduled configurations, so cross-configuration comparisons involving `lowconf-b128` describe much shorter answers. Every recorded answer carries an audit verdict (`AUDIT_RULE`, `scripts/gen-trace-index.mjs`): `complete` when the model emitted its own end-of-sequence token and the answer ends in terminal punctuation, else `looped`, `short` (under the 8-token floor), `empty`, or `cut`. Tallies: `lowconf-b32` 16 complete and 4 looped; `random-b32` 20 complete; `lowconf-b128` 11 complete, 6 short, 3 empty. The case study's product-facing demos replay a run's order, timing, confidence, and belief timing over a pre-written answer (`lib/diffusion/trace-hybrid.ts`), and label the stage accordingly; the model's own words appear only in the research section, each run with its verdict. A hand audit (`data/traces/curated.json`) then kept 18 of the 60 answers as complete and coherent; the case study's research stage shows only those, and the file names a reason for each of the other 42 (loops, refusals, fragments, empties, contradictions). Four of the twenty `lowconf-b32` answers (`heron-poem`, `lighthouse-haiku`, `sky-blue`, `capital`) fell into a repetition loop: one two- to twenty-word phrase repeated back to back 14, 16, 19, and 5 times, covering 88%, 84%, 77%, and 72% of the answer's words. This is a known failure of greedy decoding in a small model, and no `random-b32` or `lowconf-b128` run showed it. The four runs are kept in every statistic reported here (their order, confidence, and timing are measured like any other run), they replay as recorded in the case study with the loop named beside the stage. The flagging rule (`LOOP_RULE`, `scripts/gen-trace-index.mjs`: a phrase of up to twenty words repeated at least three times covering at least 30% of the words) separates the set cleanly, with every other run at zero coverage. None of this measures whether any reveal built from these trajectories helps a reader read faster or identify model state more accurately; that remains a separate, unresolved study, for which these recordings are a candidate stimulus. They are not a result.

### 5.1 Corroboration at 8B

Four of the coda prompts (`diffusion-explain`, `heron-poem`, `travel`, `weather`) were additionally run through LLaDA-8B-Instruct (Q4_K_S quantization, llama.cpp on Metal) under the same low-confidence remasking, four-block schedule as `lowconf-b32`. Commit order correlated with reading order at τ = +0.90, with a median jump of 3.9 positions against roughly 36 expected from a uniformly random order, and an adjacent-commit fraction of 0.34. Content filled most of the 128 positions (a median of 108 content tokens), so a tail was less often present and the ending-committed-before-last-word share (0.25 here) is not comparable in scale to the 0.6B figure. The block-schedule pattern, a near-sequential macro order with jumps far tighter than random, reproduces at 8B. llama.cpp's step callback exposes commit order and per-step timing (a median of 1504 ms per step at this quantization). It does not expose per-position confidence, so median commit confidence and the flip statistics have no 8B figure here; this set corroborates order and timing. The confidence findings stay at 0.6B only.

## 6. Data and code availability

- Compact trajectories (what the interface loads): `data/traces/compact/<prompt>__<config>.json`
- Full trajectories with per-step probabilities: `data/traces/full/<prompt>__<config>.json.gz`
- Per-trajectory and per-configuration statistics: `data/traces/manifest.json`, `data/traces/summary.json`
- The model's drafts and spins, written into the compact trajectories, and the statistics of section 9.4: `scripts/derive-drafts.py`, `data/traces/derived/drafts.json`
- Schema and capture method: `data/traces/README.md`
- Capture and summarization scripts: `scripts/capture-trajectories.py`, `scripts/summarize-trajectories.py`
- Trace loader and typed accessors used by the interface: `lib/traces/index.ts`, `lib/diffusion/traces.ts`
- Canonical findings and figures cited throughout the case study: `lib/traces/findings.ts`

All of the above are released under the MIT license, in the same repository as the interface itself. Reproducing the capture requires `torch`, `transformers==4.57.0`, and a two-line stub of the `dllm` package that the model's custom code imports only under `__main__`.

## 7 Design changes derived from the measurements

*Describes the crystallize build of 6 September, which the audit of section 9 superseded. The engine remains in the repository as the labeled retrospective reference the audit and the playground compare against; the decisions below are its decisions, kept as history. The references to dopamine and reward in this historical section do not establish a neural response to resolving text and are not evidence for the proposed motion revision. The floor of 0.25 in 7.1 is the one the settle surface still uses (section 9.4).*

The shipped reveal was rebuilt from the glossary principles and the findings together; the reasoning in order is `docs/redesign.md`, and the twelve resulting decisions, each with its source and how its value was arrived at, are the ledger in the case study's hypothesis section (`SYNTHESIS` in `lib/traces/findings.ts`). In brief:

- A pending word is an illegible blur (4.2 px at body size) in a slot of its final width (parafoveal preview; Zeigarnik effect).
- The pending churn runs at 390 ms; the sampler's provisional guess changed every 3.25 steps, 387 ms at recorded pace (Doherty threshold; finding 04).
- The model's guess is shown only above a probability of 0.25. The median probability of a provisional guess at the moment it would be shown is 0.065, the corpus prior, decoding as "the"; about one change in thirty clears the floor (predictive coding; prediction error).
- The gist comes first: each region seeds with its most salient word (list markers and line openings, words that echo the prompt, proper nouns, numbers, long or repeated content words; `lib/diffusion/salience.ts`), and every front leans toward the more salient neighbor, so structure and topic words land before function words (gist: Potter 1976; surprisal: Levy 2008; the information gap). The score is an authored hint; a product would use a saliency model, and a real sampler commits its surest tokens first.
- Words lock in several places at once, each cluster growing outward from its seed: the first step seeds the whole span, and every later commit extends a live front with the jump distribution of the schedule-free sampler (`lowconf-b128`, 51% adjacent) or opens a new seed in the largest gap left. The block schedule that makes `lowconf-b32` read left to right is treated as a product decision the reveal does not inherit (findings 01 and 02; change blindness).
- Commits arrive in steps of several words, about twenty steps per answer, 140 to 260 ms apart after a 320 ms pre-roll, with each step's words landing across a 70 ms spread, the way a multi-token-per-step decoder commits. The average rate is linear, because the recorded cadence is linear within 0.119 of a straight line (finding 01; Doherty threshold); the step count and spread are tuned by eye. Phi decay is retired to the comparison stimulus.
- A lock is crisp at once and heavier; its halo blooms and is gone within 900 ms; the settle overshoot scales with commit probability from 0.5% to 1.5%; a weak commit rests dimmer (von Restorff effect; dopamine; trust calibration; finding 05).
- The field moves as a whole exactly once, at the last lock, which carries the strongest settle (gestalt closure; peak-end rule; finding 03).

### 7.1 A prediction earns rendering only when it is a prediction

The first build of the recorded mode rendered the model's provisional argmax for every open position. Every slot read "the". The argmax of a masked position far from commitment is the corpus prior, and rendering it is true and useless: it injects a prediction the reader must discard. The floor at 0.25 (about four times the median prior) restores the intended behavior, a handful of real beliefs per answer and noise otherwise. On 8 September the argmax returned as the reel below the floor, drawn there as a smear blurred past reading, with the floor still deciding what becomes legible (section 9.3).

### 7.2 The reward grammar

Six further decisions concern how the same answer can feel better rather than read better, each tied to a mechanism from the reward literature: a forming stage before each lock (reward anticipation: Howe et al. 2013; Salimpoor et al. 2011), a snap from ghost to crisp (processing fluency: Reber, Schwarz & Winkielman 2004; the aha effect: Topolinski & Reber 2010), a settle bonus for a lock that closes a gap between settled neighbors (gestalt closure), a receding field and a live count of settled words (goal gradient: Hull 1932; Kivetz, Urminsky & Zheng 2006; endowed progress: Nunes & Drèze 2006; the labor illusion: Buell & Norton 2011), an eight percent long-short swing on the step interval (groove: Witek et al. 2014), and slots of final width with real guesses above the floor (information gap: Loewenstein 1994; Kang et al. 2009). The ranges are tuned by eye and labeled so in the ledger. None of these was measured here; they motivate the fourth hypothesis below.

### 7.3 Hypotheses

- **H1, state legibility.** Interrupted at matched timestamps, readers identify which words are settled more accurately with the lock reveal than with a uniform blur.
- **H2, reading cost.** Reading time of the final answer after the lock reveal is no worse than after a typewriter reveal. If it is worse, the right design reveals in reading order and carries state some other way.
- **H3, trust calibration.** Readers' confidence in individual words tracks the sampler's commit probability under the confidence-scaled render and does not under a uniform one.

- **H4, felt quality.** The same answer, at the same duration, is rated more satisfying and of higher quality after the reward grammar (7.2) than after a uniform fade. Falsified if the ratings do not differ, or if the grammar reads as busier without reading as better.

The recorded trajectories are the stimuli for all four.

## 8 The arrival profile

*Retired as a design instrument on 7 September 2026 (section 9). The numbers below describe a replay that knew the answer; the reveal they score cannot be produced by a live renderer. They are kept as history.*

The redesign adds a metric suite that scores any reveal, whether authored or recorded, on four properties (`lib/arrival/profile.ts`; the definitions are in `docs/redesign.md`, section 3). Over the eight coda fixtures at matched durations, the shipped grammar holds two phrases open at most (mean 1.5), makes a reader at one fixation per 250 ms wait on no fixation, closes a phrase on 36 percent of its steps against the typewriter's 18, arrives out of order at the phrase scale (τ +0.13), peaks at 28 percent of the run, and carries 0.83 of the mean intensity in its last stretch. The earlier growth mode (mycelium) opened 4.5 loops at the median and made a reader wait on 19 percent of fixations; fog and aurora ended at 2.9 and 1.8 times the mean; a uniform fade at 6.4.

### 8.1 The two-channel reveal on the recorded runs

`withReadingOrder` (`lib/arrival/reading-order.ts`) re-times legibility so that inside each phrase words turn crisp in reading order, at least 40 ms apart, with the phrase's earliest commit kept as its anchor, while the forming (state) channel keeps the sampler's own commit times. On the eighteen curated runs at the shaped pace, legibility trails commitment by a median of 540 ms on the 36 percent of words that wait (median maximum 1460 ms per run); the answer's total duration moves by about 100 ms; τ in the reading channel rises from 0.86 to 0.91; and the share of within-phrase pairs out of order falls from 22 percent to 6 percent, all of them anchors. The transform removes inversions by construction and cannot remove a wait the sampler imposes, so the report (`lib/traces/arrival.json`) carries both the plain and the ordered profile for every configuration.

### 8.2 Limits of the profile

The phrase rule is punctuation and line breaks, stated for English and Latin script. The salience that seeds the grammar is an authored score. The reader model is one number, a fixation every quarter second, with no skimming or rereading. The medians are over eight fixtures and eighteen curated runs of a 0.6B model. Every number describes an arrival; none describes a reader. The five claims in the case study's evidence section are what a study would test.

## 9 The causal audit and the settle contract (7 and 8 September 2026)

### 9.1 The audit

An independent audit of the crystallize build at `ab95e6a`, run by a second agent (Codex) and reproduced by `tests/settle/report.test.ts`, established four facts. The reveal joined the final word table into a string, tokenized and measured it before the first step, and reserved every word's final width. Of the corpus's 3,880 words, 700 (18.04 percent) commit across more than one step; the curated subset has 188 of 1,205 (15.60 percent). The old rule rendered the final spelling of each at its first token, and 353 of the 700 matched the model's provisional guess at that moment. The stored `tail_done_step` statistic, labeled "length fixed" on the page, is the last commit anywhere in a tail identified after the fact; the causally known length is the step by which every position up to and including the first end token has committed, and the stored statistic precedes it in 42 of 60 traces. The reading-order transform described in section 8.1 allowed each phrase's anchor to jump the queue and left a median 0.056 of within-phrase pairs out of order under a page claim that none did. The 540 ms and 36 percent figures are medians of per-trace summaries at a shaped replay pace on 18 curated traces and are not comparable to any causal cost.

### 9.2 The contract

`lib/settle/reader.ts` is a pure reducer over timestamped events: commits by position, a bounded finish, revisable snapshots with explicit finality, revisions, stop and error. It buffers commitments by position and extends a contiguous prefix only through positions actually received. A word boundary exists after a token when the next committed token begins with whitespace, the token itself ends with whitespace, or the next position is a committed end; text past the last boundary is held. The page receives passages under one of three policies: each word, each sentence (terminal punctuation followed by whitespace, held inside inline code, fenced code and lists and after common abbreviations), each paragraph (a blank line outside code). No timeout relabels a fragment; finality releases the exact remainder. Length is claimed only when the prefix reaches a committed end token. The replay adapter (`lib/settle/replay.ts`) reads token positions, texts and steps, the recorded drafts, the step clock and the request bound; a throwing-getter test proves it never reads the answer, the word table, the tail flags or the tail statistic. A `draft` event carries the source's current guesses and changes nothing the reader can count on: no page text, no prefix, no passage, and no status beyond marking the source active.

### 9.3 The field — revised 9 September

`lib/settle/carve.ts` derives source-position state: an open slot, source draft, committed fragment, complete word or committed end. `components/settle/settle-answer.tsx` keeps permanent source-token children, including through multi-token word completion and passage promotion. Released styling follows source character offsets rather than moving words into a replacement passage tree. The source reducer remains authoritative for availability and finality.

Candidates now occupy a fixed 2.8ch reservation. Their whitespace is flattened; they cannot insert line breaks. A fitting draft can be legible under the existing probability policy, while a longer candidate remains nonlexical. The persistent ambient layer breathes over 5.6 seconds with four regional phases; it changes decoration rather than readable typography. Committed glyphs are immediately legible. New complete words and released passages can receive local 200 ms and 400 ms afterglows, respectively, without reading-order staggering or delayed availability.

The actual background is part of the contrast contract. Browser QA found that the secondary mix did not clear the contrast floor on the translucent Felt product bubble. Product bubbles therefore keep committed glyphs in primary ink and mark unreleased text with an anchored dotted underline, removed at release without changing geometry. Dark stages retain secondary ink. Playback controls now sit above growing content, and the cost and voice tables are labeled, keyboard-scrollable regions. These corrections do not establish a reader benefit.

`components/settle/use-formation-layout.ts` coordinates small relocations over 320 ms. Large reflows use the authoritative text position immediately and remain a limitation, not a solved measurement. Motion off, reduced motion, presentation pause, visibility and terminal state control the lifecycle. Section 9.8 separates the supporting research from the untested reader hypothesis. The exact motion contract is in [the implementation record](motion-direction-2026-09-09.md).

`lib/settle/phase.ts` still assigns authored sketching/drafting/polishing/closing labels from committed and drafted shares. Those labels are neither model cognition nor a time estimate. `lib/settle/field.ts` retains an optional compact strip. The prior suppression and recorded draft/spin channels are unchanged; the old reel presentation is retained only in the historical design record.

### 9.4 The drafts

At every step the capture records, for every position still masked, the model's current argmax and its max softmax probability (section 2). `scripts/derive-drafts.py` writes those into the compact trajectories the interface loads, as one list per step of `[position, piece, probability]` entries, recorded while the probability is at or above a record floor of 0.2, with an empty text withdrawing a guess and a commitment ending its position's draft implicitly. The interface draws a guess legibly only at or above a display floor of 0.25, the floor the earlier build arrived at for the same reason (section 7.1): below it the argmax of a masked position is the corpus prior and says the same word everywhere. The gap between the two floors leaves room for the reducer's hysteresis: a guess keeps being drawn while its text holds, so one sitting at the display floor does not blink.

The statistics below are over content positions of every recording with at least 8 content tokens (`minContentTokens` in `data/traces/derived/drafts.json`); a pair is one open content position at one step. Both tables count candidates eligible under the reducer’s display-floor rule, before the 9 September width-fit gate, with a draft judged correct when its decoded text is the text the position later commits.

| statistic, all recordings | value |
| --- | --- |
| pairs with a draft eligible before width fitting | 0.1699 |
| eligible drafts matching the token later committed | 0.6657 |
| steps with at least one eligible draft | 0.9272 |
| steps a draft qualifies before commitment, median | 8 |
| eligible drafts that never change before commitment | 0.6145 |

| statistic, by configuration | lowconf-b32 | random-b32 | lowconf-b128 |
| --- | --- | --- | --- |
| pairs with a draft eligible before width fitting | 0.1301 | 0.1915 | 0.3115 |
| eligible drafts matching the token later committed | 0.6103 | 0.718 | 0.5756 |
| steps of drafting before the position commits, median | 4 | 14 | 11 |
| drawn share, first tenth of the run to the last | 0.036 to 0.623 | 0.098 to 0.801 | about 0.3, then 0.537 |
| lift on a neighbor of a just-committed position | 0.1096 (n = 1074) | 0.175 (n = 2121) | 0.1264 (n = 77) |
| lift on every other open position | 0.0067 | 0.0048 | 0.0022 |

The two schedules differ in when a draft is worth drawing. Under the block schedule a draft is rare early and common late, because a block's positions are only under consideration while their block is open: the drawn share climbs from 0.036 in the first tenth of a `lowconf-b32` run to 0.623 in the last. Without the schedule every position is under consideration from the first step, and the drawn share is roughly flat at about 0.3 until a final tenth at 0.537. Accuracy does not track breadth: `random-b32` draws more than `lowconf-b32` and is right more often (0.718 against 0.6103), while `lowconf-b128`, which draws the most, is right least often (0.5756).

The neighbor lift is measured on the raw probabilities at the step after a commitment: the max probability of an open content position adjacent to a position that has just committed rises on average by 0.1096, 0.175 and 0.1264 under the three configurations, against 0.0067, 0.0048 and 0.0022 for every other open position. The next-step increase is larger for adjacent positions in these recordings. This is an association in the sampler trajectory, not an intervention establishing that a particular commitment causes a neighbor to settle. It also does not establish that token probability is calibrated confidence in the answer's truth.

The display floor trades silence against accuracy. On the raw probabilities, with accuracy judged by token id, a floor of 0.15 draws on 0.227 of pairs at 0.565 accuracy; 0.25 draws on 0.153 at 0.705; 0.3 draws on 0.134 at 0.752; 0.5 draws on 0.086 at 0.878. The interface keeps 0.25, which is the one floor the rest of the piece already uses.

These numbers describe what one sampler's own guesses do on this corpus. They do not say that drawing a draft helps anybody read, judge or wait; that remains the unrun study of section 9.7.

### 9.5 The cost

`pnpm traces:settle` measures every recording under every policy on a uniform step clock (one completed forward pass per step) and on the raw forward-pass clock, and writes `lib/traces/settle.json`. Over the 57 nonempty traces: first passage at a median of 12 steps under each word, 39 under each sentence, 128 under each paragraph (1.4, 4.6 and 15.6 seconds on the capture machine); mean per-character extra hold after joining the prefix of 3.29, 24.47 and 44.65 steps; the word rule alone 3.29 steps; forming text visible for a median 90 percent of the run under sentence and paragraph release; median passages per answer 16, 3 and 1, of 8, 107 and 414 characters; maximum text held off the page 15, 629 and 710 characters. Under every policy all 60 final outputs equal the sampler's exactly and zero characters reach the page before their tokens commit. These are properties of the reducer on this corpus, on a 0.6B model at about 119 ms per step. Production latency and commitment patterns depend on the model, sampler and hardware; a faster replay clock is an illustration, not a production speed measurement.

### 9.6 The literature, reviewed

A review on 7 September 2026 checked each mechanism the first version cited and added the incremental-display and streaming-interface literature. Findings that bear on the design:

- Revising text already on screen has a measured cost to reader experience. In live captions, a flicker metric correlated with self-reported distraction (r = .33), fatigue (r = .36) and reduced reading ease (r = -.31), N = 123 crowdsourced, and a stabilization algorithm improved five of six ratings (Liu et al., CHI 2023 Extended Abstracts, late-breaking work). The paper supports claims about reader experience: distraction, fatigue and reading comfort. It makes no comprehension claim. A display change under a fixation is detected unless timed to the saccade (Slattery, Angele and Rayner, 2011). Preventing rereading reduced comprehension (Schotter, Tran and Rayner, 2014). Consequence: the page never changes, and earlier passages stay.
- Visible process raises perceived value and can be preferred to an instant result when the result is good, and lowers it when the result disappoints (Buell and Norton, 2011); unexplained and uncertain waits feel longer (Maister, 1985); a justified delay reads as more trustworthy (Zhang, Tsiakas and Schneegass, 2024). Consequence: the field explains the wait; because the same literature implies a risk of unwarranted trust, the field does not encode answer correctness, and the study measures false-answer acceptance. Draft appearance may reflect the source's token probability; that probability is not an answer-quality score.
- Tan, Messerschmidt, Yin and Nov (CHI 2026, 13–17 April; [doi:10.1145/3772318.3790716](https://doi.org/10.1145/3772318.3790716)) compared 2-, 9- and 20-second time-to-first-token delays with 240 participants. Thoughtfulness was rated lower at 2 seconds than at 9 or 20; usefulness was rated higher at 9 than at 2. Logged interaction behavior and workload showed no significant latency effect. There was no instantaneous condition, no clause-pacing comparison and no subsecond motion treatment. This is evidence that latency can affect perceived quality, not a prescription to delay available text. The previously cited Zhu clause-pacing paper could not be verified in the 9 September refresh and is withdrawn as evidence. Whole-sentence release remains an authored policy whose waiting cost is measured here.
- The Zeigarnik memory effect does not replicate as a general effect; only a pull to resume survives (Ghibellini and Meier, 2025). Gestalt closure concerns contours (Elder and Zucker, 1994). The peak-end rule is contested for mild positive experiences (Alaybek et al., 2022; and null results for simple positive experiences). Consequence: the tension budget, the closure bonus and the exhale are retired; the ending is a quiet terminal state.
- Perceptual fluency raises judged truth (Reber and Schwarz, 1999, a small early demonstration in which the manipulation was color contrast rather than typeface; Alter and Oppenheimer, 2009, for the wider literature). Consequence: a guardrail rather than a goal.
- Practitioner guidance converges on announcing completed messages rather than token streams to screen readers; no controlled study was found. Consequence: the status is announced on state changes only.
- Craft principles can inform a transition without establishing a reader benefit. Lasseter (1987), Thomas and Johnston (1981), and Chang and Ungar (1993) supply animation and interface-design arguments, not controlled evidence for this word treatment. Heer and Robertson (2007) studied chart tracking and estimation; Bartram, Ware and Calvert (2003) studied peripheral notification motion. The revised application is a hypothesis: reduce geometry changes, preserve identity, keep ambient treatment local and use one completion response. The 8 September nine-second desktop measurement (mean per-cell movement 3.69→2.38 px; maximum 103.2→101.4 px) belongs to the previous width experiment and must not be reported as the revised renderer’s performance.
- This literature search did not identify a study testing this specific non-sequential diffusion presentation. That search result does not establish that no relevant study or design guidance exists. This project has not run its proposed reader comparison.

The inspected commit-based sampling configurations keep their commitments fixed. Other sampling methods, including ReMDM and discrete flow matching correctors, may revisit predictions. This repository does not establish a finality guarantee for proprietary production samplers. The contract's snapshot path exists for the reversible case.

### 9.7 Hypotheses, restated

The study is two labeled experiments: an availability-faithful comparison under identical source events, and a matched-duration comparison isolating preference. Conditions: the raw prefix, each word, each sentence with forming text, each sentence without it, each paragraph, counterbalanced within participants with a Latin square over balanced questions. Primary outcomes: qualification accuracy and time to a correct usable answer, with source availability recorded separately. Secondary: perceived wait, comfort, satisfaction, delayed comprehension, brand recognition. Guardrails: false-answer acceptance and truth discrimination. Sample size from a pilot and a prespecified smallest useful effect, preregistered. No participants have been recruited.

### 9.8 Motion evidence refresh — 9 September 2026

**Status: implemented motion revision; reader study unrun.** Section 9.3 describes the revised renderer. Fixed candidate reservations, stable token identity, immediate committed text, ambient decoration and local completion feedback replace the reels. The implementation does not establish zero reflow or a reader benefit. Historical movement measurements are not new performance results.

The closest display evidence is [Liu et al.'s live-caption study](https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/): stabilizing updates with smoothing improved subjective reading experience, but the combined treatment does not isolate animation or establish comprehension gains. [Heer and Robertson](https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf) found advantages for simple animated chart transitions and problems with complicated staging. Applying those results to text is an inference: preserve a region's identity and line landmarks, reduce unnecessary relocation, then use one local completion transition instead of stacking a reel, letter sequence, bounce and ripple.

[Bartram, Ware and Calvert](https://scholars.unh.edu/ccom/979/) show both the detectability and the distraction cost of peripheral motion. This motivates testing a small, anchored ambient breath on unresolved decoration while the source remains active. The implemented breath continues during a real unresolved interval and stop at commitment, completion, stop or error; it does not encode percentage, correctness or additional reasoning. Readable glyphs stay steady, and reduced motion retains static state distinctions. No cited study establishes that breathing words is calming, pleasurable or easier to read.

The completion cue acknowledges a real boundary: newly available passages or local regions that have actually resolved. Changes supplied together settle together, without a left-to-right stagger; earlier released text is not reanimated. [Schotter, Tran and Rayner](https://journals.sagepub.com/doi/10.1177/0956797614531148) support keeping earlier words available for rereading, not a particular animation. [Buell and Norton](https://www.hbs.edu/ris/Publication%20Files/Norton_Michael_The%20labor%20illusion%20How%20operational_f4269b70-3732-4fc4-8113-72d0c47533e0.pdf) motivate making real work visible while warning that perceived value can fall when waits lengthen or results disappoint. A tactile acknowledgement is a design hypothesis, not a dopamine claim, and finishing an animation must not become a reason to withhold already available text.

This is compatible with masked diffusion because [LLaDA section 2.4](https://arxiv.org/html/2502.09992v3) predicts masked positions simultaneously before remasking a subset. Its Appendix B.4 also documents sequential progression across blocks. Parallel activity is therefore a capability to reflect when the source exposes it, not an order to invent. Separate list regions may visibly develop together only when their positions and structural boundaries are available from the source. A numbered list is not guaranteed to become ready item by item or all at once, and the renderer must not infer final line lengths or item counts from the eventual answer.

The unrun reader comparison should contrast the prior reel build, stabilized layout alone and stabilized layout plus local motion, under identical source events. Count line-wrap changes, maximum and high-percentile displacement, movement of readable passages, time to a usable answer, and any presentation hold separately. Then measure perceived waiting, distraction, reading comfort, satisfaction and false-answer acceptance with readers. Mean per-frame movement alone can hide the single large reflow that makes a phone display feel jumpy. Timings and amplitudes remain prototype parameters, not values derived from the cited studies.

## References

Nie, S., et al. Large Language Diffusion Models. arXiv:2502.09992.

Sahoo, S., et al. Simple and Effective Masked Diffusion Language Models. arXiv:2406.07524.

Dream 7B (diffusion language model release).

dLLM: a survey and toolkit for diffusion large language models. arXiv:2602.22661.

Hugging Face model card, `dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1`.

Alaybek, B., et al. (2022). A meta-analysis of the peak-end rule. Organizational Behavior and Human Decision Processes. doi:10.1016/j.obhdp.2022.104149.

Alter, A. L., and Oppenheimer, D. M. (2009). Uniting the tribes of fluency to form a metacognitive nation. Personality and Social Psychology Review, 13(3), 219 to 235.

Arriola, M., et al. (2025). Block Diffusion: Interpolating Between Autoregressive and Diffusion Language Models. arXiv:2503.09573.

Bartram, L., Ware, C., and Calvert, T. (2003). Moticons: detection, distraction and task. International Journal of Human-Computer Studies, 58(5), 515 to 545.

Buell, R. W., and Norton, M. I. (2011). The labor illusion: How operational transparency increases perceived value. Management Science, 57(9), 1564 to 1579. The effect reverses when the result disappoints.

Chang, B.-W., and Ungar, D. (1993). Animation: From Cartoons to the User Interface. UIST '93, 45 to 55. A design and implementation paper with no user study.

Elder, J., and Zucker, S. (1994). A measure of closure. Vision Research, 34(24), 3361 to 3369.

Ghibellini, R., and Meier, B. (2025). Interruption, recall and resumption: a meta-analysis of the Zeigarnik and Ovsiankina effects. Humanities and Social Sciences Communications. doi:10.1057/s41599-025-05000-w.

Heer, J., and Robertson, G. G. (2007). Animated Transitions in Statistical Data Graphics. IEEE Transactions on Visualization and Computer Graphics, 13(6), 1240 to 1247.

Koffka, K. (1935). Principles of Gestalt Psychology. Harcourt, Brace. The systematic treatment of figure and ground, credited there to Rubin (1915).

Lasseter, J. (1987). Principles of Traditional Animation Applied to 3D Computer Animation. Computer Graphics (SIGGRAPH '87), 21(4), 35 to 44.

Liu, X. "Bruce", Zhang, J., Ferrer, L., Xu, S., Bahirwani, V., Smus, B., Olwal, A., and Du, R. (2023). Modeling and Improving Text Stability in Live Captions. CHI 2023 Extended Abstracts (Late-Breaking Work). doi:10.1145/3544549.3585609. N = 123 crowdsourced. Supports claims about reader experience: distraction, fatigue, reading comfort. It makes no comprehension claim.

Maister, D. H. (1985). The psychology of waiting lines. In The Service Encounter.

Kowalski, E. Animations on the Web, animations.dev, and the published animation skill at github.com/emilkowalski/skill (accessed 8 September 2026). Practitioner guidance, cited for its rule that looping ambient motion is used only when explicitly asked for; it reports no study.

Reber, R., and Schwarz, N. (1999). Effects of perceptual fluency on judgments of truth. Consciousness and Cognition, 8(3), 338 to 342. A small early demonstration, manipulating color contrast.

Schotter, E. R., Tran, R., and Rayner, K. (2014). Don't believe what you read (only once): Comprehension is supported by regressions during reading. Psychological Science, 25(6), 1218 to 1226.

Slattery, T. J., Angele, B., and Rayner, K. (2011). Eye movements and display change detection during reading. Journal of Experimental Psychology: Human Perception and Performance, 37(6), 1924 to 1938.

Tan, F. F.-Y., Messerschmidt, M. A., Yin, W., and Nov, O. (2026). [The Impact of Response Latency and Task Type on Human-LLM Interaction and Perception](https://doi.org/10.1145/3772318.3790716). Proceedings of the 2026 CHI Conference on Human Factors in Computing Systems, 13–17 April 2026, Barcelona, Spain. 17 pages. doi:10.1145/3772318.3790716. [Author preprint](https://arxiv.org/abs/2604.06183).

Thomas, F., and Johnston, O. (1981). Disney Animation: The Illusion of Life. Abbeville Press. Codified the twelve principles; it did not invent them.

Wang, G., Schiff, Y., Sahoo, S., and Kuleshov, V. (2025). Remasking Discrete Diffusion Models. arXiv:2503.00307.

Wu, C., et al. (2025). Fast-dLLM: Training-free Acceleration of Diffusion LLM by Enabling KV Cache and Parallel Decoding. arXiv:2505.22618.

Zhang, Z., Tsiakas, K., and Schneegass, C. (2024). Explaining the Wait: How Justifying Chatbot Response Delays Impact User Trust. ACM CUI 2024.

Withdrawn citation: the earlier note named Zhu, H., et al. (2026), “Just-in-Time Tokens: Adaptive Token Pacing for Cognitive-Friendly LLM Streaming.” The 9 September 2026 refresh did not verify an exact primary source. It is retained here only to record the correction and is not used as evidence.

## Rendering observations for this revision

Eight sequential Chromium observations at 390 and 1380 px viewport widths each produced one complete text update with no pre-final text. Across 9,667 matched first-character samples of final whitespace words, observed displacement after arrival was 0 px. The long explanation grew the occupied answer frame from 120 to 219.375 px at finality. This is a one-time 99.375 px expansion, not zero layout change. The largest measured primary bar rectangle-edge change was 0.5663 px between sampled frames; maximum observed frame gap was 18.8 ms in these runs. These observations describe this development machine and sampled stimuli, not physical iPhone performance or a reader preference.

The [measurement report](ambient-motion-validation-2026-09-09.json) defines all metrics and records implementation/source hashes. The [artifact manifest](../data/experiments/ambient-motion-2026-09-09/manifest.json) links eight compressed raw logs and the two screen recordings. A source deadline and readable text first observed in the same frame is recorded as zero sampled-frame delay; it is not a claim of zero display latency.

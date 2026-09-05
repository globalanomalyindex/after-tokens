# How a masked diffusion language model commits its answer, and what an interface should do about it

Christopher Robin Fiore. After Tokens project, 2026.

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

A position's provisional guess is unstable before it commits, changing a median of 5.3 times per token, and 96 percent of tokens change at least once. Rendering a legible, continuously updating guess for an uncommitted position would show most words wrong several times before showing them right. This is the measured argument for keeping uncommitted content illegible under blur. A fade to a readable draft would show the reader words the sampler is still going to change.

Confidence at commit is not uniformly high: the median committed token has probability 0.57, and 38 percent of commits happen under even odds. A reveal that renders every commit with the same visual certainty overstates confidence for a substantial minority of words; per-word confidence, which the sampler already computes, is available to drive per-word visual weight.

## 5. Limitations

This is one model at 0.6 billion parameters, one sampler family (low-confidence remasking and random remasking, both from the MDLM/LLaDA tradition), greedy decoding only, twenty prompts, and one machine (an Apple M3 running PyTorch on Metal). No sampling temperature above zero, no nucleus or top-k variants, and no larger model in the same family were tested; a larger model or a different sampler may order its commits differently, and the near-sequential result for the default configuration should not be assumed to generalize past the model and schedule tested here. Order statistics exclude trajectories under 8 content tokens, since two tokens are trivially in order; that excluded 9 of the 20 `lowconf-b128` runs, 3 of which returned no content at all, a known failure mode of removing the block schedule (the sampler can commit its end-of-sequence tokens before any content token). The `lowconf-b128` usable trajectories had a median content length of roughly 15 tokens against over 100 for the block-scheduled configurations, so cross-configuration comparisons involving `lowconf-b128` describe much shorter answers. Three of the twenty `lowconf-b32` answers (`heron-poem`, `lighthouse-haiku`, `sky-blue`) fell into a repetition loop: one two- to eight-word phrase repeated back to back 14, 16, and 19 times, covering 88%, 84%, and 77% of the answer's words. This is a known failure of greedy decoding in a small model, and no `random-b32` or `lowconf-b128` run showed it. The three runs are kept in every statistic reported here (their order, confidence, and timing are measured like any other run), they replay as recorded in the case study with the loop named beside the stage, and the product-facing demo replays the same prompt's `random-b32` run in their place. The flagging rule (`LOOP_RULE`, `scripts/gen-trace-index.mjs`: a phrase repeated at least three times covering at least 30% of the words) separates the set cleanly, with every other run at zero coverage. None of this measures whether any reveal built from these trajectories helps a reader read faster or identify model state more accurately; that remains a separate, unresolved study, for which these recordings are a candidate stimulus. They are not a result.

### 5.1 Corroboration at 8B

Four of the coda prompts (`diffusion-explain`, `heron-poem`, `travel`, `weather`) were additionally run through LLaDA-8B-Instruct (Q4_K_S quantization, llama.cpp on Metal) under the same low-confidence remasking, four-block schedule as `lowconf-b32`. Commit order correlated with reading order at τ = +0.90, with a median jump of 3.9 positions against roughly 36 expected from a uniformly random order, and an adjacent-commit fraction of 0.34. Content filled most of the 128 positions (a median of 108 content tokens), so a tail was less often present and the ending-committed-before-last-word share (0.25 here) is not comparable in scale to the 0.6B figure. The block-schedule pattern, a near-sequential macro order with jumps far tighter than random, reproduces at 8B. llama.cpp's step callback exposes commit order and per-step timing (a median of 1504 ms per step at this quantization). It does not expose per-position confidence, so median commit confidence and the flip statistics have no 8B figure here; this set corroborates order and timing. The confidence findings stay at 0.6B only.

## 6. Data and code availability

- Compact trajectories (what the interface loads): `data/traces/compact/<prompt>__<config>.json`
- Full trajectories with per-step probabilities: `data/traces/full/<prompt>__<config>.json.gz`
- Per-trajectory and per-configuration statistics: `data/traces/manifest.json`, `data/traces/summary.json`
- Schema and capture method: `data/traces/README.md`
- Capture and summarization scripts: `scripts/capture-trajectories.py`, `scripts/summarize-trajectories.py`
- Trace loader and typed accessors used by the interface: `lib/traces/index.ts`, `lib/diffusion/traces.ts`
- Canonical findings and figures cited throughout the case study: `lib/traces/findings.ts`

All of the above are released under the MIT license, in the same repository as the interface itself. Reproducing the capture requires `torch`, `transformers==4.57.0`, and a two-line stub of the `dllm` package that the model's custom code imports only under `__main__`.

## 7 Design changes derived from the measurements

The shipped reveal was rebuilt from the glossary principles and the findings together; the reasoning in order is `docs/redesign.md`, and the twelve resulting decisions, each with its source and how its value was arrived at, are the ledger in the case study's hypothesis section (`SYNTHESIS` in `lib/traces/findings.ts`). In brief:

- A pending word is an illegible blur (4.2 px at body size) in a slot of its final width (parafoveal preview; Zeigarnik effect).
- The pending churn runs at 390 ms; the sampler's provisional guess changed every 3.25 steps, 387 ms at recorded pace (Doherty threshold; finding 04).
- The model's guess is shown only above a probability of 0.25. The median probability of a provisional guess at the moment it would be shown is 0.065, the corpus prior, decoding as "the"; about one change in thirty clears the floor (predictive coding; prediction error).
- Words lock in several places at once, each cluster growing outward from its seed: the first step seeds the whole span, and every later commit extends a live front with the jump distribution of the schedule-free sampler (`lowconf-b128`, 51% adjacent) or opens a new seed in the largest gap left. The block schedule that makes `lowconf-b32` read left to right is treated as a product decision the reveal does not inherit (findings 01 and 02; change blindness).
- Commits arrive in steps of several words, about twenty steps per answer, 140 to 260 ms apart after a 320 ms pre-roll, with each step's words landing across a 70 ms spread, the way a multi-token-per-step decoder commits. The average rate is linear, because the recorded cadence is linear within 0.119 of a straight line (finding 01; Doherty threshold); the step count and spread are tuned by eye. Phi decay is retired to the comparison stimulus.
- A lock is crisp at once and heavier; its halo blooms and is gone within 900 ms; the settle overshoot scales with commit probability from 0.5% to 1.5%; a weak commit rests dimmer (von Restorff effect; dopamine; trust calibration; finding 05).
- The field moves as a whole exactly once, at the last lock, which carries the strongest settle (gestalt closure; peak-end rule; finding 03).

### 7.1 A prediction earns rendering only when it is a prediction

The first build of the recorded mode rendered the model's provisional argmax for every open position. Every slot read "the". The argmax of a masked position far from commitment is the corpus prior, and rendering it is true and useless: it injects a prediction the reader must discard. The floor at 0.25 (about four times the median prior) restores the intended behavior, a handful of real beliefs per answer and noise otherwise.

### 7.2 The reward grammar

Six further decisions concern how the same answer can feel better rather than read better, each tied to a mechanism from the reward literature: a forming stage before each lock (reward anticipation: Howe et al. 2013; Salimpoor et al. 2011), a snap from ghost to crisp (processing fluency: Reber, Schwarz & Winkielman 2004; the aha effect: Topolinski & Reber 2010), a settle bonus for a lock that closes a gap between settled neighbors (gestalt closure), a receding field and a live count of settled words (goal gradient: Hull 1932; Kivetz, Urminsky & Zheng 2006; endowed progress: Nunes & Drèze 2006; the labor illusion: Buell & Norton 2011), an eight percent long-short swing on the step interval (groove: Witek et al. 2014), and slots of final width with real guesses above the floor (information gap: Loewenstein 1994; Kang et al. 2009). The ranges are tuned by eye and labeled so in the ledger. None of these was measured here; they motivate the fourth hypothesis below.

### 7.3 Hypotheses

- **H1, state legibility.** Interrupted at matched timestamps, readers identify which words are settled more accurately with the lock reveal than with a uniform blur.
- **H2, reading cost.** Reading time of the final answer after the lock reveal is no worse than after a typewriter reveal. If it is worse, the right design reveals in reading order and carries state some other way.
- **H3, trust calibration.** Readers' confidence in individual words tracks the sampler's commit probability under the confidence-scaled render and does not under a uniform one.

- **H4, felt quality.** The same answer, at the same duration, is rated more satisfying and of higher quality after the reward grammar (7.2) than after a uniform fade. Falsified if the ratings do not differ, or if the grammar reads as busier without reading as better.

The recorded trajectories are the stimuli for all four.

## References

Nie, S., et al. Large Language Diffusion Models. arXiv:2502.09992.

Sahoo, S., et al. Simple and Effective Masked Diffusion Language Models. arXiv:2406.07524.

Dream 7B (diffusion language model release).

dLLM: a survey and toolkit for diffusion large language models. arXiv:2602.22661.

Hugging Face model card, `dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1`.

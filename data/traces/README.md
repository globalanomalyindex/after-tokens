# real denoising trajectories

recorded from a masked diffusion language model so the interface can be driven by, and measured against, what a sampler actually does instead of an authored guess.

- model: `dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1` (qwen3-0.6b adapted to masked diffusion with the mdlm objective, instruction tuned; apache-2.0)
- hardware: apple m3, 8 gb, pytorch on metal. step timings in the files are real wall-clock milliseconds on that machine.
- sampling: greedy (temperature 0), 128 denoising steps for 128 new tokens, so every step commits exactly one position and the step index is also the commit rank.
- three sampler configurations per prompt:
  - `lowconf-b32`: llada-style low-confidence remasking, four blocks of 32 (the model card default)
  - `random-b32`: the original mdlm random unmasking order, same block schedule
  - `lowconf-b128`: low-confidence remasking with no block schedule, one global 128-position field
- 20 prompts. the first seven are the case study's own coda fixtures, so each of those has both an authored reveal and a real one.

## files

- `compact/<prompt>__<config>.json`: what the site loads. one object per trajectory:
  - `answer`: the decoded content (up to the first end-of-sequence token)
  - `words[]`: whitespace words, the unit the interface renders. `index`, `text`, `tokens` (generated positions that overlap the word), `lock_step` (the step its last token committed), `first_step`, `conf` (the lowest commit confidence among its tokens), `changes` (the word's provisional text before it committed, as `[step, text, p]` triples at every step where it changed, where `p` is the probability of that guess: the weakest uncommitted token's max-softmax probability at that step; the last triple is the committed word). Most triples carry the corpus prior at `p` around 0.06, which decodes as "the"; the interface only renders a triple whose `p` clears `PROVISIONAL_FLOOR` (`lib/diffusion/traces.ts`), so a shown guess is a real prediction rather than the prior filling every open slot
  - `tokens[]`: every generated position. `pos`, `text` (decoded piece), `step` (commit step), `conf` (softmax probability of the committed token at commit time), `flips` (how many times the model's provisional argmax for this position changed before it committed), `tail` (true for end-of-sequence and padding positions after the content)
  - `step_ms[]`: wall-clock milliseconds per denoising step
  - `stats`: the per-trajectory statistics below
- `full/<prompt>__<config>.json.gz`: everything in compact plus, per step, `pmax` (max probability for every generated position) and `argmax` (the provisional best token for every generated position), and each token's character `span` in the answer.
- `manifest.json`: id, prompt, config, and stats for every trajectory
- `summary.json`: per-configuration medians, means, and ranges, plus paired comparisons across configurations on the same prompt
- `derived/order-model.json`: fitted parameters for feeding the recorded process back into the authored mycelium mode, one entry per sampler configuration (`lowconf-b32`, `random-b32`, `lowconf-b128`). produced by `scripts/derive-trajectory-models.py`.
  - `n`: trajectories the fit is drawn from
  - `seeds_per_100_tokens`: new anchors (commits not adjacent to any already-committed position) per 100 content tokens
  - `p_adjacent`: share of consecutive commits landing on a neighboring position
  - `jump_hist`: distribution of commit-to-commit distance, bucketed `1`, `2`, `3-5`, `6-10`, `11+`
  - `flip_timing`: how long a pending position's provisional guess holds before it changes. `median_pending_life_steps` and `median_steps_per_flip` are in denoising steps; `ms_per_flip_at_40ms_replay` and `ms_per_flip_recorded` convert that to milliseconds at the 40 ms replay pace and at the recorded per-step pace
- `derived/cadence.json`: the recorded word-lock cadence, one entry per sampler configuration. `rank` is word position normalized to [0, 1]; `lock_fraction_median`, `lock_fraction_p25`, and `lock_fraction_p75` are the fraction of words locked by that rank, at the median and interquartile band across `n` prompts. used to compare the authored phi-decay curve against what the schedule actually produces.
- `llada/`: a small corroboration set, LLaDA-8B-Instruct (`GSAI-ML/LLaDA-8B-Instruct`, Q4_K_S quantization, run through llama.cpp on Metal) on 4 of the coda prompts, same low-confidence remasking and four-block schedule as `lowconf-b32`. `<prompt>__llada8b-lowconf-b32.json` holds the same `words[]` shape as the compact 0.6B files (`lock_step`, `first_step`), but `conf` is always `null`: llama.cpp's step callback exposes commit order and per-step timing. It does not expose per-position confidence, so this set corroborates order and timing statistics only. `summary.json` in that folder holds the aggregate figures (`tau`, `meanJump`, `adjacentFrac`, `tailFirstFrac`, `msPerStep`, `contentTokens`) for the 4 runs.

## statistics

computed over content tokens only (tail excluded unless named):

- `kendall_tau_step_vs_position`: rank correlation between commit order and reading order. +1 is left to right, 0 is unrelated, negative is right to left.
- `mean_jump`: mean distance, in positions, between consecutive commits. `expected_random_jump` is the value a uniformly random order would give for the same length.
- `adjacent_commit_fraction`: share of consecutive commits that land on neighboring positions.
- `median_commit_conf`, `low_conf_commits_frac`: confidence at the moment of commitment, and the share of tokens committed with probability under 0.5.
- `first_quartile_stopword_frac` vs `overall_stopword_frac`: whether the first quarter of commits is richer in function words and punctuation than the answer as a whole.
- `mean_flips_per_token`, `tokens_with_any_flip_frac`: how often the model's provisional guess for a not-yet-committed position changed before it was committed. this is the cost of an interface that shows the current guess legibly.
- `tail_all_committed_by_step`, `last_content_committed_step`, `tail_before_last_content`: when the answer's end was fixed relative to when its last content token was.

## the audit

every run gets one verdict from `scripts/gen-trace-index.mjs` (`AUDIT_RULE`), written into `TRACE_META[id].audit`: `complete` (the model emitted its own end-of-sequence token and the answer ends in terminal punctuation), `looped` (`LOOP_RULE`: a 2- to 8-word phrase repeated at least three times covering at least 30% of the words), `short` (under 8 content tokens), `empty` (no content token), or `cut`. tallies: `lowconf-b32` 17 complete, 3 looped (`heron-poem`, `lighthouse-haiku`, `sky-blue`; one phrase repeated 14 to 19 times over 77% to 88% of the words, a known failure of greedy decoding in a small model); `random-b32` 20 complete; `lowconf-b128` 11 complete, 6 short, 3 empty. the files are untouched and every run stays in the statistics it qualifies for. the site shows the verdict beside the stage, and its product demos replay a run's order, timing, and confidence over pre-written words rather than the model's prose.

## reproducing

`scripts/capture-trajectories.py` is the exact script that produced these files. it needs `torch`, `transformers==4.57.0`, and a stub `dllm` package (the model's custom code imports it only under `__main__`; a two-line stub satisfies the static import check).

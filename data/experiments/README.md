# Real parallel commitment experiment · 9 September 2026

These four **new model runs** test a source condition absent from the original case-study corpus: committing four token positions from one actual denoising evaluation. They are separate from the 60 original traces and all existing aggregate claims. No old steps were regrouped, interpolated, accelerated, or replaced.

The original 60 traces have 128 steps and 128 positions each: **7,680 steps, maximum one commitment per step, zero multi-token steps**. The model predicts multiple positions in parallel, but the original sampler commits one at a time. That schedule can explain a typewriter-like commitment cadence even in a renderer that supports distributed positions.

## Capture and provenance

- Model: `dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1`, pinned revision `c8d24a3f4adaeef46881b450e1bf7d1005203bd7`.
- Repository source at capture: `47d71a4383693fdeea6e39426524d365f94ac3e6`. The new capture script was not yet committed; each directory contains the exact executed `capture-source.py` and its SHA-256 in the manifest.
- Runtime: Python 3.12.9, PyTorch 2.14.0, Transformers 4.57.0; Apple MPS, bfloat16; macOS 26.4 arm64. Seed 0, greedy token choice, one global block of 128 positions, 32 evaluations, four irreversible commitments per evaluation. Random selection uses a separate CPU generator, seeded 0, drawing 128 scores per evaluation.
- Three existing prompts use low-confidence remasking; one matched `sleep-tips` prompt uses random remasking. Every output is retained, including failures. This is a bounded demonstration, not an estimate of model quality.

| Recording | Content tokens¹ | Multi-content steps / 32 | Tail-only steps / 32 | Forward time | Observed loop time |
| --- | ---: | ---: | ---: | ---: | ---: |
| Weather, low confidence | 17 | 4 | 24 | 4,738.312 ms | 5,107.834 ms |
| Sky blue, low confidence | 71 | 18 | 9 | 3,859.302 ms | 4,105.773 ms |
| Sleep tips, low confidence | 22 | 5 | 22 | 3,824.241 ms | 4,047.567 ms |
| Sleep tips, random | 110 | 32 | 0 | 4,139.721 ms | 4,559.904 ms |

¹ Content is retrospectively classified as token positions preceding the first EOS/pad in final positional order. It is not an early oracle. The remaining positions are EOS or post-end positions. A token is not necessarily a word; four commitments do not establish four independently final words or list items.

The low-confidence weather result is a refusal. Sky blue has repeated words and grammatical errors. Sleep tips produces three numbered items, including the erroneous phrase “Avoid enough caffeine before bed.” Random sleep tips produces mostly repeated numerals and punctuation. This condition demonstrates spatially distributed commitments with poor content quality; it is not a usable answer or a recommended decoding policy.

## Two measured clocks

`step_ms` contains synchronized model-forward durations only and preserves first-step warmup. Existing `replayTrace(trace, 'recorded')` consumes that clock. It excludes selection, encoding, loading, and network time.

`step_wall_ms` contains observed monotonic intervals between online step snapshots becoming available. It includes forward passes, selection, device-to-host transfers, and online draft encoding. It excludes model/prompt loading and final file serialization. An experimental replay can explicitly supply `{ ...trace, step_ms: trace.step_wall_ms }` to the existing adapter and label it **observed capture-loop replay**. Cumulative rounded intervals can differ from the separately measured loop total by a few thousandths of a millisecond.

Neither clock is end-to-end API latency. These single-run measurements are not controlled speed comparisons: the first weather and random runs include cold first-step costs, and the device was also used for development.

## Source causality and validation

`full/*.json.gz` retains all per-step argmax token IDs, probabilities, actual selected positions, recorded clocks, online drafts/spins, and exact final IDs. The random capture additionally records its seeded selection scores. `compact/*.json` is compatible with `TraceCompact` and adds an experimental flag and observed clock.

Drafts/spins are generated during capture using only the current evaluation and already committed positions. They are the evaluation's **pre-commit predictions at positions still open after that commitment**, not a new post-commit model evaluation. The compact `answer`, `words`, and `tail` labels are retrospective audit metadata. The words' `changes` arrays are empty; use the causal token/draft replay, not the retrospective legacy word strategy.

The independent validator verifies 32 steps × four unique positions, top-k selection or exact seeded random scores, each committed token's source argmax, every draft/spin delta's source step, monotonic timing, file hashes, and exact decoded final text. Both `validation.json` files pass. The replay audit also runs the existing adapter/reducer while getters on final answer, word table, tail flags, and statistics throw; all four terminal prefixes exactly match the separately checked final decode.

## What becomes readable, and when

The reducer's complete chunk requires causally established word boundaries. It is a syntactic unit, not a validated semantic unit. One new boundary may make several already committed chunks eligible at once. This audit uses **sentence policy** to measure available reading/release opportunities; it does not measure the display timing of a whole-answer renderer that deliberately holds those opportunities.

| Recording | First content token¹ | First complete chunk | First released passage | Largest batch of new complete chunks |
| --- | ---: | ---: | ---: | ---: |
| Weather, low confidence | 2,509.195 ms | 2,639.134 ms | 5,107.834 ms | 6 |
| Sky blue, low confidence | 137.793 ms | 260.803 ms | 2,626.394 ms | 5 |
| Sleep tips, low confidence | 517.063 ms | 3,269.713 ms | 4,047.567 ms | 7 |
| Sleep tips, random | 685.302 ms | 4,436.178 ms | 4,559.901 ms | 2 |

Times in this table use the observed loop clock. Random selection spreads raw commitments more widely, but its near-absence of spaces leaves only three large numeric runs; complete-chunk readability arrives late. Source parallelism and useful reading progress must be measured separately.

`parallel-replay-audit-2026-09-09.json` includes every batch and its source-position spread. Low-confidence sky blue has batches of newly complete chunks spanning up to 57 source positions and two request-bound quartiles. Those are position-space measurements, not screen geometry or proof of smoother motion.

## Early formatting evidence

`structure-timing-2026-09-09.json` audits the original 60 and new four separately. It classifies newlines and list markers in final text **only for analysis**, then reads their real token commitment times. An early newline proves that local delimiter. An early `1.` without later whitespace does not yet prove a list; a decimal continuation remains possible. Neither establishes the total item count, line lengths, exact future wrapping, or semantic finality.

- Original 60: 19 traces contain 138 newline characters; 45 newline characters commit before both neighboring final whitespace words finish, and 90 precede the next word. Multiple newlines in one token are counted as characters, not independent commitment events. Of 36 final-text list markers, 32 precede completion of their first body word.
- New low-confidence sleep tips: the pieces `1.` are committed at 649.447 ms, before `Create` at 3,269.713 ms. Its second newline commits at 3,639.467 ms, before `schedule.` at 3,904.442 ms and `3.` at 3,766.219 ms.
- Counterexample: the first newline, `environment.`, and `2.` complete together at 3,515.483 ms. The whole list scaffold is not available at the beginning.

These observations support adapting local structure when committed delimiters arrive. They do not support laying out a finished answer or three known list items from final-answer metadata. A request bound identifies a position field, not future line breaks or an exact answer silhouette.

## Reproduce without altering the original corpus

Use an environment containing the pinned model/tokenizer cache and the runtime above. The capture refuses to overwrite an existing output. The current script retains the captured algorithms; exact executed sources are also preserved beside each manifest.

```sh
HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 python scripts/capture-parallel-experiment.py \
  --output data/experiments/my-new-lowconf-run

HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 python scripts/capture-parallel-experiment.py \
  --prompts sleep-tips --remasking random \
  --output data/experiments/my-new-random-run

python scripts/validate-parallel-experiment.py data/experiments/parallel-qwen-2026-09-09
python scripts/validate-parallel-experiment.py data/experiments/parallel-qwen-random-2026-09-09
python scripts/audit-structure-timing.py
node scripts/audit-parallel-replay.mjs
```

Exact floating-point results may vary across hardware/runtime versions despite a fixed seed. Model probabilities are sampler scores, not calibrated probabilities of truth.

## Falsifiable renderer evaluation

Compare alternative renderers on identical traces, identical observed clocks, fonts, widths, and reduced-motion settings. Report separate measures:

1. **Source opportunity:** commitments per evaluation; content/EOS split; source-position spread; newly eligible complete chunks; known delimiter times. A renderer cannot improve these without changing, delaying, or inventing the source schedule.
2. **Presentation fidelity:** zero commits or committed delimiters displayed before their source event; exact final text; provisional letters visually distinguished; no final-answer reads. If display is deliberately delayed, report its distribution separately.
3. **Geometry:** first nonspace glyph displacement for unchanged text and stable token identity, large wrap events over one line-height, horizontal overflow, and released-glyph displacement. Do not use multiline element union rectangles as glyph positions; require nonzero matched samples. Report p50/p95/p99 **and maximum**.
4. **Parallel presentation:** fraction of source batches that become visible in one frame; number of separated regions participating in a batch; source-to-visible delay spread within the same batch. Do not manufacture simultaneous availability by buffering old single-token steps without explicit disclosure.
5. **Reader outcomes:** a controlled study of comprehension, premature reliance on provisional text, perceived smoothness, and preference. A smooth animation, low geometric displacement, or named psychological principle alone does not establish these benefits.

The experiment establishes real parallel source availability and important failure cases. It does not yet establish that any proposed renderer is novel, more readable, more trustworthy, or preferred by users.

# Sentence continuity correction

12 September 2026 · Christopher Robin Fiore · GitHub: `globalanomalyindex`

I corrected a visible gap in the continuing skeleton after each sentence. This is a targeted refinement of the existing v8 treatment, not a new motion study. The published baseline is `bd5cf9f0955fbd7ebdec8c89435ed5ac9af20243`.

## Cause and correction

The handover captured nearby cells and hid their originals until its 280 ms animation finished. In the continuing field, that could remove the leading bar for the full handover; cleanup then began another 320 ms refill fade. A browser regression reproduced the missing leading bar in four late samples, approximately 190–260 ms into an arrival. The sentence was becoming readable while the activity below it still looked incomplete.

I keep capture-before-shift and the existing bridge. When the source is still receiving, the continuing field refills over 160 ms alongside the 280 ms transfer. Its temporary refill flag is removed at cleanup without triggering another refill fade. Transfers that begin after source finality do not start a refill. A refill already started while receiving is allowed to finish inside a later terminal fade, rather than disappearing when the source state changes. The field fade and subsequent container contraction retain their existing behavior. Source eligibility, exact text, the sentence default and the new-text settling duration are unchanged.

The behavior change is confined to [the transfer’s temporary cell state](../components/settle/bubble-transfer.tsx) and [its CSS](../app/globals.css). The intent is visual continuity during ongoing reading, not a claim about model confidence, progress or reader psychology. The new field and moving bridge intentionally overlap in time; the frozen baseline’s assertion that borrowed originals stay hidden throughout a continuing transfer no longer describes this patch.

## Verification scope

The new browser regression first failed on the baseline behavior. The unit/component suite then passed 384 tests across 48 files at 12:48:38 local time, taking 13.47 s, and lint passed. Fifteen focused browser checks passed across Chromium, WebKit and mobile-portrait with no retries, failures or skips. That run began at `2026-09-12T16:54:35.441Z` and took 96.623 s.

Across six sentence batches, each had four late-arrival samples and seven samples after cleanup. All retained the leading bar: the minimum sampled ink-layer opacity was .2, with zero hidden samples. These are finite browser observations of continuity, not a reader study, a physical-device result or a claim that the whole field has .2 composite opacity.

The fifteen checks concern this refill correction. They do not validate the subsequently requested fullscreen cinematic introduction or upfront live gallery. Those changes and this correction subsequently passed the [integrated verification](cinematic-showcase-verification-2026-09-12.md): 394 unit/component tests across 50 files, 96 browser checks, 166 instrument guards, lint and the normal production build. The new record preserves its own source fingerprint and raw evidence; publication gates remain separate.

## Opening and first comparison

I also revised the path into the case study: an authored fullscreen conversation introduces the motion, then contracts into the page. Four prewritten sentence batches use the same protected reading renderer, followed by a live gallery before the research explanation. The gallery starts with Reshape and each-sentence release, with the raw committed prefix visible on the same source clock. That placement makes the presentation change and its availability tradeoff directly inspectable.

The opening commits its sentences at 4,952, 6,202, 7,552 and 8,902 ms; the last batch includes explicit EOS. After the shared handover reaches final text readiness, a 750 ms hold precedes a 760 ms contraction into the page. The stage and text column stay mounted. Scrolling unlocks on completion, while Skip or Escape exits immediately. Reduced motion, a prior-seen session, a direct hash link or restored scroll bypasses fullscreen; replay is embedded. These are authored implementation timings, not browser measurements.

The opening is explicitly labeled choreography, not model output or a performance demonstration. Its source events are authored commitments rather than inferred confidence. The gallery uses a separate illustrative reply with an authored 8.5-second schedule; it labels that provenance, marks partial words in the raw prefix, and offers a whole-answer comparison. Original model recordings remain separately available later on the page. Neither change creates a reader-benefit result; the old v8 captures and the fifteen refill checks do not verify this new composition. The current [implementation handoff](growing-skeleton-v8-handoff-2026-09-12.md) records the design contract; the separate [integrated release record](cinematic-showcase-verification-2026-09-12.md) records its completed local verification.

The [v8 motion report](growing-skeleton-v8-validation-2026-09-12.json), [browser archive](growing-skeleton-v8-browser-validation-2026-09-12.json), [recordings](growing-skeleton-v8-showcase-capture-2026-09-12.json) and completed v8 handoff package remain frozen at `bd5cf9f`. Their original files and hashes are unchanged. They do not verify this correction, and I have not regenerated a study or delivery package under their identity.

The footer citation now uses **Christopher Robin Fiore**. `globalanomalyindex` remains the GitHub account and repository identity.

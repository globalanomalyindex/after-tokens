# Solid skeleton release verification

> **Historical material: `solid-rounded-skeleton-v1`, revision `a7606d9`.** These parameters and results are preserved for that revision. Continue with the [anchored motion research](anchored-skeleton-research-2026-09-09.md) and [current implementation handoff](anchored-skeleton-handoff-2026-09-09.md). The historical [JSON report](skeleton-motion-validation-2026-09-09.json) is unchanged.

9 September 2026 · material `solid-rounded-skeleton-v1` · local verification record.

This release changes the authored waiting material and the separate completion cue. It preserves the causal whole-answer reducer, source recordings, original case-study identity and earlier-reading comparison. The previous feathered material and its reports remain historical evidence at `05914c1`.

## Implementation and review

The five bars use uniform fills, constant 0.72 em thickness and circular ends. Still, breathe and reshape share geometry, source events and finality rules. Reshape adds rounded horizontal clipping to the same 4.8-second opacity pulse as breathe. The clipped shape changes visible area and total ink. No preference, psychological mechanism or novelty priority is established by this implementation.

The complete answer replaces the skeleton immediately at source finality. A separate 260 ms thin outline runs once; it never delays or moves the letters. Pause and motion-off preserve both animation instances and their phase. A consumed completion cannot replay on return to the viewport or on enabling motion.

Independent review found a caption-wrapping alignment issue at 900 px. A shared subgrid caption row corrected it. A subsequent browser observation found all three panel tops at 507.296875 px, with both moving conditions at the same 500.003 ms animation time after a fully visible restart. Individual offscreen observers remain unsuitable as a controlled participant exposure system; this limit is recorded in the study.

## Automated checks

- The new solid-material regression failed against the earlier feather masks and passed with the new material.
- All 268 unit/component tests across 40 files passed in an isolated run. An earlier run competing with the complete browser suite exceeded one existing 20-second corpus-test timeout; the isolated rerun passed without changing test logic or timeouts.
- A fresh normal production build passed. All 45 browser checks then passed against that production server across Chromium, WebKit and iPhone 14 emulation. These include the complete motion cycle, exact final output, pause and motion-off behavior, reduced motion, source switching, selection, phone containment and the automated accessibility audit.
- The measurement harness separately validates its rounded-inset parser, captured-clock oracle, archive compatibility and failure rejection. It refuses empty sample sets, stale material, blur, absent rounded ends, early text, duplicate arrival, missing pulse or moving final glyphs.

A preliminary measurement caught a development server still serving the earlier blurred completion glow. That diagnostic was rejected, not published as a successful result. The task-owned development server was stopped, a clean production build was made, and the full browser suite was rerun there before accepted motion measurements began.

Browser emulation is not physical iPhone validation. Automated accessibility checks do not replace assistive-technology sessions. Browser geometry and exact text tests do not establish reader comfort, perceived waiting or comprehension.

## Evidence provenance

The new measurement namespace is separate from all earlier motion archives. The harness fingerprints its own scripts, the runtime files and source fixtures before observing the browser, and verifies those same bytes before archiving. Rounded visible contour extrema are derived from actual computed clipping against the ink rectangle; they are geometric observations, not pixel-level antialiasing measurements.

Every observation explicitly selects 0.5× source inspection to expose a complete 4.8-second decorative cycle. The report retains captured duration and finality separately from the doubled inspection clock. The default gallery still uses the observed capture-loop clock. Neither clock is production API latency, and no inference speedup is claimed.

The original whole-answer policy cost report is unchanged: 60 exact final outputs, with eligibility costs measured on 57 nonempty traces. Median first whole-answer eligibility is 15.8 seconds, and paired median additional wait over sentence release is 10.5 seconds. This is an availability tradeoff that motion does not remove.


## Fresh motion observations

The [material-specific report](skeleton-motion-validation-2026-09-09.json) contains eight sequential Chromium observations: three conditions at 390 × 844 and 1380 × 900, followed by narrow reshape cases with a long explanation and a failed answer. All use explicitly selected 0.5× inspection. The [raw archive and manifest](../data/experiments/skeleton-motion-2026-09-09/manifest.json) preserve the evidence and hashes.

| Case | Frames | Matched glyph samples | Largest observed edge step, px | Final glyph displacement, px | Final frame growth, px |
| --- | ---: | ---: | ---: | ---: | ---: |
| 390-static | 549 | 976 | 0.000 | 0 | 0 |
| 390-breathe | 548 | 960 | 0.000 | 0 | 0 |
| 390-reshape | 548 | 960 | 0.283 | 0 | 0 |
| 1380-static | 549 | 976 | 0.000 | 0 | 0 |
| 1380-breathe | 548 | 960 | 0.000 | 0 | 0 |
| 1380-reshape | 549 | 976 | 0.311 | 0 | 0 |
| 390-reshape-sky | 556 | 3660 | 0.298 | 0 | 99.375 |
| 390-reshape-random | 609 | 180 | 0.298 | 0 | 0 |

Across 9,648 matched final-word first-character samples, no displacement was observed after arrival. Every case had one exact nonempty update, no pre-final text, one thin-outline insertion followed by removal, no blurred/faded/transformed final text and no horizontal overflow. Every loading frame held its 120 px allocation; visible bar thickness did not change. All moving cases exhibited at least one full 4.8-second pulse, and reshape covered its bounded visible-width range.

Static and breathe had zero visible contour movement. The largest sampled reshape edge step was 0.3114 px. Sampled frame intervals peaked at 18.8 ms on this machine. These are instrumented sequential observations, not a controlled rendering-cost or physical-device benchmark. The long narrow explanation still grew the final frame by 99.375 px once. No zero-displacement claim applies to that initial expansion.

The first sampled readable frame coincided with the first sampled source deadline in all eight cases. This means no additional sampled decorative hold was observed; it does not mean zero input, paint or compositor latency.

Two unedited browser viewport recordings are retained: [numbered list](../public/study/skeleton-answer-mobile.webm) and [long explanation](../public/study/skeleton-answer-long.webm). Their labeled 0.5× inspection clock is part of the recording context. Neither uses interpolated frames or rewritten source text.

Implementation/source fingerprint: `2255dac2d773c1197a26c234dc624e6d7433a7fbee85206d3bd4084d5095276a`. The manifest also lists individual file SHA-256 values.


## Final build and export checks

After finalizing the public writing, `pnpm check` passed in full: lint, TypeScript, all 268 tests across 40 files and the normal production build. The isolated unit run completed in 10.51 seconds. The separate `GITHUB_PAGES=true pnpm build` also passed.

The [exported-page verification report](skeleton-pages-export-verification-2026-09-09.json) records a Chromium 148 check at 390 × 844. The exported site served the current title, canonical URL and all 20 initial script/style references under `/after-tokens/`. The numbered list and dynamically loaded explanation each arrived as one exact answer on the default observed clock. Solid bars retained their height and layout; both opacity and rounded clipping changed. At the first answer, the separate cue had a 1 px solid border, no shadow/filter and a 260 ms animation; it then cleared. Both videos returned HTTP 200 with byte-exact source hashes. No browser or HTTP errors were recorded.

The reproducible publication check is [scripts/verify-skeleton-pages.mjs](../scripts/verify-skeleton-pages.mjs). Set `VERIFY_URL` to the served Pages export or live Pages URL and `VERIFY_REPORT` to a new report path. It reads the bundled source fixtures and video bytes from the repository root.

Independent integrity checks verified all runtime/source fingerprints, the report manifest, eight compressed raw logs and two videos, including decompression hashes. The 12 historical report/raw/video artifacts checked by the measurement reviewer remain byte-for-byte unchanged. An actual new recording was decoded and visually inspected at three time positions.

This document establishes completed local validation, not a prediction of successful publication. The commit-specific GitHub Actions result and the separate live-verification report in the delivery establish deployment status. Human reader benefits, physical-device behavior and priority of the proposed treatment remain open research questions.


## CI corpus-test organization

The [first publication attempt](https://github.com/globalanomalyindex/after-tokens/actions/runs/34399872929) stopped before deployment: the existing aggregate corpus DOM test exceeded its 20-second deadline at 20,017 ms on the runner. The other 267 tests passed, and no text-equality assertion failed. This was the same aggregate deadline that had proved sensitive to local contention.

The test now declares one sequential named case per recording, each still checking all three legacy policies. All 180 exact-text comparisons remain. Each case uses the ordinary per-test deadline instead of 60 independent recordings sharing one 20-second deadline. A replay is built once per trace and each policy still starts with fresh reducer state. Cleanup remains per case; no concurrent shared-DOM execution was added. Existing browser source-switch tests retain explicit whole-answer transition coverage.

The complete unit suite passed with **327 cases across 40 files** in 10.66 seconds. The total changed from 268 because one aggregate case became 60 named cases; this is clearer reporting, not increased corpus coverage. The motion implementation, source fixtures, eight observations and all measurement fingerprints remain unchanged. The earlier 268-case runs above retain their actual historical counts.

After the test organization change, lint, TypeScript, normal production build and Pages production build passed again. The final exported page was replayed again with the current writing; both exact outputs, the solid material, the once-only outline and both video hashes passed. The linked export report records that fresh check.

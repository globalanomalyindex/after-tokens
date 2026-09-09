# Adaptive cell skeleton release verification

9 September 2026 · material `adaptive-cell-skeleton-v5` · local engineering, measurement and publication gates passed.

This revision adds a causal size estimate, gradual waiting-area growth, an exact final-height handoff and one whole-answer settling movement. The capsule introduction, breathing cells, interior pill formation, neighbor redistribution and intermittent glimmer remain. Sizing distinguishes current committed positions from a current revisable snapshot; only numeric estimates enter the composition. Source recordings, whole-answer finality rules, exact answer text and the original case-study design are preserved.

Source finality and complete visual availability are now separate events. A frame that needs more room can retain its cells for an authored 180 ms fit after the source is final, then reveal the full answer with a nominal 180 ms translation. Browser scheduling can extend actual delay. These changes require fresh measurements; the previous immediate-visibility, fixed-loading-height and zero-arrival-movement results cannot be reused.

## Current verification status

The following fresh checks passed on the current v5 implementation, including the provisional-snapshot compatibility path and authored exercise:

| Check | Recorded result |
| --- | --- |
| Unit and component suite | **347 cases across 42 files passed**, 15.64 seconds |
| Browser suite against the production build | **54 checks passed**, 7.2 minutes: 18 Chromium, 18 WebKit and 18 iPhone 14 emulation checks |
| Standalone measurement/archive guards | **44 checks passed** |
| Static checks and final build | Final full lint, scoped verifier lint and the normal production build with final public copy, including TypeScript checking, passed |
| Pages static export | Build with final public copy passed under `/after-tokens/` |
| Locally served Pages export | Artifact, media, source-replay and authored-snapshot verification passed; details below |
| Independent implementation review | No important issues reported |

These are local engineering results, not reader outcomes or physical-device testing. Eight fresh replay observations, three separate forced-fit trials, their raw records and two passive presentation captures are archived below. Both final-copy builds and local served-export verification passed. This document records the completed local gates; deployment and live verification belong to the commit-pinned delivery record.

The required gates are:

| Gate | Evidence required |
| --- | --- |
| Causal estimate | Commit mode uses only current committed non-EOS fragments before the earliest known EOS and excludes drafts/candidates/bounds/received counts; snapshot mode uses only its latest current candidate; neither reads future answer data |
| Snapshot lifecycle | Candidate words never enter the protected page before finality; candidate storage clears on final/stop/error/revision/reset; correct-looking nonfinal input remains provisional; final-only source starts with five rows |
| Sizing | Heuristic and 5–14 row limits; actual font/line-height; preserved waiting maximum; width/font reset; interrupted 380 ms growth from current visible height |
| Final fit | Exact text measured only after finality; greater-than-1-px underallocation triggers one nominal 180 ms fit; surplus room shrinks without hiding text |
| Visual timing | Actual source-finality to complete-visibility delay measured separately from authored duration and source-policy costs |
| Arrival | Whole-text opacity 1; authored translateY 1.5 px → −0.2 px → 0 over 180 ms; no blur, scale, weight change or word stagger; measure subsequent stability |
| Accessibility/lifecycle | Motion-off, reduced, paused and hidden bypass; stale run callbacks rejected; no deferred completion replay; named regions and fitting status |
| Adaptive material | Fourteen persistent rows, synchronized glimmer on later revealed rows, bounded division and neighbor gaps, no overflow |
| Export | Normal build, Pages build/base path, exact replay, current material and actual recording hashes |

## Locally served Pages export

The final static export, including both video posters, was served at `http://127.0.0.1:3010/after-tokens/` and verified in Chromium 148.0.7778.96 at 390 × 844 on **9 September 2026, 22:12:58.050 UTC**. The generated local report is `output/playwright/anchored-skeleton-pages-verification.json`. It records:

- HTTP 200, the intended title and canonical URL, current `adaptive-cell-skeleton-v5` material, and 21 assets using the `/after-tokens/` prefix.
- Exact final text for the real sleep-tips and sky-blue sources at their original observed capture-loop replay speeds.
- Exact downloaded bytes and SHA-256 matches for all four videos: two diagnostic recordings and two passive presentation captures.
- Both visible showcase elements reaching `readyState: 4` with `mediaError: null`; their complete untrimmed media durations are 11.2 and 11.0 seconds.
- Exact downloaded hashes for both video posters, matched to their separate provenance manifest.
- Exact hashes for the three supplied Google-reference images.
- The authored snapshot exercise preserving a complete-looking nonfinal candidate off the protected page, reserving 11 provisional rows, and displaying the exact final answer after explicit finality.
- An empty verification `errors` list.

Two Chromium media requests also recorded `net::ERR_ABORTED` during metadata loading. They remain in the separate `mediaCancellations` field. The media elements decoded successfully and full-file downloads matched their expected bytes; this is **not** reported as zero failed requests. This local export check verifies delivered artifacts and behavior. It is not the production deployment or a physical-iPhone test.

## Instrumented browser observations

The [current motion report](anchored-skeleton-motion-validation-2026-09-09.json) contains eight observations from Chromium 148.0.7778.96: still, breathe and reshape at 390 × 844 and 1380 × 900 on the short sleep-tips recording, plus narrow reshape runs for the longer sky-blue output and the poor random-sampler output. All explicitly use **0.5× source inspection**. The original observed source clock remains recorded separately; these are not API-latency observations.

| Observed property | Result and scope |
| --- | --- |
| Final output | Exact source text in all eight cases, one nonempty text update each, no sampled pre-final protected text and no measured horizontal overflow |
| Arrival movement | Maximum sampled first-visible-to-extreme displacement **1.69983 px**, consistent with the intentional 1.5 → −0.2 → 0 px whole-answer settle; maximum internal relative-layout difference **0.000061 px** |
| After settling | **7,330 matched final-word-first-glyph samples**, with maximum displacement **0 px** from the post-settle baseline established at least 220 ms after visibility |
| Waiting allocation | The longer sky-blue case grew from **5 to 10 rows**, 121.875 → 243.75 px, then fit the 219.375 px final page. The other cases stayed at five rows and shrank to their smaller final pages. |
| Additional visual wait | Source completion and full visibility occur in the same sampled frame in all eight cases. **None exercises the hidden underallocation fit.** These zeros are sampled coincidence, not zero product/compositor latency or a measured bound on the nominal 180 ms fit. |
| Anchoring and separation | Maximum sampled left-anchor error and row-position drift **0 px**; right-anchor error at most **0.015625 px**; minimum visible neighbor gap **0.015625 px**. No sampled neighbor overlap. |
| Glimmer | All 43 cell-local animations have a measured phase spread of **0 ms** in the reshape observations, including mounted rows not yet shown |

The report contains 877 sampled frames and 15,179 post-introduction ink-edge comparisons. Samples are repeated observations of the same small set of outputs, not independent readers or independent performance trials. The exact text, glyph and geometry checks support these local rendering contracts only. Underallocation has the separate forced-fit evidence below; final-only snapshots and interrupted-fit lifecycle branches also have automated test coverage. These eight ordinary replay recordings do not supply a nonzero fitting-delay estimate.

Dense per-frame inspection of all 43 pills imposes substantial measurement work. Loading rAF-gap p95 values were **150.9–216.7 ms**, including slow samples in the still condition; the largest observed gap was **733.4 ms**. There were no qualifying post-introduction edge comparisons at intervals of 34 ms or less. This instrumented session cannot substantiate ordinary playback smoothness or a frame-rate target, and it does not isolate the cost of the animation from inspection and recording overhead. Keep the diagnostic recordings distinct from the passive presentation captures, which omit dense per-frame geometry/style sampling but still incur browser recording overhead.

The [raw archive manifest](../data/experiments/anchored-skeleton-motion-2026-09-09/manifest.json) lists the eight compressed logs and their hashes. The report fingerprints 21 implementation files and three source fixtures, with measurement fingerprint `2c2e1c5e250e59811899cdc35dab083572dd59d81984d9331604af367d49edea`. The two retained diagnostic videos are [short output](../public/study/anchored-skeleton-mobile.webm) and [longer output](../public/study/anchored-skeleton-long.webm); their exact bytes and hashes are recorded in the JSON. These files are measurement artifacts, not a polished replacement capture or a physical-device recording.

## Forced underallocation trials

The separate [fit-stress report](anchored-skeleton-fit-stress-2026-09-09.json) exercises the branch unused by the eight ordinary replays. Each trial restarts the real sky-blue fixture to an active **five-row** frame, then deliberately forces its final event before gradual source-driven growth can prepare enough room. The complete final text stays hidden and the same ornament remains mounted while the frame fits, then one opaque answer appears and settles. This is an artificial rendering stress test, not a replay of the model’s capture timing.

| Trial | Viewport | First sampled source-complete → first sampled full visibility | Final frame height | Post-settle displacement |
| --- | --- | ---: | ---: | ---: |
| Chromium 148.0.7778.96 | 1280 × 720 | **200.1 ms** | 243.75 px | 0 px |
| WebKit 26.4 | 1280 × 720 | **204 ms** | 243.75 px | 0 px |
| iPhone 14 emulation, WebKit 26.4 | 390 × 664 | **195 ms** | 219.375 px | 0 px |

Every trial begins with a 121.875 px frame, preserves the exact fixture text and observes the 180 ms whole-answer arrival animation. Each records 1,080 post-settle glyph comparisons with zero movement. The observed visual delays exceed the authored 180 ms fit, as browser scheduling and sample timing are retained in the result rather than subtracted. They are **one trial per profile**, not a latency distribution, performance benchmark, hard upper bound, reader outcome or physical-device measurement.

The report fingerprints the same frozen implementation plus the test and source fixture. Its three per-project JSON records and raw Playwright report are archived under `data/experiments/anchored-skeleton-fit-stress-2026-09-09/`, with hashes listed in the report. The forced event establishes the start of this presentation observation; no model or request latency is inferred from it.

## Separate presentation captures

The site’s visible video examples use new passive captures, recorded from the same frozen implementation and source bytes in Chromium 148.0.7778.96 at 390 × 844. Their [capture manifest](anchored-skeleton-showcase-capture-2026-09-09.json) records the implementation fingerprint, capture script hash, source clocks and exact output checks. After setup, a full replay runs without a MutationObserver, rAF sampling, geometry reads or animation polling. The untrimmed recordings retain page loading, setup and scrolling. They contain no generated/interpolated frames or edited answer text.

| Presentation file | Source inspection | SHA-256 |
| --- | --- | --- |
| [Short answer](../public/study/anchored-skeleton-showcase-mobile.webm), 570,543 bytes | Sleep tips; 0.5× replay of 4,047.567 ms recorded source duration, yielding an 8,095.134 ms replay schedule | `7a6853836bfb739047c4fe2fdeecb493db53b2077d50bdcc0f81347436e1091f` |
| [Longer answer](../public/study/anchored-skeleton-showcase-long.webm), 803,682 bytes | Sky-blue explanation; 0.5× replay of 4,105.776 ms recorded source duration, yielding an 8,211.552 ms replay schedule | `6b312aa0f67f9a83f0aed47b23907a44e2a85a706f739a984594843f517c81e8` |

Those schedules are source replay durations, not the entire untrimmed video duration. Decorative timing is unchanged. The passive captures illustrate the actual browser treatment without the dense sampler, while preserving the diagnostic recordings under their original separate paths. They do not replace the raw measurement evidence, and recording overhead remains. No FPS, physical-iPhone, latency-improvement or reader-benefit conclusion is drawn from their appearance.

The player posters are unedited, browser-decoded frames obtained by seeking each verified video to five seconds. Their [poster manifest](anchored-skeleton-showcase-posters-2026-09-09.json) records the original video hashes, PNG hashes, 390 × 844 dimensions and capture-script fingerprint. The posters provide a visible preview while preserving the original videos and their untrimmed timing.

## Historical local checks, not v5 validation

The unpublished v4 implementation had local automated checks, but its observation run was halted when the design changed. Those checks covered the previous fixed-height material and do not validate v5. No completed v4 measurement report or publication is claimed.

The earlier `solid-rounded-skeleton-v1` results belong to revision `a7606d9` and remain in its [historical release record](skeleton-release-verification-2026-09-09.md). V2, v3 and v4 were not shipped. Neither those local checks nor older counts establish that v5 passes.

## Evidence scope and provenance

The estimate uses current committed fragments, or a current candidate when the source actually supplies revisable snapshots, plus available type/container metrics. Its packing factor, newline allowance, slack and row limits are authored heuristics, not a lower bound or accurate forecast. Candidate content can be noisy or shrink and is not promoted to committed text. Individual pills remain independent of actual words. The division metaphor does not depict decoder stages; glimmer does not estimate confidence or completion.

The [Google reference audit](google-diffusion-reference-audit-2026-09-09.md) covers 45 supplied JPEGs and three original images displayed in the site inspector. Those images provide qualitative reference evidence, not source events or timing. The separate authored 4.2-second snapshot exercise tests the integration contract; its draft inspector deliberately displays provisional text beside the protected view. Neither constitutes a connected Gemini adapter, a Google benchmark or a reader study.

After genuine source finality, actual final text is permitted in a hidden measurement page. During a necessary fit, the status says **answer received · fitting the view**. Cells then represent presentation preparation rather than continuing model work. Reduced motion and other inactive-motion states bypass that fit and the answer translation without changing source eligibility.

The observation plan separates source eligibility, actual visual arrival, fitting delay, pre-final frame growth, residual final correction, initial glyph travel and post-settle stability. It includes the three conditions at 390 × 844 and 1380 × 900, plus narrow long and poor-output examples. Explicit 0.5× source inspection exposes decorative cycles while retaining captured source times separately. It is not production API latency or a model speedup.

The harness must fingerprint runtime, scripts and sources before observation and verify those same bytes before archiving. Timing-sensitive observations run separately from heavy builds and test jobs. Height, left/width changes and division clipping can incur layout and painting; no compositor-only, low-power or physical-device performance claim follows from browser geometry.

The unchanged original availability report retains 60 exact final outputs, with source-eligibility costs measured across 57 nonempty original traces. Median whole-answer first eligibility is 15.8 seconds; the paired median additional first-passage wait over sentence release is 10.5 seconds. The new browser fit is an additional presentation cost outside those figures. [Availability report](../data/experiments/answer-policy-cost-2026-09-09.json).

Reader comfort, comprehension, perceived wait, preference and mistaken confidence remain unmeasured. Browser emulation is not physical iPhone testing; automated accessibility does not replace assistive-technology sessions. The [research note](anchored-skeleton-research-2026-09-09.md) records hypotheses and limits, while the [handoff](anchored-skeleton-handoff-2026-09-09.md) specifies the implementation.

## Reproduction

Run fresh checks after freezing the material and source-facing sizing behavior:

```bash
pnpm lint
pnpm typecheck
pnpm test
node --test scripts/test-anchored-skeleton-harness.mjs
pnpm build
pnpm test:e2e
```

The standalone guard suite is included in both [pull-request verification](../.github/workflows/ci.yml) and [Pages deployment](../.github/workflows/deploy-pages.yml). That is a future enforcement path, not evidence of a completed deployment.

The separate Pages build uses `GITHUB_PAGES=true pnpm build`. The [export verification script](../scripts/verify-anchored-skeleton-pages.mjs) accepts `VERIFY_URL` and `VERIFY_REPORT`. It checks the base path and canonical assets, current material, two actual Qwen replays, all four archived video files, all three original Google-frame bytes, and the authored snapshot exercise. The snapshot check requires growth beyond the initial five rows, withholding the complete-looking nonfinal candidate, and exact final output after explicit finality. The locally served export passed these checks as recorded above. Production publication status belongs to the commit-specific deployment result and separate live verification.

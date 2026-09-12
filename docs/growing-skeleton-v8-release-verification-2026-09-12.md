# After Tokens v8 — release verification

12 September 2026 · `growing-cell-skeleton-v8` · by globalanomalyindex

I verified the fuller growing skeleton and continuing sentence field with fresh source, browser and measurement evidence. The retained text handover and the subsequent container contraction are measured separately. This record does not carry v7 results forward as v8 results. The [implementation handoff](growing-skeleton-v8-handoff-2026-09-12.md) defines the current contract.

## Completed local checks

| Check | Actual result |
| --- | --- |
| Unit/component suite | 383 tests across 48 files passed |
| Browser suite | 72 passed across Chromium, WebKit and mobile-portrait; no retries, skips or failures |
| Current observer guards | 35 passed |
| Current plus historical harness files | 166 checks passed across four files |
| Lint | Passed |
| Final normal production and Pages export | Both passed, including TypeScript |
| Local served Pages verification | Passed: 21 exact script/style assets, both policy observations, both videos/posters, playback dimensions and authored welcome/transcript |
| Focused motion observations | Four passed; exact output and zero measured drift in settled reading-page text |
| Browser evidence attachments | Three forced-fit and three earlier-sentence records preserved with the full browser report |
| Presentation media | Two fresh passive videos and two separate screenshot posters |
| Reader outcomes and physical iPhone behavior | Not tested |

The final unit run began at 12:27:27 local time and took 10.36 s. The three-project browser run started at `2026-09-12T16:16:12.944Z` and took 430,033.18 ms. Its archived Playwright summary reports 72 expected passes, zero unexpected, zero flaky, zero skipped and no global errors. Six browser test files and the runtime sources were hashed before the run and checked unchanged during archival. [Full browser archive and provenance](growing-skeleton-v8-browser-validation-2026-09-12.json).

## Four focused observations

The [current motion report](growing-skeleton-v8-validation-2026-09-12.json) and [raw archive](../data/experiments/growing-skeleton-v8-2026-09-12/manifest.json) record the original `weather__random-b32` fixture at its 15.36-second recorded forward-pass clock. They cover sentence and whole-answer release at 390 × 844 and 1380 × 900. This is one source, not a new model corpus or a controlled comparison of perceived speed.

Chromium version: `148.0.7778.96`. Observation completion: `2026-09-12T16:25:47.715Z`. The shared fingerprint covers 27 runtime and measurement-source files:

```text
cc7fafe740e83e285763d0009913735ef97483d7fa8081d12491fe6fa0bfe2bd
```

| Case | Handovers | Maximum shown rows | Maximum clones | Source → near-full final ink (ms) | Source → text rest (ms) | Source → container rest (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 390-answer | 1 | 14 | 26 | 200.0 | 300.0 | 300.0 |
| 390-sentence | 4 | 7 | 6 | 200.7 | 300.7 | 467.3 |
| 1380-answer | 1 | 9 | 17 | 200.0 | 300.1 | 466.7 |
| 1380-sentence | 4 | 5 | 6 | 200.0 | 300.0 | 464.7 |

Near-full means sampled opacity at least .999. Text rest means the new ink has finished its arrival and residual activity is gone. Container rest additionally requires the final frame to fit the page with no running animation. Where surplus height remained, contraction completed about 165–167 ms after text rest; the nominal authored contraction is 180 ms. The narrow whole-answer case needed no separate contraction because its allocation already matched the final page. These sampling milestones are not hard wall-clock guarantees or model/network latency.

All four final pages exactly matched the original source. No sampled protected text or lexical mutation exceeded the independently reconstructed committed prefix. The whole-answer runs had one lexical update each; both sentence runs had four. Earlier readable passages retained their nodes and did not reanimate. Local settled-text displacement was 0 px in every focused case, with no incoherent geometry samples discarded.

The observer compared each transfer's stored origin against the immediately preceding visible field, only when that preceding sample was within 34 ms. Ten handovers had such comparisons, none were skipped, and the largest observed mismatch was approximately 0.0005 px. This is a finite sampled comparison with a 6 px acceptance tolerance, not a guarantee of exact continuous tracking. Borrowed originals were hidden while clones moved. Both sentence runs used at most six clones; first whole-answer arrivals used 26 and 17 respectively.

The waiting frame changed by 219.4, 253.5, 104.0 and 114.4 px across the four cases. These values describe total sampled height variation, not layout-shift scores or viewport glyph displacement. Exact final frame/page heights were 341.25 px at the narrow width and 182 px at the wide width. The field therefore grows and can move surrounding layout even while reading-page text remains locally stable.

An initial diagnostic observation stopped 400 ms after text rest and did not supply the required number of settled samples. That run failed the coverage guard. I extended the observer's post-text-rest window to 1,000 ms, retained the same requirement of more than 50 coherent samples and reran all four cases. The short-window diagnostic and prior scripts remain separate from the passing archive. Runtime source hashes and the already completed browser suite were unchanged by this instrumentation correction.

## Browser branch evidence

The full browser archive preserves the exact JSON attachments, not only their summaries. Three authored 240 px underallocation trials forced the existing sky-blue fixture to its final event. Each exercised eleven fitting frames, actual ink blending and the 280 ms transfer, with 0 px measured motion after text rest.

| Browser project | Forced source → near-full ink (ms) | Forced source → text rest (ms) | Fitting frames |
| --- | ---: | ---: | ---: |
| chromium | 415.8 | 498.3 | 11 |
| webkit | 379.0 | 499.0 | 11 |
| mobile-portrait | 366.0 | 466.0 | 11 |

These are single branch-stress observations, not a model-latency distribution or evidence of a typical user's wait.

The separate ten-second sentence replays each covered two batches. They compare settled glyphs with their first coherent baseline relative to the reading page and report absolute viewport movement separately.

| Browser project | Batches | Maximum clones | Coherent samples | Discarded samples | Local drift (px) | Viewport drift (px) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| chromium | 2 | 6 | 460 | 0 | 0.0 | 0.0 |
| webkit | 2 | 6 | 454 | 0 | 0.0 | 0.0 |
| mobile-portrait | 2 | 6 | 301 | 0 | 0.0 | 0.0 |

Those particular trials measured zero movement in both coordinate systems. They do not guarantee zero viewport movement in other layouts, scrolling conditions or longer answers. Browser emulation is not physical-device validation.

## Fresh presentation media

The [capture manifest](growing-skeleton-v8-showcase-capture-2026-09-12.json) records the same frozen implementation fingerprint and source as the focused observations. The narrow clip shows each sentence; the wide clip shows the whole-answer comparison. Both use the original 1× source clock, preserve setup/scrolling and retain the unedited model output. No per-frame observer runs during their full source replay; recording itself still adds overhead.

Posters are separate browser screenshots around 4.7 seconds and 1.3 seconds after replay. They are not decoded frames from the videos. Capture completion: `2026-09-12T16:26:55.999Z`.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| [growing-skeleton-v8-showcase-sentence-mobile.webm](../public/study/growing-skeleton-v8-showcase-sentence-mobile.webm) | 798,053 | `946fe4e28a15e7b96b8951bff851974276350f92f0bb13df963579aa35b75e91` |
| [growing-skeleton-v8-showcase-answer-wide.webm](../public/study/growing-skeleton-v8-showcase-answer-wide.webm) | 1,415,263 | `a081d40a8aa20f2c91a526df2ad0fe635394f5e615d2c2db60555f4a67ad7efe` |
| [growing-skeleton-v8-showcase-sentence-mobile.png](../public/study/growing-skeleton-v8-showcase-sentence-mobile.png) | 52,236 | `68ca0854370253c8a9d3d00c8069d66c914e31223b258c97eba1898b988bad9f` |
| [growing-skeleton-v8-showcase-answer-wide.png](../public/study/growing-skeleton-v8-showcase-answer-wide.png) | 107,178 | `9090a444d007ce331c55ea9e88e51e0c5956473a76519cfcf6b6c1285b03744e` |

The authored cinematic welcome is checked separately through its exact static text, transcript and controls. Its prewritten words and timings are a motion introduction, not source-fidelity evidence or a model-performance demonstration.

## Build and publication boundary

The served source was frozen after the new media and copy update. Final normal production and Pages export builds both passed, including TypeScript. The local Pages verifier passed at `2026-09-12T16:31:15.435Z`, with the same implementation fingerprint, 21 exact JavaScript/CSS files, whole-answer and sentence observations, and both new videos and posters matching their hashes. Both videos decoded at their expected dimensions, with finite durations of 17.92 and 17.72 seconds, readyState 4 and no media error. The static authored welcome and its single transcript matched; the report’s page/HTTP errors array was empty. This does not assert that every canceled request was observed. A local passing build does not establish that the public site serves the same revision.

Commit-specific GitHub author/committer identity, successful deployment, served asset/media hashes, exact live answers and any hosting diagnostics belong to the external final delivery proof. The final delivery builder requires a clean pushed `main` and successful matching deployment/live reports; it cannot infer those from this Markdown.

## Historical boundary and remaining limits

V7 remains at `9b42b6f0d744dae59cdc836e4438d6bb61e8419d`, material `ambient-cell-skeleton-v7`. Its [release record](ambient-skeleton-v7-release-verification-2026-09-12.md), eight observations, passive clips and posters retain their original scope and hashes. Earlier v5 and v6 records likewise remain historical. The site now presents the current v8 recordings and links the earlier evidence separately.

None of these checks measures comfort, comprehension, satisfaction, dopamine, comparative novelty or physical-device performance. The treatment combines several motion ingredients and a release policy; the proposed reader study must separate their costs and outcomes. Fidelity to a model's exact text does not establish that the answer is correct.

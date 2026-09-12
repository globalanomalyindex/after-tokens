# After Tokens v6: release verification

**12 September 2026 · globalanomalyindex · `responsive-cell-skeleton-v6`.**

This record separates the current source/copy audit, local engineering checks, fresh motion observations and publication. It does not promote earlier results to the current material. This is a local prepublication checkpoint based on published v5 commit `06da788390549574949c7cdcd938c3669820f214`. Commit-specific hosting and live evidence is retained in the delivery report produced after publication, rather than asserted by this source document.

## Requirement audit

I inspected the live page imports, each answer entrypoint and the corresponding implementation rather than inferring completion from one example.

| Requirement | Concrete inspection | Result |
| --- | --- | --- |
| Reshape initially selected in every live example | [SettleAnswer](../components/settle/settle-answer.tsx) defaults `ambient` to `reshape`. Hook, contract, voice and playground use [SettleStage](../components/settle/settle-stage.tsx), which does not override it. The three [application frames](../components/sections/section-previews.tsx), [phone context](../components/sections/section-concept.tsx) and [snapshot exercise](../components/settle/snapshot-study.tsx) also inherit it. [AmbientStudy](../components/settle/ambient-study.tsx) initializes its selected condition to `reshape`; its optional earlier-reading view explicitly uses it | Pass by source inspection and the final browser suite |
| The same comparison works at all widths | AmbientStudy renders only the selected condition, using an always-visible toggle; it does not branch between a wide three-condition view and a different narrow default | Pass by source inspection and all three browser profiles |
| Legacy forming renderer and controls removed from the live flow | SettleAnswer renders `state.passages` plus the cell field. Its `data-forming` is `cells`. SettleStage renders no preview control; the playground and contract control lists omit it. Compatibility `forming`, `preview` and `field` names remain accepted but do not select a second renderer | Pass for the live behavior; not a claim that all historical source/type names were deleted |
| Newly eligible text takes the handover; earlier text stays put | [useReadingSurface](../components/settle/use-reading-surface.ts) tracks visible and arriving lengths. The keyed [BubbleTransfer](../components/settle/bubble-transfer.tsx) owns completion. Only new passages receive the arrival state; nearby-cell borrowing is bounded while the source is receiving; terminal batches can use all available origins | Pass in the final suite; local reading-page stability is distinguished from viewport movement below |
| Web and motion design is primary | README, package description, page metadata, Open Graph copy, hero and colophon lead with web/motion design. The phone section is “the motion, in context,” and previews describe secondary browser applications | Pass |
| Authorship and reference wording | Visible credit, package author, license, metadata and Open Graph image use `globalanomalyindex`. The Google inspector and audit describe my frame archive or archived reference frames. Tracked prose was scanned for assistant-facing authorship and the removed reference wording | Pass; immutable historical machine reports retain original filesystem paths |
| Capability claims remain causal | [answer-envelope.ts](../lib/settle/answer-envelope.ts) estimates total space from permitted current input. [ambient-geometry.ts](../lib/settle/ambient-geometry.ts) derives row occupancy only from a contiguous committed prefix or current snapshot candidate. A 24% nonzero display footprint is an authored minimum; raw occupancy remains unchanged. Actual word targets are measured only after release. The app holds complete replay fixtures, but presentation helpers consume only delivered state | Pass by source inspection; no claim of known future layout, confidence or a connected Gemini API |
| Current handoff is discoverable | README, field chapter and [footer](../components/chrome/site-footer.tsx) link [the v6 handoff](responsive-skeleton-v6-handoff-2026-09-09.md). The footer’s latest-study link targets its research section. Local relative links in the README and handoff resolve | Pass |
| V5 media and measurements remain historical | The evidence chapter now displays fresh v6 clips and links v5 as historical evidence. V5 handoff/research/release Markdown has a historical marker. Its raw reports, recorded events, media and hash manifests have not been relabeled | Pass; v6 media has a separate manifest |
| Source costs do not masquerade as visual access | The cost chapter/table distinguish passage eligibility from browser arrival. The old forming-share statistic is labeled held text awaiting a boundary, not visible text. The 280 ms handover and optional 180 ms fit are excluded from historical source-policy timing | Copy corrected during this audit; values unchanged |

The static audit does not replace browser execution. It establishes that the requested behavior is wired into the live page and that the writing describes the current contract.

## Local checks known at this checkpoint

| Check | Status | Scope and evidence |
| --- | --- | --- |
| Full repository lint | Passed, 12 September | Final run confirmed after the completed copy and media changes |
| Normal production build including TypeScript | Passed, 12 September | Final production build passed with the completed copy, current media and introduction-width fix |
| Pages static export build | Passed, 12 September | Final `GITHUB_PAGES=true` build passed with the current base path and media |
| README/handoff relative-link check | Passed, 12 September | All local targets referenced by the current README, v6 handoff and copy audit exist |
| Whitespace/diff check | Passed, 12 September | `git diff --check` reported no errors at the audit checkpoint |
| Fresh full unit/component suite | Passed, 12 September | **363 tests across 43 files**, **9.65 seconds**, on the current integration checkout |
| Historical and current CI/harness guards | Passed, 12 September | **44 historical guards and 39 current v6 guards** passed in the final integration check |
| Fresh full browser suite | Passed, 12 September | **69 checks**, 23 each in Chromium, WebKit and mobile-portrait; **8.0 minutes**, no skipped, unexpected or flaky results. [Archived browser report](responsive-skeleton-browser-validation-2026-09-12.json) |
| Fresh v6 motion observations | Passed, 12 September | Eight sequential observations and all archive guards passed; [report](responsive-skeleton-motion-validation-2026-09-12.json), [raw archive](../data/experiments/responsive-skeleton-motion-2026-09-12/manifest.json) |
| Fresh passive videos and posters | Captured and archived, 12 September | Two v6 videos and two separate browser screenshot posters; narrow 390 × 844 and wide 1380 × 900. [Capture manifest](responsive-skeleton-showcase-capture-2026-09-12.json) |
| Hosting and publication verification | Recorded separately | The commit-specific delivery report establishes the final Pages/export, served assets, deployment and live checks; this local record does not establish those outcomes |

## Fresh v6 motion observations

The [motion report](responsive-skeleton-motion-validation-2026-09-12.json) identifies fingerprint `437552820794c6e42ca6716e224fa352fff693c2f9f4348f7be9378cce4241f1`. Eight observations ran sequentially from **14:42:22 to 14:43:50 UTC on 12 September** in Chromium **148.0.7778.96**: still/breathe/reshape with the sleep-list fixture at 390 × 844 and 1380 × 900, plus narrow reshape cases for the longer sky answer and failed random output. The source replay used an explicit 0.5× inspection clock; decorative timings were unchanged.

| Observed property | Result across these eight cases |
| --- | --- |
| Exact final text and no early protected text | 8/8; one nonempty answer-DOM update per case |
| First sampled DOM after first sampled source completion | 0 ms in each case; this is not visible access |
| First sampled positive ink opacity | 15.7–50.0 ms after sampled source completion |
| First sampled near-full ink opacity, threshold ≥ .999 | 199.9–233.3 ms after sampled source completion |
| First sampled settled/unoccluded readiness | 299.9–333.4 ms after sampled source completion |
| Post-arrival local glyph displacement | 0 px in the sampled rest comparisons; not a claim of zero viewport/scroll movement |
| Row-left anchor drift | 0 px in these observations |
| Natural underallocation-fit frames | 0; these cases do not measure the delayed fitting branch |
| Longer narrow sky case | Five to ten waiting rows; 121.875 px waiting growth; final frame and page both 219.375 px |
| Observer rAF-gap 95th percentile | 16.8–17.7 ms; diagnostic samples, not physical-device FPS or a comparison with v5 |

The opacity threshold is deliberately named: ≥ .999 is not mathematical equality to one, and it can be observed before the authored opacity-one keyframe. Near-full opacity also precedes the end of transfer and settling. These are first-sampled browser events, not precise source-to-paint guarantees or an estimate of model latency.

The v6 sampler reads styles/geometry and one animation subtree per frame. V5 used a different, substantially heavier inspection workload. Their frame-gap figures cannot establish a performance improvement. Raw samples and archived implementation hashes support the observations; passive presentation recordings are a separate artifact.

## Browser cases and passive presentation captures

The [final browser archive](responsive-skeleton-browser-validation-2026-09-12.json) preserves the exact test-source hashes and passing run, started at **14:33:49 UTC** and lasting **480.428 seconds**. Its 69 checks cover default conditions, all four policies, exact source finality, source switches, motion/visibility interruption, the joined-intro fallback, growing envelopes, snapshot compatibility, reduced motion, axe and the phone composition.

Three artificial underallocation cases constrained the answer surface to **240 px**, restarted a five-row frame, advanced only the decorative intro to 950 ms and forced the longer source to finality. These isolate fitting plus text handover, not live model timing:

| Browser profile | Sampled source completion → near-full opacity ≥ .999 | → settled readiness | Post-rest local movement |
| --- | ---: | ---: | ---: |
| Chromium | 399.8 ms | 500.6 ms | 0 px |
| WebKit | 396.0 ms | 520.0 ms | 0 px |
| Mobile-portrait emulation | 423.0 ms | 544.0 ms | 0 px |

Each trial retained the same composition while text remained hidden during fitting, then observed the 280 ms transfer. Each frame ended at 292.5 px with exact text. One observation per profile is branch evidence, not a latency distribution. The separate early-intro case checks the intact-capsule fade.

The ten-second earlier-reading cases observed two real released sentence batches in every browser. All measured local rest drift was **0 px**, with at most **six** transfer cells. Chromium retained 452 coherent rest samples and WebKit 353. Mobile retained **256** and rejected **9 of 265** because the page origin changed during geometry reads. Its absolute viewport glyph movement reached **46.25 px** while local positions stayed stable. Within-sample `scrollY` change was zero; scroll anchoring is a possible explanation, not an established cause. The test preserves the strict .05 px local tolerance and reports this coherence filter explicitly.

This corrects the earlier ambiguous 2 px finding: geometry reads had combined a changing page origin with glyph coordinates. The final run uses the first coherent resting baseline, requires more than 50 coherent samples, limits rejected samples to less than 25%, and records absolute viewport movement separately. It does not claim zero on-screen movement.

The [passive capture manifest](responsive-skeleton-showcase-capture-2026-09-12.json) records two fresh v6 videos under `public/study/responsive-skeleton-showcase-*`: a 390 × 844 sleep-list recording and a 1380 × 900 sky-answer recording. Both retain the unedited source and use 0.5× inspection; each exact final answer was checked after replay. Their posters are separate browser screenshots taken approximately 1.3 seconds into replay, not extracted video frames. The captures omit per-frame sampling, mutation observers, geometry reads and animation polling during replay. Untrimmed loading/setup/scrolling remains, and recording itself still has overhead. The manifest preserves source bytes, clock definitions, artifact hashes and the frozen implementation fingerprint.

## Measurement boundaries

The text handover lasts 280 ms by design. Its opacity-one keyframe is at 74%, or 207.2 ms nominal. An underallocated view can first fit toward the latest target using an authored 180 ms deadline; target changes during a fit for the same batch do not restart that full interval. A genuinely new batch can own a new deadline. Scheduling can extend observed elapsed time. These values are authored parameters, not measured latency guarantees.

Fresh observations must report the timing convention and instrumentation. In particular, a newly eligible passage can exist as hidden DOM before it becomes visible, and full opacity can precede the end of settling. A browser sample cannot collapse those into one “arrival” timestamp. A terminal handover fades the still-opening capsule in place, while an earlier release leaves it in the continuing field. A formed field transfers actual visible cells. Late source finality after all text is released fades the remaining field without reanimating old words; its optional vibration acknowledges that terminal handover. The final browser suite covers these branches.

The historical v5 reports remain useful for their own material only. The 347-case suite, 54 browser checks, eight dense observations, 7,330 post-settle glyph comparisons and three 195–204 ms forced-fit measurements belong to `adaptive-cell-skeleton-v5`. The later 360-case run from 9 September likewise precedes this final 12 September checkpoint. None is presented as fresh validation of the current v6 runtime.

Browser recording and measurement impose overhead. Dense frame sampling is not ordinary playback, emulation is not a physical iPhone, and a small collection of implementation checks is not a latency distribution. Exact output means fidelity to the source, including its flaws; it does not establish factual correctness.

## Publication

The delivery report produced after release names the commit, verification build, deployment outcome and live-check results. A successful local build does not establish publication, and this checkpoint does not substitute for that report. No reader study has been run; deployment cannot establish comfort, comprehension, perceived smoothness, preference or novelty priority.

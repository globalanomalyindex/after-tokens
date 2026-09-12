# after tokens

an independent web and motion design study of ambient skeleton loading and how generated text reaches a reader.

[live case study](https://globalanomalyindex.github.io/after-tokens/)

> **the question.** how do we make diffusion text rendering clean, simple, beautiful, and brand-able, so that the same answer feels better to read through presentation alone?

> **the current direction.** fuller rounded bars share the page with a few larger cells. the waiting area can grow from a coarse measure of content already received, while each row keeps an authored rhythm instead of tracing draft words. when text is eligible to appear, the visible material carries into its actual word groups through a 280 ms handover. each sentence can arrive this way; earlier readable text does not replay the effect.

| | |
| --- | --- |
| **role** | web design, motion design, interaction research, prototyping and front-end implementation |
| **built** | a responsive case-study website, interactive skeleton comparisons, brand controls, real source replays, an authored snapshot exercise, a Google reference inspector, secondary application sketches, source audits and a presentation-cost instrument |
| **status** | working research prototype. source fidelity and presentation costs are measured; reader comfort, comprehension, satisfaction and preference are untested. browser emulation is not physical iPhone validation. |
| **stack** | next.js, typescript, tailwind, vitest, playwright, axe-core |

## the interaction

reshape is the default in every live example. still and breathe remain optional comparison conditions, selected one at a time at every width. all four release policies use the same modern cell material. every preview starts with each sentence. whole-answer release remains available as a comparison where policy controls are exposed. revisable snapshots still wait for explicit finality because their candidates cannot supply committed sentences. palette and tempo are the two exposed brand controls.

waiting cells have no word identity. the initial five-row allocation can grow to fourteen from the approximate amount of currently received committed content, or a genuinely received revisable snapshot when that source capability exists. at the same width it retains its largest estimate. it does not read future answers, uncommitted positional drafts, request bounds or guessed final formatting. after earlier passages become readable, their measured rows are subtracted from the budget and at least four ambient rows remain. a final-only source stays at the initial allocation until its result arrives.

individual row widths remain authored. fourteen persistent rows alternate long, stable lines with two or three larger cells. a changing row receives one 1.3–1.8 second transition, then holds its geometry until the next independently seeded cue, 4.2–6.6 seconds apart. targets do not move between cues. active source-only height estimates are sampled every 600 ms; height changes ease over 380 ms. source release, finality and layout changes bypass that sampling gate. breathing and an occasional shared glimmer retain continuity. this is bounded seeded variation, not an infinitely unique animation or a representation of confidence, decoder stages or percentage complete.

once a batch meets its release policy, the browser measures its actual word groups and captures the bubbles currently visible, before moving the continuing field below the new text. a **280 ms** handover moves and reshapes those bubbles toward the groups while new ink fades in: opacity reaches one at **74% / 207.2 ms nominal**, and a small vertical settling motion ends at 280 ms. this correspondence is created after release. continuing batches, and final batches with earlier readable text, borrow at most six nearby cells; the rest of a terminal field fades. a first batch that is already the complete answer can use the visible field. borrowed originals stay hidden during transfer. the reserved frame is held while terminal activity and new ink settle over 280 ms; surplus height contracts over 180 ms only afterward. if all characters were already readable at source completion, only the remaining field fades before that contraction. visual-ready means the text has settled, not that the container has finished moving. earlier words retain their nodes and do not reanimate. there is no left-to-right delay or letter blur.

if the released text needs more room, a nominal **180 ms** fit comes first, with a deadline preserved when the target changes for that same batch; otherwise the handover starts as the frame adjusts. motion-off, reduced motion, pause and hidden states bypass the decorative fit and arrival. these authored durations are not hard wall-clock guarantees. source eligibility, first ink, full opacity and motion completion are distinct timings; browser observations must report them separately.

solid cell bodies and a faint gradient glimmer draw on existing loading conventions. the [CSS Script reference](https://www.cssscript.com/skeleton-loader-placeholder/) points to zalog's loader, whose source uses solid rows and a traveling gradient; [MUI](https://mui.com/material-ui/react-skeleton/) already provides pulse, wave and static variants. I treat these as prior art. the contribution is the ambient choreography and release-time material handover explored here, not the invention of a rounded skeleton.

## why diffusion, and what the captures actually show

masked diffusion predicts candidates at many open positions together. the sampler chooses which positions become fixed, sometimes inside a sequential block schedule. prediction, commitment and semantic completeness are different events. a conventional typing presentation can expose useful text early, but need not reflect the sampler's order.

the original corpus contains 60 trajectories from `dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1`: twenty prompts, three sampler configurations, greedy decoding on an apple m3. **all 60 use 128 steps for 128 positions: one token commitment per step, 7,680 commitments in 7,680 steps.** they show parallel predictions and out-of-order commitments, not simultaneous multi-token commitment. a single new boundary can unlock several previously committed pieces for display.

four new experimental runs use 32 steps for 128 positions and commit four positions per step. their online candidate data and exact final decodes pass the capture validators. weather, sky-blue and sleep-tips under the low-confidence sampler have 4, 18 and 5 steps with multiple content-token commitments; the random sleep-tips run has 32. token batches are not automatically complete words or useful ideas. the retained outputs include repetition, “Avoid enough caffeine,” and numerical gibberish. they are evidence about decoding behavior, not production answer quality. [captures, provenance and validation](data/experiments/README.md).

formatting sometimes precedes nearby text, but does not universally come first. the structure audit finds 32 of 36 original final list markers precede their first body word's last token, while only 45 of 138 newlines precede both neighboring words' last tokens. those labels are retrospective; an isolated `1.` could still become a decimal. an application-owned structure or enforced grammar can justify early containers, while a prompt asking for a list cannot guarantee them. [structure audit](data/experiments/structure-timing-2026-09-09.json).

I reviewed a Gemini Diffusion frame archive showing revisions at several locations, changing text extent and an inconsistent nearly complete-looking draft. its differently labeled real-time and slowed sequences have no timing metadata. my [45-frame audit](docs/google-diffusion-reference-audit-2026-09-09.md) records archive provenance, observations and limits; the site provides three original frames for inspection. Google's [overview](https://deepmind.google/models/gemini-diffusion/) describes iterative block generation, but does not document the integration events shown here. the separate [DiffusionGemma explanation](https://ai.google.dev/gemma/docs/diffusiongemma/explained) describes revisable 256-token canvases and sequential finalized blocks; that architecture is not attributed to Gemini Diffusion.

an [authored 4.2-second snapshot exercise](lib/settle/snapshot-study.ts) tests compatibility with revisable input. the current candidate appears in a labeled draft inspector; only its approximate amount can reserve height for the protected view. a complete-looking candidate at 2.9 seconds stays provisional until the explicit final event at 4.2 seconds. these are invented demonstration events and timing, not a Google recording or connected API. the cinematic opening scene is also explicitly authored: it introduces the motion concept rather than presenting model output or measured generation speed.

## the release contract

`lib/settle/` owns source eligibility and finality. the replay app holds complete recording fixtures, but only events up to the replay clock reach the reducer. the presentation helpers use that delivered state and do not inspect future fixture data. presentation cannot create eligibility or finality:

1. future final text, word widths and formatting are unavailable to the waiting renderer. current committed fragments or an optional revisable snapshot can supply only a coarse height estimate; individual bar shapes never copy their words or line layout.
2. all policies render released passages only. the whole-answer policy requires source finality; earlier policies require committed pieces and the relevant boundaries.
3. actual word targets can be measured only after that batch is eligible. waiting-cell positions never create eligibility.
4. palette and tempo do not alter the source, exact answer or 280 ms text-handover duration. newly arriving text changes opacity; already readable text stays at reading contrast and does not reanimate.
5. stopped and failed partial output is labeled separately, without a completion celebration.
6. a revisable source can send snapshots; only an explicitly final one reaches the protected page. a provisional candidate can reserve overall height without becoming a commitment or shaping individual bars. later revisions preserve the prior version and require review and apply.
7. reduced motion, motion-off, pause and hidden states bypass decorative fitting and arrival while preserving source finality. animation completion is presentation state, never model completion.

## the cost of one arrival

these figures come from the [whole-answer policy report](data/experiments/answer-policy-cost-2026-09-09.json). latency summaries use 57 nonempty original traces; three empty answers remain in the 60-output fidelity audit. the clock is the capture's synchronized model forward-pass time, not network or end-to-end product latency. release times are reducer eligibility, not measured browser paint.

| measure | each word | each sentence | each paragraph | whole answer |
| --- | ---: | ---: | ---: | ---: |
| median first passage eligible | 1.4 s | 4.6 s | 15.6 s | 15.8 s |
| mean of per-trace character-mean hold after joining the committed prefix | 0.4 s | 3.0 s | 5.5 s | 6.3 s |
| exact final output | 60/60 | 60/60 | 60/60 | 60/60 |
| released characters before commitment | 0 | 0 | 0 | 0 |

across the 57 matched nonempty runs, the median additional wait for the first passage under whole-answer versus sentence release is **10.5 seconds**. this is the median of paired differences, not the subtraction of the two medians above. a paragraph boundary can precede source finality; paragraph and whole-answer policies are not interchangeable. the optional size fit and 280 ms handover are additional browser presentation costs outside these source-eligibility figures.

the original step-based report remains in `lib/traces/settle.json`. the newer four-position experiments are separate from the original corpus, and use a different capture-clock definition; their timing must not be treated as a controlled speedup. a faster replay changes presentation speed, not model performance.

## research and design rationale

the familiar skeleton is the starting point, not a new invention. [Fluent guidance](https://fluent2.microsoft.design/components/web/react/core/skeleton/usage) favors simple high-level structure and warns against using skeletons when structure is unknown; this project explicitly tests that boundary for generated text. [Apple’s spring guidance](https://developer.apple.com/videos/play/wwdc2023/10158/) motivates continuity and restraint, but this CSS treatment is not a physical spring and makes no velocity-continuity guarantee. [layout-shift guidance](https://web.dev/articles/optimize-cls) motivates reserving room before content arrives; growing that room can still move the viewport and is not zero CLS. common-fate research supplies context for the shared glimmer, while live-caption research motivates leaving readable text still. these sources justify design questions and constraints, not reader-benefit claims.

the reviewed skeleton comparison used 14 participants and found no significant advantage over spinners; it does not establish equivalence. progress-bar findings cannot supply an effect size for these cells. the case study claims no dopamine mechanism, universal Zeigarnik benefit or guaranteed peak-end improvement.

[the current v8 handoff](docs/growing-skeleton-v8-handoff-2026-09-12.md) records the fuller material, coarse sizing, source contract, implementation instructions and research rationale. exact word geometry begins at eligible text. integrations need a trustworthy release/finality contract; the optional height estimate does not solve that protocol.

## verification and historical evidence

the current v8 treatment passed **383 unit/component tests across 48 files, 72 browser checks and 35 current observer guards**, plus lint. all four current/historical harness files passed 166 checks in total. [four focused observations](docs/growing-skeleton-v8-validation-2026-09-12.json) tested the original weather recording under sentence and whole-answer release at two widths. all final text remained exact, with zero measured drift in settled reading-page text. both sentence runs had four handovers and at most six borrowed cells. final near-full opacity took 200–201 ms after sampled source completion; text rest took about 300 ms. where the frame had excess room, its separate contraction finished at 465–467 ms. the [v8 release record](docs/growing-skeleton-v8-release-verification-2026-09-12.md) records these costs, three-browser fit/earlier-reading checks and the [two passive recordings with separate posters](docs/growing-skeleton-v8-showcase-capture-2026-09-12.json). source fidelity is not factual correctness. reader outcomes and physical-device performance remain unmeasured.

the published v7 treatment at `9b42b6f0d744dae59cdc836e4438d6bb61e8419d` passed **368 unit/component tests across 44 files, 69 browser checks and 48 harness guards**, plus lint and the production build with TypeScript. [eight instrumented observations](docs/ambient-skeleton-v7-motion-validation-2026-09-12.json) kept five waiting rows with zero waiting-frame growth, exact final text and no early protected answer. sampled local episodes had geometric rests and zero cell drift during those rests. these short observations do not cover a complete 10.8-second score round or establish perceived calm.

seven cases reached near-full opacity 199.9–250 ms after sampled source completion and settled/unoccluded readiness in 299.9–350 ms. the ordinary narrow sky-blue case exercised the fixed allocation’s tradeoff: 12 fitting frames, 400 ms to near-full opacity and 500 ms to rest. all eight measured zero rested glyph displacement. the [v7 release record](docs/ambient-skeleton-v7-release-verification-2026-09-12.md) separates natural observations, authored fit stress, earlier reading and instrument limits. two [passive browser recordings](docs/ambient-skeleton-v7-showcase-capture-2026-09-12.json) and separate screenshot posters show the same frozen material without per-frame measurement. older results are not reused as current evidence.

the published v6 baseline is `ca43a251bd095f37dad35163ccc1aad682d06371`, material `responsive-cell-skeleton-v6`. its **363 unit/component tests, 69 browser checks, 39 current harness guards** and [eight instrumented observations](docs/responsive-skeleton-motion-validation-2026-09-12.json) remain historical evidence for v6. its [passive recordings](docs/responsive-skeleton-showcase-capture-2026-09-12.json) show the previous draft-responsive material. none of those results is reused as a current v8 measurement.

the archived `adaptive-cell-skeleton-v5` revision at `06da788390549574949c7cdcd938c3669820f214` passed **347 unit/component cases, 54 browser checks across three profiles and 44 measurement/archive guards**, plus lint, TypeScript and both hosting builds. its eight [instrumented observations](docs/anchored-skeleton-motion-validation-2026-09-09.json) retain exact output and **7,330 post-settle glyph samples with zero displacement**. its two [passive captures](docs/anchored-skeleton-showcase-capture-2026-09-09.json) remain archived as historical v5 examples. v6 recordings likewise remain separately archived.

three archived v5 [forced-fit trials](docs/anchored-skeleton-fit-stress-2026-09-09.json) measured **200.1 ms Chromium, 204 ms WebKit and 195 ms iPhone 14 emulation** from forced completion to full text visibility. these artificial branch tests are not model latency, a distribution, physical-device results or current v8 measurements. the [v5 release record](docs/anchored-skeleton-release-verification-2026-09-09.md) retains build and served-export evidence, including media-request cancellation details. historical data and hashes remain unchanged.

## earlier work and the audit

the september 6 reveal used future answer geometry. the september 7 causal audit found 700 of 3,880 words drawn in their final spelling before all constituent tokens committed, an early length claim in 42 of 60 runs, and a phrase-order claim contradicted by its own report. these findings motivated the source contract and remain in the [design record](docs/redesign.md).

the first september 9 stabilization kept token identity and removed committed-letter blur, but its single controlled mobile-width chromium observation did not improve the worst identical committed-glyph displacement: 280.6 px after versus 276.5 px before. that result belongs to the previous renderer, not the new ambient composition. [measurement and limitations](docs/motion-validation-2026-09-09.json).

the [written case study](docs/case-study.md), [research note](docs/research-note.md), [earlier motion handoff](docs/motion-direction-2026-09-09.md) and [original release specification](docs/superpowers/specs/2026-09-07-settle-design.md) preserve the development record. the v8 handoff describes the current material; ambient-v7 documents preserve the fixed-field score, responsive documents preserve v6 and anchored documents preserve v5. the earlier 268 tests, 42 browser checks, eight observations and 9,667 matched final-glyph samples belong to the feathered revision `05914c1`, recorded in its [historical handoff](docs/ambient-handoff-2026-09-09.md) and [measurement report](docs/ambient-motion-validation-2026-09-09.json). they are not reused as validation of the solid bars. no reader benefit or physical iPhone behavior has been measured.

## run

```bash
pnpm install
pnpm dev
```

| script | what it does |
| --- | --- |
| `pnpm dev` | development server |
| `pnpm build` | production build |
| `pnpm check` | lint, types, tests and build |
| `pnpm test` | unit tests, including reducer and corpus behavior |
| `pnpm test:e2e:chromium` | chromium accessibility, motion, identity, legibility, playback and final-output checks |
| `pnpm test:e2e` | browser suite across chromium, webkit and an emulated mobile-portrait profile; not a physical iPhone test |
| `pnpm traces:settle` | regenerate the main policy cost report and causal audit |
| `pnpm traces:index` | regenerate the trace index after a capture |

## deploys

github pages builds main with `GITHUB_PAGES=true`, which switches to a static export under the `/after-tokens` base path.

## credits

designed and built by globalanomalyindex. my design record follows the causal audit and first reading contract of 7 september 2026 under the name margin, then the motion revisions, source experiments and evidence refresh of 9 september. recorded trajectories and text are cc by 4.0; code is mit.

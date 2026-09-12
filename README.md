# after tokens

an independent web and motion design study of ambient skeleton loading and how generated text reaches a reader.

[live case study](https://globalanomalyindex.github.io/after-tokens/)

> **the question.** how do we make diffusion text rendering clean, simple, beautiful, and brand-able, so that the same answer feels better to read through presentation alone?

> **the current direction.** one rounded capsule opens into five breathing rows. a small group occasionally divides, gathers or redistributes space, followed by a deliberate rest. this waiting composition follows its own clock and seed rather than reacting to the draft. when text is eligible to appear, the visible bubbles carry into its actual word groups through the retained 280 ms handover. earlier readable text does not replay the effect.

| | |
| --- | --- |
| **role** | web design, motion design, interaction research, prototyping and front-end implementation |
| **built** | a responsive case-study website, interactive skeleton comparisons, brand controls, real source replays, an authored snapshot exercise, a Google reference inspector, secondary application sketches, source audits and a presentation-cost instrument |
| **status** | working research prototype. source fidelity and presentation costs are measured; reader comfort, comprehension, satisfaction and preference are untested. browser emulation is not physical iPhone validation. |
| **stack** | next.js, typescript, tailwind, vitest, playwright, axe-core |

## the interaction

reshape is the default in every live example. still and breathe remain optional comparison conditions, selected one at a time at every width. all four release policies use the same modern cell material; the earlier source-interval renderer and its preview controls are removed from the live flow. palette and tempo are the two exposed brand controls.

waiting cells have no word identity and do not estimate answer length. five authored rows occupy the waiting area; after earlier passages become available, a two-row remainder stays below them. container typography sets their spacing, but drafts and committed fragments do not change their widths or waiting height. exact text geometry is measured only after that text meets its release policy.

the ambient score favors occasional change over constant reshaping. at a fixed tempo, one row receives a 900–1,300 ms episode to split, gather or rebalance its cells, followed by a deliberate geometric rest. four active rows take turns in a newly seeded order over each 10.8-second round; the first row stays quiet. the seed varies the sequence, while soft breathing and an occasional shared glimmer retain continuity. a pause is a choreographic rest, not evidence that the model has stopped. none of these shapes represents confidence, decoder stages or a completion percentage.

once a batch meets its release policy, the browser measures its actual word groups and captures the visible bubbles. a **280 ms** handover moves and reshapes those bubbles toward the groups while new ink fades in: opacity reaches one at **74% / 207.2 ms nominal**, and a small vertical settling motion ends at 280 ms. this is a visual correspondence after release, not a claim that every bubble was already a word. while the source is still receiving, new batches borrow only a few nearby cells; a terminal batch can use all visible cells. a terminal handover fades a still-opening capsule in place, while an earlier release leaves it in the continuing field. neither waits for the introduction to finish. earlier passages keep their nodes and do not repeat the arrival. there is no left-to-right delay or letter blur.

if the released text needs more room, a nominal **180 ms** fit comes first, with a deadline preserved when the target changes for that same batch; otherwise the handover starts as the frame adjusts. motion-off, reduced motion, pause and hidden states bypass the decorative fit and arrival. these authored durations are not hard wall-clock guarantees. source eligibility, first ink, full opacity and motion completion are distinct timings; browser observations must report them separately.

solid cell bodies and a faint gradient glimmer draw on existing loading conventions. the [CSS Script reference](https://www.cssscript.com/skeleton-loader-placeholder/) points to zalog's loader, whose source uses solid rows and a traveling gradient; [MUI](https://mui.com/material-ui/react-skeleton/) already provides pulse, wave and static variants. I treat these as prior art. the contribution is the ambient choreography and release-time material handover explored here, not the invention of a rounded skeleton.

## why diffusion, and what the captures actually show

masked diffusion predicts candidates at many open positions together. the sampler chooses which positions become fixed, sometimes inside a sequential block schedule. prediction, commitment and semantic completeness are different events. a conventional typing presentation can expose useful text early, but need not reflect the sampler's order.

the original corpus contains 60 trajectories from `dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1`: twenty prompts, three sampler configurations, greedy decoding on an apple m3. **all 60 use 128 steps for 128 positions: one token commitment per step, 7,680 commitments in 7,680 steps.** they show parallel predictions and out-of-order commitments, not simultaneous multi-token commitment. a single new boundary can unlock several previously committed pieces for display.

four new experimental runs use 32 steps for 128 positions and commit four positions per step. their online candidate data and exact final decodes pass the capture validators. weather, sky-blue and sleep-tips under the low-confidence sampler have 4, 18 and 5 steps with multiple content-token commitments; the random sleep-tips run has 32. token batches are not automatically complete words or useful ideas. the retained outputs include repetition, “Avoid enough caffeine,” and numerical gibberish. they are evidence about decoding behavior, not production answer quality. [captures, provenance and validation](data/experiments/README.md).

formatting sometimes precedes nearby text, but does not universally come first. the structure audit finds 32 of 36 original final list markers precede their first body word's last token, while only 45 of 138 newlines precede both neighboring words' last tokens. those labels are retrospective; an isolated `1.` could still become a decimal. an application-owned structure or enforced grammar can justify early containers, while a prompt asking for a list cannot guarantee them. [structure audit](data/experiments/structure-timing-2026-09-09.json).

I reviewed a Gemini Diffusion frame archive showing revisions at several locations, changing text extent and an inconsistent nearly complete-looking draft. its differently labeled real-time and slowed sequences have no timing metadata. my [45-frame audit](docs/google-diffusion-reference-audit-2026-09-09.md) records archive provenance, observations and limits; the site provides three original frames for inspection. Google's [overview](https://deepmind.google/models/gemini-diffusion/) describes iterative block generation, but does not document the integration events shown here. the separate [DiffusionGemma explanation](https://ai.google.dev/gemma/docs/diffusiongemma/explained) describes revisable 256-token canvases and sequential finalized blocks; that architecture is not attributed to Gemini Diffusion.

an [authored 4.2-second snapshot exercise](lib/settle/snapshot-study.ts) tests compatibility with revisable input. the current candidate appears in a labeled draft inspector while the protected view keeps its independent waiting composition. a complete-looking candidate at 2.9 seconds stays provisional until the explicit final event at 4.2 seconds. these are invented demonstration events and timing, not a Google recording or connected API.

## the release contract

`lib/settle/` owns source eligibility and finality. the replay app holds complete recording fixtures, but only events up to the replay clock reach the reducer. the presentation helpers use that delivered state and do not inspect future fixture data. presentation cannot create eligibility or finality:

1. future final text, word widths and formatting are unavailable to the waiting renderer. the waiting composition does not inspect draft text or committed fragments.
2. all policies render released passages only. the whole-answer policy requires source finality; earlier policies require committed pieces and the relevant boundaries.
3. actual word targets can be measured only after that batch is eligible. waiting-cell positions never create eligibility.
4. palette and tempo do not alter the source, exact answer or 280 ms text-handover duration. newly arriving text changes opacity; already readable text stays at reading contrast and does not reanimate.
5. stopped and failed partial output is labeled separately, without a completion celebration.
6. a revisable source can send snapshots; only an explicitly final one reaches the protected page. the current candidate does not drive waiting geometry. later revisions preserve the prior version and require review and apply.
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

common-fate studies provide context for coordinated change, not a prescription for these cells. this version combines a soft breath with an occasional coordinated glimmer and discrete local episodes separated by rest. the aim is less constant activity, with enough variety to avoid an obvious repeating loop. whether that feels calm or stagnant is a reader-study question. apple's fluid-interface and spring demonstrations inform continuity and restraint; this CSS treatment is neither Apple's glass material nor a physical spring. live-caption research motivates stable text after arrival, not any specific waiting animation.
the controlled skeleton study reviewed here used 14 participants and found no significant advantage over spinners in perceived speed, navigation ease or article-finding time. it does not establish equivalence either. progress-bar appearance has affected perceived duration in other experiments, but their effect sizes cannot be transferred to diffusion. the case study claims no dopamine mechanism, universal Zeigarnik benefit or guaranteed peak-end improvement.

[the current v7 handoff](docs/ambient-skeleton-v7-handoff-2026-09-12.md) records the choreography, release contract, implementation instructions, research justification and acceptance gates. exact geometry begins at eligible text; the waiting design does not depend on a model exposing draft layouts. a trustworthy release/finality contract is still required, so this is not a universal solved integration.

## verification and historical evidence

the current v7 treatment passed **368 unit/component tests across 44 files, 69 browser checks and 48 harness guards**, plus lint and the production build with TypeScript. [eight instrumented observations](docs/ambient-skeleton-v7-motion-validation-2026-09-12.json) kept five waiting rows with zero waiting-frame growth, exact final text and no early protected answer. sampled local episodes had geometric rests and zero cell drift during those rests. these short observations do not cover a complete 10.8-second score round or establish perceived calm.

seven cases reached near-full opacity 199.9–250 ms after sampled source completion and settled/unoccluded readiness in 299.9–350 ms. the ordinary narrow sky-blue case exercised the fixed allocation’s tradeoff: 12 fitting frames, 400 ms to near-full opacity and 500 ms to rest. all eight measured zero rested glyph displacement. the [v7 release record](docs/ambient-skeleton-v7-release-verification-2026-09-12.md) separates natural observations, authored fit stress, earlier reading and instrument limits. two [passive browser recordings](docs/ambient-skeleton-v7-showcase-capture-2026-09-12.json) and separate screenshot posters show the same frozen material without per-frame measurement. older results are not reused as current evidence.

the published v6 baseline is `ca43a251bd095f37dad35163ccc1aad682d06371`, material `responsive-cell-skeleton-v6`. its **363 unit/component tests, 69 browser checks, 39 current harness guards** and [eight instrumented observations](docs/responsive-skeleton-motion-validation-2026-09-12.json) remain historical evidence for v6. its [passive recordings](docs/responsive-skeleton-showcase-capture-2026-09-12.json) show the previous draft-responsive material. none of those results is reused as a v7 measurement.

the archived `adaptive-cell-skeleton-v5` revision at `06da788390549574949c7cdcd938c3669820f214` passed **347 unit/component cases, 54 browser checks across three profiles and 44 measurement/archive guards**, plus lint, TypeScript and both hosting builds. its eight [instrumented observations](docs/anchored-skeleton-motion-validation-2026-09-09.json) retain exact output and **7,330 post-settle glyph samples with zero displacement**. its two [passive captures](docs/anchored-skeleton-showcase-capture-2026-09-09.json) remain archived as historical v5 examples. v6 recordings likewise remain separately archived.

three archived v5 [forced-fit trials](docs/anchored-skeleton-fit-stress-2026-09-09.json) measured **200.1 ms Chromium, 204 ms WebKit and 195 ms iPhone 14 emulation** from forced completion to full text visibility. these artificial branch tests are not model latency, a distribution, physical-device results or v6 measurements. the [v5 release record](docs/anchored-skeleton-release-verification-2026-09-09.md) retains build and served-export evidence, including media-request cancellation details. historical data and hashes remain unchanged.

## earlier work and the audit

the september 6 reveal used future answer geometry. the september 7 causal audit found 700 of 3,880 words drawn in their final spelling before all constituent tokens committed, an early length claim in 42 of 60 runs, and a phrase-order claim contradicted by its own report. these findings motivated the source contract and remain in the [design record](docs/redesign.md).

the first september 9 stabilization kept token identity and removed committed-letter blur, but its single controlled mobile-width chromium observation did not improve the worst identical committed-glyph displacement: 280.6 px after versus 276.5 px before. that result belongs to the previous renderer, not the new ambient composition. [measurement and limitations](docs/motion-validation-2026-09-09.json).

the [written case study](docs/case-study.md), [research note](docs/research-note.md), [earlier motion handoff](docs/motion-direction-2026-09-09.md) and [original release specification](docs/superpowers/specs/2026-09-07-settle-design.md) preserve the development record. the v7 handoff describes the current material; responsive documents preserve v6 and anchored documents preserve v5. the earlier 268 tests, 42 browser checks, eight observations and 9,667 matched final-glyph samples belong to the feathered revision `05914c1`, recorded in its [historical handoff](docs/ambient-handoff-2026-09-09.md) and [measurement report](docs/ambient-motion-validation-2026-09-09.json). they are not reused as validation of the solid bars. no reader benefit or physical iPhone behavior has been measured.

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

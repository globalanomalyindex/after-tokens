# after tokens

an independent product design and engineering case study on how an answer from a diffusion language model should reach a reader.

[live case study](https://globalanomalyindex.github.io/after-tokens/)

> **the question.** how do we make diffusion text rendering clean, simple, beautiful, and brand-able, so that the same answer feels better to read through presentation alone?

> **the current direction.** one rounded capsule divides into a field that gradually makes room for the answer. solid rows and smaller pills breathe, reshape and occasionally glimmer. its size follows a rough estimate from available source content and the container’s type metrics, never a hidden future answer. committed positions and revisable candidates stay distinct. at source finality, a short size handoff can prepare missing room before the whole answer appears with one small settling motion. this presentation trades some earlier reading for a single arrival; both the source-policy wait and final handoff delay must be measured.

| | |
| --- | --- |
| **role** | product design, interaction design, research, prototyping and front-end engineering |
| **built** | a causal replay adapter and pure release reducer, a still/breathe/reshape skeleton comparison, an authored snapshot exercise, a supplied Google reference inspector, earlier-text alternatives, brand controls, product and phone frames, a policy cost instrument, source audits and research notes |
| **status** | working research prototype. source fidelity and presentation costs are measured; reader comfort, comprehension, satisfaction and preference are untested. browser emulation is not physical iPhone validation. |
| **stack** | next.js, typescript, tailwind, vitest, playwright, axe-core |

## the interaction

the cells form a waiting composition, not a preview of exact words or a completion percentage. no pill maps to a real token. the recorded Qwen source sizes the field from current committed non-end content and container/type metrics. if an integration actually supplies revisable snapshots, the current candidate can instead prepare approximate space while its words stay out of the protected reading surface. a final-only source starts with five rows. any estimate may under- or overallocate, so smooth size changes and final correction are presentation choices, not guaranteed formatting predictions.

the whole-answer source policy establishes finality after a committed end is reached by the contiguous prefix, a valid explicit finish, or an explicitly final snapshot. a predicted end, punctuation, stop, error or animation endpoint cannot complete the source. after real finality, the renderer can measure the actual final layout. if more room is needed, a nominal 180 ms size fit retains the cells before the full answer becomes visible; otherwise text appears immediately while excess room shrinks. motion-off, reduced motion, pause or hidden states bypass this decorative delay. all words then share one 180 ms, full-opacity settling movement, followed by stillness; a separate 260 ms thin outline accompanies their arrival. the fit duration is authored, not a strict wall-clock bound; actual browser delay is measured separately.

the motion comparison keeps source events, policy and final handover rules identical across **still**, **breathe** and **reshape**. still holds the authored row-and-pill arrangement; breathe adds a shared 4.8-second opacity cycle. reshape combines a 950 ms capsule-division introduction, interior pill appearance, neighbor redistribution, a small local settle and an occasional synchronized glimmer. its initial presentation therefore differs from the controls. this tests the whole combined treatment, not an isolated motion mechanism. comparing earlier-word access is a separate availability experiment.

the cell bodies stay crisp and solid, without blurred edges or a blurred completion glow. a faint gradient highlight crosses each cell briefly during an eight-second decorative cycle; the rest of that cycle is quiet. this intentionally adds a traveling glimmer to the previously shimmer-free material. the [CSS Script reference](https://www.cssscript.com/skeleton-loader-placeholder/) points to zalog's loader, whose source also uses solid rows and a traveling gradient. it is a geometry reference, not a benefit study. pulse, wave and static skeletons already exist in [MUI](https://mui.com/material-ui/react-skeleton/); none is claimed as novel.

## why diffusion, and what the captures actually show

masked diffusion predicts candidates at many open positions together. the sampler chooses which positions become fixed, sometimes inside a sequential block schedule. prediction, commitment and semantic completeness are different events. a conventional typing presentation can expose useful text early, but need not reflect the sampler's order.

the original corpus contains 60 trajectories from `dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1`: twenty prompts, three sampler configurations, greedy decoding on an apple m3. **all 60 use 128 steps for 128 positions: one token commitment per step, 7,680 commitments in 7,680 steps.** they show parallel predictions and out-of-order commitments, not simultaneous multi-token commitment. a single new boundary can unlock several previously committed pieces for display.

four new experimental runs use 32 steps for 128 positions and commit four positions per step. their online candidate data and exact final decodes pass the capture validators. weather, sky-blue and sleep-tips under the low-confidence sampler have 4, 18 and 5 steps with multiple content-token commitments; the random sleep-tips run has 32. token batches are not automatically complete words or useful ideas. the retained outputs include repetition, “Avoid enough caffeine,” and numerical gibberish. they are evidence about decoding behavior, not production answer quality. [captures, provenance and validation](data/experiments/README.md).

formatting sometimes precedes nearby text, but does not universally come first. the structure audit finds 32 of 36 original final list markers precede their first body word's last token, while only 45 of 138 newlines precede both neighboring words' last tokens. those labels are retrospective; an isolated `1.` could still become a decimal. an application-owned structure or enforced grammar can justify early containers, while a prompt asking for a list cannot guarantee them. [structure audit](data/experiments/structure-timing-2026-09-09.json).

the user-supplied Gemini Diffusion sequence shows revisions at several locations, changing text extent and an inconsistent nearly complete-looking draft. its differently labeled real-time and slowed sequences have no supplied timing metadata. the [45-frame audit](docs/google-diffusion-reference-audit-2026-09-09.md) records archive provenance, observations and limits; the site provides three original frames for inspection. Google's [overview](https://deepmind.google/models/gemini-diffusion/) describes iterative block generation, but does not document the integration events shown here. the separate [DiffusionGemma explanation](https://ai.google.dev/gemma/docs/diffusiongemma/explained) describes revisable 256-token canvases and sequential finalized blocks; that architecture is not attributed to Gemini Diffusion.

an [authored 4.2-second snapshot exercise](lib/settle/snapshot-study.ts) tests compatibility with revisable input. the same current candidate appears in a labeled draft inspector and supplies only a coarse size to the protected view. a complete-looking candidate at 2.9 seconds stays provisional until the explicit final event at 4.2 seconds. these are invented demonstration events and timing, not a Google recording or connected API.

## the release contract

`lib/settle/` owns source eligibility and finality. presentation cannot create either:

1. future final text, word widths and formatting are unavailable to the early renderer. cell shapes are authored; the waiting size uses a numeric estimate from available current content and container/type metrics, according to the source capability.
2. whole-answer source release waits for finality. a separate final size handoff has an authored 180 ms duration before complete visual availability when more room is needed; browser scheduling can add further delay. earlier word, sentence and paragraph policies remain inspectable alternatives.
3. complete words need committed pieces and boundaries. guesses never become released text merely because they look plausible.
4. a brand changes appearance, not the source, release eligibility or exact final answer. readable text keeps its reading contrast.
5. stopped and failed partial output is labeled separately. an animation must not present it as a successfully completed answer.
6. a revisable source can send snapshots; only an explicitly final one reaches the protected reading page. the current candidate may prepare approximate space without becoming a commitment. later revisions preserve the prior version and require review and apply.
7. reduced motion and motion-off preserve source finality and bypass the final decorative fit delay. pause, replay, stop and terminal states have distinct behavior.

## the cost of one arrival

these figures come from the [whole-answer policy report](data/experiments/answer-policy-cost-2026-09-09.json). latency summaries use 57 nonempty original traces; three empty answers remain in the 60-output fidelity audit. the clock is the capture's synchronized model forward-pass time, not network or end-to-end product latency. release times are reducer eligibility, not measured browser paint.

| measure | each word | each sentence | each paragraph | whole answer |
| --- | ---: | ---: | ---: | ---: |
| median first passage eligible | 1.4 s | 4.6 s | 15.6 s | 15.8 s |
| mean of per-trace character-mean hold after joining the committed prefix | 0.4 s | 3.0 s | 5.5 s | 6.3 s |
| exact final output | 60/60 | 60/60 | 60/60 | 60/60 |
| released characters before commitment | 0 | 0 | 0 | 0 |

across the 57 matched nonempty runs, the median additional wait for the first passage under whole-answer versus sentence release is **10.5 seconds**. this is the median of paired differences, not the subtraction of the two medians above. a paragraph boundary can precede source finality; paragraph and whole-answer policies are not interchangeable. the new final size fit is an additional browser presentation cost outside these source-eligibility figures.

the original step-based report remains in `lib/traces/settle.json`. the newer four-position experiments are separate from the original corpus, and use a different capture-clock definition; their timing must not be treated as a controlled speedup. a faster replay changes presentation speed, not model performance.

## research and design rationale

common-fate studies provide context for shared change; both moving conditions already share a pulse. the current question is whether the division introduction, interior pill formation, neighboring movement and intermittent glimmer feel more fluid or more distracting. steady full rows and fixed line ends provide spatial references while the smaller shapes change. apple's Liquid Glass and spring demonstrations inform continuity and a restrained elastic character; this opaque content placeholder does not implement Apple's glass material. live-caption research motivates stable text after the brief arrival motion; it does not validate moving letters at arrival. these are different forms of evidence; none proves this interface improves reading.

the controlled skeleton study reviewed here used 14 participants and found no significant advantage over spinners in perceived speed, navigation ease or article-finding time. it does not establish equivalence either. progress-bar appearance has affected perceived duration in other experiments, but their effect sizes cannot be transferred to diffusion. the case study claims no dopamine mechanism, universal Zeigarnik benefit or guaranteed peak-end improvement.

[the anchored motion research](docs/anchored-skeleton-research-2026-09-09.md) records the current material, primary sources, evidence limits, exact parameters and reader hypotheses. [the current implementation handoff](docs/anchored-skeleton-handoff-2026-09-09.md) supplies architecture, code instructions and acceptance gates. earlier feathered motion, continuous ink and interval geometry remain historical alternatives. a current ChatGPT loading animation was not inspected; this is not described as its reconstruction.

## current engineering verification

the anchored revision is identified as `adaptive-cell-skeleton-v5`. fresh local checks passed: **347 unit/component cases, 54 browser checks across three profiles, 44 measurement/archive guards, full lint and a production build with TypeScript checking**. the browser profiles include iPhone 14 emulation, not a physical device. eight [instrumented observations](docs/anchored-skeleton-motion-validation-2026-09-09.json) retain exact output, the small intended arrival motion and **7,330 post-settle glyph samples with zero displacement**. the longer case grows from five to ten waiting rows. none of these eight cases required the delayed underallocation fit; dense inspection overhead prevents a normal-playback smoothness claim. two [passive presentation captures](docs/anchored-skeleton-showcase-capture-2026-09-09.json) are separately archived for the site’s video examples. the [release record](docs/anchored-skeleton-release-verification-2026-09-09.md) distinguishes local build/export checks from commit-specific publication evidence. previous solid-material results remain historical at `a7606d9` and are not reused as current validation.

three separate [forced-fit trials](docs/anchored-skeleton-fit-stress-2026-09-09.json) begin with five rows and immediately force the longer fixture’s final event. they measure **200.1 ms Chromium, 204 ms WebKit and 195 ms iPhone 14 emulation** from sampled completion to full text visibility, followed by zero post-settle movement. these artificial branch tests expose a presentation cost; they are not model latency, a distribution or a physical-device result.

final builds with the complete public copy pass for both normal hosting and Pages. local served-export verification also passes: two exact source replays, all four video-file hashes, successful showcase decoding, three exact reference-image hashes and the authored snapshot contract. the [local release record](docs/anchored-skeleton-release-verification-2026-09-09.md) retains the media-request cancellation details and keeps production deployment evidence separate.

## earlier work and the audit

the september 6 reveal used future answer geometry. the september 7 causal audit found 700 of 3,880 words drawn in their final spelling before all constituent tokens committed, an early length claim in 42 of 60 runs, and a phrase-order claim contradicted by its own report. these findings motivated the source contract and remain in the [design record](docs/redesign.md).

the first september 9 stabilization kept token identity and removed committed-letter blur, but its single controlled mobile-width chromium observation did not improve the worst identical committed-glyph displacement: 280.6 px after versus 276.5 px before. that result belongs to the previous renderer, not the new ambient composition. [measurement and limitations](docs/motion-validation-2026-09-09.json).

the [written case study](docs/case-study.md), [research note](docs/research-note.md), [earlier motion handoff](docs/motion-direction-2026-09-09.md) and [original release specification](docs/superpowers/specs/2026-09-07-settle-design.md) preserve the development record. the anchored research note and handoff describe the latest material. the earlier 268 tests, 42 browser checks, eight observations and 9,667 matched final-glyph samples belong to the feathered revision `05914c1`, recorded in its [historical handoff](docs/ambient-handoff-2026-09-09.md) and [measurement report](docs/ambient-motion-validation-2026-09-09.json). they are not reused as validation of the solid bars. no reader benefit or physical iPhone behavior has been measured.

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

designed and built by globalanomalyindex (christopher robin fiore), with claude as design and engineering partner. codex made the causal audit and first reading contract on 7 september 2026 under the name margin, then developed the motion revisions, source experiments and evidence refresh on 9 september. recorded trajectories and text are cc by 4.0; code is mit.

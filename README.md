# after tokens

an independent product design and engineering case study on how an answer from a diffusion language model should reach a reader.

[live case study](https://globalanomalyindex.github.io/after-tokens/)

> **the question.** how do we make diffusion text rendering clean, simple, beautiful, and brand-able, so that the same answer feels better to read through presentation alone?

> **the current direction.** fluid ambient bars occupy the answer area while generation continues. they form one composition, independent of token count, word widths and final formatting. when the source establishes finality, the complete answer appears together at full reading contrast. the bars disappear immediately; a separate 260 ms surrounding cue fades while the text rests. this deliberately trades early reading for one arrival, and that extra wait is measured.

| | |
| --- | --- |
| **role** | product design, interaction design, research, prototyping and front-end engineering |
| **built** | a causal replay adapter and pure release reducer, an ambient motion comparison, earlier-text alternatives, brand controls, product and phone frames, a policy cost instrument, source audits and research notes |
| **status** | working research prototype. source fidelity and presentation costs are measured; reader comfort, comprehension, satisfaction and preference are untested. browser emulation is not physical iPhone validation. |
| **stack** | next.js, typescript, tailwind, vitest, playwright, axe-core |

## the interaction

the bars are ambient composition, not a preview of the answer's exact layout or an estimate of progress. no bar represents a future word. their movement can continue between real source events without claiming additional token commitments. the composition stays inside a bounded answer area and does not resize itself around candidate words.

the default whole-answer policy releases after a committed end is reached by the contiguous prefix, a valid explicit finish, or an explicitly final snapshot. a predicted end, punctuation, stop, error or animation endpoint cannot complete the answer. the final text becomes readable immediately; the bars disappear immediately, and a separate 260 ms surrounding cue does not delay the text or animate letters in reading order. long answers can grow the container once; the measured narrow explanation added 99.375 px.

the motion comparison keeps source events, policy, answer timing and final handover identical across **static bars**, **coherent ambient bars** and **independent ambient bars**. that separates the ambient-motion question from answer availability. the independent periods also change velocity and short-run appearance, which a confirmatory study must match or model. comparing the whole answer with earlier-word access is a separate availability experiment, with real presentation hold reported.

## why diffusion, and what the captures actually show

masked diffusion predicts candidates at many open positions together. the sampler chooses which positions become fixed, sometimes inside a sequential block schedule. prediction, commitment and semantic completeness are different events. a conventional typing presentation can expose useful text early, but need not reflect the sampler's order.

the original corpus contains 60 trajectories from `dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1`: twenty prompts, three sampler configurations, greedy decoding on an apple m3. **all 60 use 128 steps for 128 positions: one token commitment per step, 7,680 commitments in 7,680 steps.** they show parallel predictions and out-of-order commitments, not simultaneous multi-token commitment. a single new boundary can unlock several previously committed pieces for display.

four new experimental runs use 32 steps for 128 positions and commit four positions per step. their online candidate data and exact final decodes pass the capture validators. weather, sky-blue and sleep-tips under the low-confidence sampler have 4, 18 and 5 steps with multiple content-token commitments; the random sleep-tips run has 32. token batches are not automatically complete words or useful ideas. the retained outputs include repetition, “Avoid enough caffeine,” and numerical gibberish. they are evidence about decoding behavior, not production answer quality. [captures, provenance and validation](data/experiments/README.md).

formatting sometimes precedes nearby text, but does not universally come first. the structure audit finds 32 of 36 original final list markers precede their first body word's last token, while only 45 of 138 newlines precede both neighboring words' last tokens. those labels are retrospective; an isolated `1.` could still become a decimal. an application-owned structure or enforced grammar can justify early containers, while a prompt asking for a list cannot guarantee them. [structure audit](data/experiments/structure-timing-2026-09-09.json).

## the release contract

`lib/settle/` owns text availability and finality. appearance cannot override it:

1. future final text, word widths and formatting are unavailable to the early renderer. the ambient composition uses authored geometry.
2. whole-answer release waits for the source's finality contract. earlier word, sentence and paragraph policies remain inspectable alternatives.
3. complete words need committed pieces and boundaries. guesses never become released text merely because they look plausible.
4. a brand changes appearance, not the source, release eligibility or exact final answer. readable text keeps its reading contrast.
5. stopped and failed partial output is labeled separately. an animation must not present it as a successfully completed answer.
6. a revisable source can send snapshots; only an explicitly final one reaches the page. later revisions preserve the prior version and require review and apply.
7. reduced motion and motion-off preserve release timing. pause, replay, stop and terminal states have distinct behavior.

## the cost of one arrival

these figures come from the [whole-answer policy report](data/experiments/answer-policy-cost-2026-09-09.json). latency summaries use 57 nonempty original traces; three empty answers remain in the 60-output fidelity audit. the clock is the capture's synchronized model forward-pass time, not network or end-to-end product latency. release times are reducer eligibility, not measured browser paint.

| measure | each word | each sentence | each paragraph | whole answer |
| --- | ---: | ---: | ---: | ---: |
| median first passage eligible | 1.4 s | 4.6 s | 15.6 s | 15.8 s |
| mean of per-trace character-mean hold after joining the committed prefix | 0.4 s | 3.0 s | 5.5 s | 6.3 s |
| exact final output | 60/60 | 60/60 | 60/60 | 60/60 |
| released characters before commitment | 0 | 0 | 0 | 0 |

across the 57 matched nonempty runs, the median additional wait for the first passage under whole-answer versus sentence release is **10.5 seconds**. this is the median of paired differences, not the subtraction of the two medians above. a paragraph boundary can precede source finality; paragraph and whole-answer policies are not interchangeable.

the original step-based report remains in `lib/traces/settle.json`. the newer four-position experiments are separate from the original corpus, and use a different capture-clock definition; their timing must not be treated as a controlled speedup. a faster replay changes presentation speed, not model performance.

## research and design rationale

common-fate studies motivate testing whether coordinated change makes the bars feel like one active area. live-caption research motivates protecting readable text. apple's fluid-interface demonstrations and fluent's motion guidance inform continuity, interruption and bounded movement. these are different forms of evidence; none proves this particular interface improves reading.

the controlled skeleton study reviewed here used 14 participants and found no significant advantage over spinners in perceived speed, navigation ease or article-finding time. it does not establish equivalence either. progress-bar appearance has affected perceived duration in other experiments, but their effect sizes cannot be transferred to diffusion. the case study claims no dopamine mechanism, universal Zeigarnik benefit or guaranteed peak-end improvement.

[the field experiment](docs/field-experiment-2026-09-09.md) records the implemented prototype, primary sources, exact studied tasks and limits, motion construction, structural uncertainty and testable hypotheses. [the current ambient handoff](docs/ambient-handoff-2026-09-09.md) supplies architecture, exact parameters, code pointers, continuation instructions and acceptance gates. it also preserves adaptive text skeletons, continuous ink texture and interval geometry as explored alternatives. a current ChatGPT loading animation was not inspected; this is not described as its reconstruction.

## earlier work and the audit

the september 6 reveal used future answer geometry. the september 7 causal audit found 700 of 3,880 words drawn in their final spelling before all constituent tokens committed, an early length claim in 42 of 60 runs, and a phrase-order claim contradicted by its own report. these findings motivated the source contract and remain in the [design record](docs/redesign.md).

the first september 9 stabilization kept token identity and removed committed-letter blur, but its single controlled mobile-width chromium observation did not improve the worst identical committed-glyph displacement: 280.6 px after versus 276.5 px before. that result belongs to the previous renderer, not the new ambient composition. [measurement and limitations](docs/motion-validation-2026-09-09.json).

the [written case study](docs/case-study.md), [research note](docs/research-note.md), [earlier motion handoff](docs/motion-direction-2026-09-09.md) and [original release specification](docs/superpowers/specs/2026-09-07-settle-design.md) preserve the development record. the ambient handoff and field experiment describe the latest implementation; historical claims retain their original scope. lint, types, 268 tests across 40 files and 42 browser checks pass for this revision. eight rendering observations and both production builds are complete; no reader benefit or physical iPhone behavior has been measured.

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

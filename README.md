# after tokens

an independent product design and engineering case study on how text from a diffusion language model should arrive on screen.

- live (vercel): https://after-tokens.vercel.app
- live (github pages): https://globalanomalyindex.github.io/after-tokens/

![after tokens: a product design and engineering case study](https://after-tokens.vercel.app/opengraph-image)

> **the hypothesis.** when a model refines many text positions in parallel, the interface should reveal the response as a settling field rather than imitate left-to-right typing.

| | |
| --- | --- |
| **role** | product design, interaction design, prototyping, front-end engineering |
| **built** | a reusable `DiffusionText` engine, four authored reveal modes plus one driven by recorded sampler trajectories, brand variants, a structured weather answer, an interactive playground |
| **status** | working prototype. one mode now replays a real model's sampler order; the comprehension hypothesis has not been validated with users. |
| **stack** | next.js, typescript, motion, tailwind, vitest, playwright, axe-core |

## the problem

autoregressive models write left to right, one token at a time, so the typewriter stream became the default way to show an answer arriving. masked diffusion language models iteratively refine many positions in parallel, so a typewriter reveal misrepresents how the answer is actually forming.

this piece explores the alternative: reveal behavior that communicates what is visually settled and what is still changing. the prototype uses designed choreography and hand-tagged response modes. it does not consume live model-confidence data. a production version would need a trustworthy model signal before animation could honestly represent uncertainty.

mechanism references: [llada](https://arxiv.org/abs/2502.09992) and [simple and effective masked diffusion language models](https://arxiv.org/abs/2406.07524).

## the system

the implementation separates six layers so each design decision can be tested on its own:

1. response content
2. tokenization into stable visual atoms
3. measured word and line geometry
4. a reveal strategy: mycelium, fog, aurora, or mitosis
5. choreography across `ready → resolving → resolved`
6. brand tokens, glyph treatments, and overlays

the same contract drives plain text, rich content, brand specimens, and a weather widget. reduced motion resolves immediately while keeping a visible state label. editorial examples expose ordinary screen-reader text; user-triggered results announce once on completion.

### the reveal grammar, decision by decision

every rendering decision in the shipped reveal traces back to a named psychology principle and a numbered finding from the real trajectories. this is the map:

| decision | principle & finding | effect |
| --- | --- | --- |
| a pending word stays blurred, in a slot of its final width | parafoveal preview · zeigarnik effect | churn to the side of the eye stays illegible, so it costs no reading time, and the open slot holds the answer's extent and the reader's attention |
| the pending glyphs change every 390 milliseconds | doherty threshold · finding 04 | matches the sampler's measured 387 ms flip rate, so every visible change lands inside the window where attention holds |
| the model's guess renders only above a probability of 0.25 | predictive coding · prediction error | below the floor the guess is the corpus prior; above it, a real prediction |
| words arrive in local clusters from a few anchors | finding 02 · change blindness | staged, neighboring change is perceivable where scattered, simultaneous change gets missed |
| the cadence is linear, with no gap longer than 400 milliseconds | finding 01 · doherty threshold | the recorded sampler commits at a steady rate, so the reader never waits past the threshold for the next change |
| a locked word gets heavier than its neighbors | von restorff effect | the lock is the one difference in the field, so it is the thing that registers |
| a lock settles with an overshoot sized to its confidence | dopamine · finding 05 | the resolution beat is a reward signal, scaled to how sure the commit was |
| a weak commit stays slightly dimmer | trust calibration · finding 05 | 38% of commits went in under even odds; the render shows certainty as certainty and leaves the rest to read as provisional |
| the whole answer unblurs once at the end | gestalt closure · peak-end rule | the final snap is the moment the sequence is remembered by |
| the last word carries the strongest beat | peak-end rule · finding 03 | the sampler decides its ending last, and that is where memory of the answer settles |

source: [`lib/traces/findings.ts`](lib/traces/findings.ts), `SYNTHESIS`.

## key decisions

this shipped through cycles of build, audit, and cut.

- a fourth reveal mode (a particle flock) was rebuilt three times and killed: it reduced legibility and duplicated the simpler mycelium mode.
- the thesis comparison began as abstract line graphs and became word-level locks, so the demo shows the behavior instead of describing it. a timeline scrubber was built on top of it and then cut: it turned a thing you glance at into a thing you operate, and the loop already shows both cadences against the same clock.
- a cinematic entrance was built, broke, was rebuilt around its failure modes, and was then cut entirely. the hero already resolves out of order, and a second performance of the same idea cost a reviewer six seconds before the argument started.
- the last decision was to stop authoring: sixty real trajectories were captured so one mode could replay a sampler instead of imitating one, and the piece now separates what the sampler does from what a reader can read.

nature supplied a motion vocabulary (branching, dissipation, bands, division). it did not supply proof. the shipped cadence is linear now, fitted to the recorded sampler; phi decay is retired to the comparison stimulus. the case study states exactly what is implemented, what is simulated, and what a user study would need to falsify.

## research

the case study cites eleven findings from cognitive science and reading research, each placed next to the specific claim it motivates. they are why the hypothesis is worth testing. none of them was measured on this prototype.

| term | source |
| --- | --- |
| predictive coding | rao & ballard, 1999 |
| prediction error | friston, 2010 |
| dopamine | schultz, 1997 |
| zeigarnik effect | zeigarnik, 1927 |
| gestalt closure | wertheimer, 1923 |
| peak-end rule | kahneman et al., 1993 |
| trust calibration | lee & see, 2004 |
| change blindness | simons & levin, 1997 |
| parafoveal preview | rayner, 1998 |
| doherty threshold | doherty & thadhani, 1982 |
| von restorff effect | von restorff, 1933 |

parafoveal preview is in there as the counter-argument: while you read one word the eye is already sampling the next one over, so revealing out of order should cost a reader time. an honest study has to measure reading time. state identification alone would not be enough.

## real trajectories

sixty denoising trajectories were recorded from a real masked diffusion language model, `dllm-hub/qwen3-0.6b-diffusion-mdlm-v0.1` (0.6b parameters, instruction tuned, apache-2.0), run greedily on an apple m3. twenty prompts times three sampler configurations: `lowconf-b32` (llada-style low-confidence remasking in four blocks of 32, the model card default), `random-b32` (the original mdlm random unmasking order, same blocks), and `lowconf-b128` (low-confidence remasking with no block schedule). one reveal mode replays these trajectories directly; the other modes stay authored.

| finding | number |
| --- | --- |
| commit order vs reading order (kendall's tau) | +0.96 with blocks, +0.75 random order, +0.38 with no blocks |
| median jump between consecutive commits | 2.5 positions, vs 36.7 expected from a uniformly random order |
| provisional-guess changes per token before it commits | 5.3, range 2.1 to 9.4 across prompts |
| end-of-sequence tail committed before the last word (default schedule) | 95% |
| median confidence of the token committed at each step | 0.57 |

with the default sampler the answer arrives almost left to right, one block at a time. the block schedule enforces that order; the confidence rule alone would not. commits cluster around a handful of confident anchors, growing outward from them instead of filling in as a scatter or a strict scan. the model's current best guess for an unfilled position is usually wrong more than once before that position commits. the sequence's end is fixed only shortly before its last words are: the tail sits inside the final block, so the length becomes certain at the 95% mark and the last word lands at the 99% mark. and a meaningful share of commits, nearly two in five, land under even odds, so a lock does not always mean the model was sure.

what changed in the design because of it (the reasoning in order is `docs/redesign.md`):

- the shipped reveal was rebuilt from the principles and the measurements together. a pending word is an illegible blur in a slot of its final width; the pending glyphs change every 390 ms (the sampler's measured rate was 387); the model's guess is shown only above a probability of 0.25, because below it the guess is the corpus prior and reads "the" in every slot; words lock in local clusters from a few anchors on a linear cadence of 45 to 80 ms per word; a lock is crisp at once, heavier, with a settle sized to its probability and a halo that is gone within a second; a weak commit rests dimmer; the field moves as a whole once, at the last lock.
- four earlier choices were retired by the data: the phi cadence (kept only as the comparison stimulus), a field-wide sweep during the reveal, a halo left on every locked word, and a closing beat at a fixed 82% of the run that unblurred still-pending noise.
- the hypothesis is now three claims a study can break: legible state (h1), no reading cost (h2), calibrated trust (h3). the recorded trajectories are the stimuli for all three.
- a llada-8b-instruct corroboration set (4 runs, tau +0.90, median jump 3.9) reproduces the block-schedule pattern at 8b; llama.cpp exposes order and timing but not confidence.

## evidence and limits

the repository demonstrates a reusable typed engine, deterministic choreography, responsive geometry, reduced-motion behavior, and automated quality checks. it does **not** yet demonstrate that region-based revealing improves comprehension, that the modes map to user intent, or that any timeline corresponds to calibrated model uncertainty.

the glyph choreography is tuned for english and latin-script content. this is a prototype primitive; it has not shipped as a published component library.

## run it

```bash
pnpm install
pnpm dev
```

then open http://localhost:3000.

## scripts

| command | what it does |
| --- | --- |
| `pnpm dev` | start the dev server |
| `pnpm lint` | run eslint across the project |
| `pnpm typecheck` | type check without emitting |
| `pnpm test` | run the unit suite (vitest) |
| `pnpm test:e2e` | run the browser tests (playwright) |
| `pnpm build` | production build |
| `pnpm check` | lint, typecheck, unit tests, and a production build |

## deploys

the same app ships to two hosts from one codebase.

- vercel: the default build serves at the domain root.
- github pages: the workflow in `.github/workflows/deploy-pages.yml` builds with `GITHUB_PAGES=true`, which switches on next.js static export and a `/after-tokens` base path, then publishes the static `out` directory.

pull requests run lint, typecheck, unit tests, both production build configurations, and chromium playwright checks. the pages workflow repeats those checks and blocks deployment if any fail.

## reference

- design spec: [`docs/superpowers/specs/2026-05-27-diffusion-text-animation-design.md`](docs/superpowers/specs/2026-05-27-diffusion-text-animation-design.md). historical design direction; the shipped case study is the source of truth where they differ.
- type system notes: [`docs/fonts.md`](docs/fonts.md)

## credit

designed and built by [globalanomalyindex](https://github.com/globalanomalyindex), product designer and design engineer. portfolio theme: looking to nature for answers.

## license

[mit](LICENSE) © 2026 christopher robin fiore.

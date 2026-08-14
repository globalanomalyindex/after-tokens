# after tokens

an independent product design and engineering case study on how text from a diffusion language model should arrive on screen.

- live (vercel): https://after-tokens.vercel.app
- live (github pages): https://globalanomalyindex.github.io/after-tokens/

![after tokens: a product design and engineering case study](https://after-tokens.vercel.app/opengraph-image)

> **the hypothesis.** when a model refines many text positions in parallel, the interface should reveal the response as a settling field rather than imitate left-to-right typing.

| | |
| --- | --- |
| **role** | product design, interaction design, prototyping, front-end engineering |
| **built** | a reusable `DiffusionText` engine, four reveal modes, brand variants, a structured weather answer, an interactive playground |
| **status** | working prototype. the comprehension hypothesis has not been validated with users. |
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

## key decisions

this shipped through cycles of build, audit, and cut.

- a fourth reveal mode (a particle flock) was rebuilt three times and killed: it reduced legibility and duplicated the simpler mycelium mode.
- the thesis comparison began as abstract line graphs and became word-level locks, so the demo shows the behavior instead of describing it. it now carries a timeline scrubber, so the stimulus can be stopped and inspected at any instant rather than only judged in motion.
- a cinematic entrance was built, broke, was rebuilt around its failure modes, and was then cut entirely. the hero already resolves out of order, and a second performance of the same idea cost a reviewer six seconds before the argument started.

nature supplied a motion vocabulary (branching, dissipation, bands, division) but not proof. the phi-decay cadence is a tuning hypothesis. the case study states exactly what is implemented, what is simulated, and what a user study would need to falsify.

## research

the case study cites eleven findings from cognitive science and reading research, each placed next to the specific claim it motivates. they are why the hypothesis is worth testing, not evidence that it holds, and none of them was measured on this prototype.

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

parafoveal preview is in there as the counter-argument: while you read one word the eye is already sampling the next one over, so revealing out of order should cost a reader time. an honest study has to measure reading time, not only state identification.

## evidence and limits

the repository demonstrates a reusable typed engine, deterministic choreography, responsive geometry, reduced-motion behavior, and automated quality checks. it does **not** yet demonstrate that region-based revealing improves comprehension, that the modes map to user intent, or that any timeline corresponds to calibrated model uncertainty.

the glyph choreography is tuned for english and latin-script content. this is a prototype primitive, not a published component library.

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

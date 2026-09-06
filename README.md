# after tokens

an independent product design and engineering case study on how text from a diffusion language model should arrive on screen.

- live (vercel): https://after-tokens.vercel.app
- live (github pages): https://globalanomalyindex.github.io/after-tokens/

![after tokens: a product design and engineering case study](https://after-tokens.vercel.app/opengraph-image)

> **the question.** how do we make diffusion text rendering clean, simple, beautiful, and brand-able, using psychological principles such as the zeigarnik effect, gestalt closure, and the peak-end rule, so that the same answer feels better to read through presentation alone?

> **the answer.** treat the arrival as a design object. an arrival is one number per word, the time it becomes legible; from it, four measurable properties follow, each grounded in one mechanism from the psychology of reading and reward. one reveal grammar, crystallize, is built to keep all four inside their rules, any brand gets a voice on it, and every other arrival (the typewriter, a fade, a scatter, the earlier nature modes, a real sampler) is scored on the same profile.

| | |
| --- | --- |
| **role** | product design, interaction design, prototyping, front-end engineering |
| **built** | the `DiffusionText` engine, the crystallize grammar, the arrival profile (a metric suite for any reveal), the two-channel reveal for recorded sampler runs, five brand voices, sixty recorded trajectories, a structured weather answer |
| **status** | working prototype. every arrival in the piece is scored; a five-claim study is designed and its stimuli ship in the repository. no reader has been measured. |
| **stack** | next.js, typescript, motion, tailwind, vitest, playwright, axe-core |

## the problem

a diffusion language model produces a whole answer and refines it in parallel. the words are fixed before the interface draws a single one, so the interface chooses the temporal shape of the arrival. every chat product ships one shape, the typewriter, which makes three promises a sampler cannot keep: one insertion point, a bubble that grows with the text, and partial output you can trust. in the recorded runs the model's provisional guess for a position changed about 5.3 times before it committed.

## the arrival profile

`lib/arrival/` is the research contribution: a way to measure any reveal.

| property | mechanism | what it measures | the rule it yields |
| --- | --- | --- | --- |
| tension | zeigarnik effect | how many phrases are partly settled at once | one or two open loops; never more than three |
| closure | gestalt closure, the aha effect | how often a step completes a phrase | batch commits so a step tends to close a phrase |
| peak and end | peak-end rule | where salience-weighted intensity peaks, how heavy the end is | peak at the gist; end on one quiet completion |
| fluency | parafoveal preview, processing fluency | whether a reader at one fixation per 250 ms would wait for the next word | nothing crisp before commit; inside a phrase, one crisp anchor, then reading order |

a phrase is the perceptual unit: a line break or a list marker starts one, terminal punctuation ends one, a comma ends one after three words, eight words is the cap. `pnpm traces:arrival` scores eight arrivals of the same texts at matched durations and the eighteen curated recorded runs, and writes `lib/traces/arrival.json`; `lib/traces/findings.ts` is the only source of numbers the copy may cite.

medians over the eight fixtures:

| arrival | loops at most | reader waits | phrase-scale order (τ) | end weight | gist at |
| --- | --- | --- | --- | --- | --- |
| typewriter | 1 | 0% | +1.00 | 1.02× | 68% |
| fade | 0 | 0% | 0.00 | 6.44× | 90% |
| scatter | 4.5 | 14% | +0.03 | 1.07× | 80% |
| mycelium (earlier growth mode) | 4.5 | 19% | +0.19 | 0.86× | 56% |
| crystallize | 2 | 0% | +0.13 | 0.83× | 68% |

## the grammar: crystallize

nature anchor: crystallization. a few sites nucleate, each crystal grows along its lattice, grains meet, the finished crystal is still. in the grammar: at most two phrases are open at once; the next opens by salience, spread across the answer, so the gist opens first wherever it sits; when a phrase opens its most salient word locks at once and crisp legibility proceeds from the phrase's first word; every front advances every step and steps end on closures; a lock is crisp at once, heavier, with a settle sized to salience and a halo gone within a second; after the last lock the field quiets once, no wave, no pulse. the reasoning in order is [`docs/redesign.md`](docs/redesign.md); the design spec is [`docs/superpowers/specs/2026-09-06-crystallize-arrival-grammar-design.md`](docs/superpowers/specs/2026-09-06-crystallize-arrival-grammar-design.md).

for a recorded sampler run, `withReadingOrder` splits the signal into a state channel (a word ghosts when its tokens commit) and a reading channel (crisp legibility in reading order inside each phrase, the phrase's earliest commit kept as its anchor). on the curated runs legibility trails commitment by a median of 540 ms on the 36% of words that wait, and no phrase reads out of order.

## the voice

a brand gets six tokens on the one grammar: tempo, attack, weight, glow, hush, swing, each inside a range that keeps every property of the profile inside its rule. the budget, the phrases, the forming lead, and the exhale are grammar, outside the voice. five presets ship: after tokens, halcyon, felt, pulse, voltage.

## real trajectories

sixty denoising trajectories were recorded from `dllm-hub/qwen3-0.6b-diffusion-mdlm-v0.1` (0.6b parameters, instruction tuned, apache-2.0), run greedily on an apple m3, twenty prompts under three sampler configurations, plus a four-run llada-8b-instruct corroboration set. the findings that drive the grammar: commit order is local growth from anchors (half of consecutive commits land beside the last one), the answer's length is known late (the tail commits at the 92 to 95% mark), and confidence at commit varies (median 0.57, 38% under even odds). the method, the statistics, and the limits are in [`docs/research-note.md`](docs/research-note.md); the data is in [`data/traces/`](data/traces).

## evidence and limits

five claims a study can break: state legibility (h1), reading cost (h2), trust calibration (h3), felt quality (h4), and the tension budget (h5). the stimuli ship: the recorded runs, the reference arrivals, the grammar at every budget. the profile measures arrivals and the trajectories measure a sampler; neither measures a reader. the phrase rule is language-naive, the salience score is authored, the reader model is one number, and the glyph choreography is tuned for english and latin script.

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
| `pnpm traces:arrival` | score every arrival and regenerate `lib/traces/arrival.json` |
| `pnpm traces:index` | regenerate the trajectory loader from `data/traces/compact` |
| `pnpm build` | production build |
| `pnpm check` | lint, typecheck, unit tests, and a production build |

## deploys

the same app ships to two hosts from one codebase. vercel serves the default build at the domain root. github pages builds with `GITHUB_PAGES=true`, which switches on static export and a `/after-tokens` base path, and publishes the static `out` directory. pull requests run lint, typecheck, unit tests, both builds, and chromium playwright checks.

## reference

- written case study: [`docs/case-study.md`](docs/case-study.md)
- design record: [`docs/redesign.md`](docs/redesign.md)
- design spec: [`docs/superpowers/specs/2026-09-06-crystallize-arrival-grammar-design.md`](docs/superpowers/specs/2026-09-06-crystallize-arrival-grammar-design.md)
- research note: [`docs/research-note.md`](docs/research-note.md)
- type system notes: [`docs/fonts.md`](docs/fonts.md)

## credit

designed and built by [globalanomalyindex](https://github.com/globalanomalyindex), product designer and design engineer, with claude as design and engineering partner. portfolio theme: looking to nature for answers.

## license

[mit](LICENSE) © 2026 christopher robin fiore.

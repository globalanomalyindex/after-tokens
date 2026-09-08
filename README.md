# after tokens

an independent product design and engineering case study on how an answer from a diffusion language model should reach a reader.

- live (vercel): https://after-tokens.vercel.app
- live (github pages): https://globalanomalyindex.github.io/after-tokens/

![after tokens: a product design and engineering case study](https://after-tokens.vercel.app/opengraph-image)

> **the question.** how do we make diffusion text rendering clean, simple, beautiful, and brand-able, so that the same answer feels better to read through presentation alone?

> **the answer.** only what the model has committed, on a page that holds still, with the process in view. an answer has two surfaces and a margin. the page holds released passages as ordinary, still, selectable text. the field is carved into the text after it: every open position is a slot of static standing where a word will, a word stands where it will, dim, the moment every piece of it is in, in the sampler's own order, and the zone shortens from the tail as the model decides the length. between them, the forming text: committed, in-order, word-complete text waiting for its passage to close. the margin says what the source is doing, beside a mark that is the brand's.

| | |
| --- | --- |
| **role** | product design, interaction design, prototyping, front-end engineering |
| **built** | a pure reducer and its ten-rule contract, a replay adapter that cannot read the answer, the field, a five-token brand voice with invariants, three live product frames, a playground, a cost instrument over sixty recorded trajectories, a causal audit of the version before, a corrected literature ledger, a study design |
| **status** | working prototype. the cost of each release policy is measured on every recording; every output is exact; nothing is drawn early. no reader has been measured. |
| **stack** | next.js, typescript, tailwind, vitest, playwright, axe-core |

## the wrong shape

a diffusion model holds every position of an answer open at once and commits them in the order it is sure of them. the typewriter draws the answer in an order the sampler did not use and puts half-formed words under the reader. a reveal that choreographs the answer, which this case study shipped on september 6, needs the final words, their widths and a map of which matter, and a live source has none of those.

## the audit

an independent audit of that build by a second agent (codex, 7 september 2026, under the name margin) found that 700 of 3,880 corpus words (18 percent) were drawn in their final spelling before all their tokens had committed, that "length fixed" was announced from a retrospective statistic in 42 of 60 runs, and that a claim of "no phrase ever reads out of order" was contradicted by the report's own 5.6 percent. every finding is accepted, reproduced by `pnpm traces:settle`, and built against. the design record is [`docs/redesign.md`](docs/redesign.md).

## the contract

`lib/settle/` is the engine. given the same events, the surface shows the same page, the same forming text, the same field and the same status, whatever comes later. ten rules, kept by a pure reducer:

1. nothing is drawn that the source has not committed.
2. a word is drawn only when it is complete: the next committed token begins with whitespace, the token ends with whitespace, or the next position is a committed end.
3. text on the page never changes, moves or reflows; when a sentence closes, the page's ink settles through its words' letterforms in one movement, and their shapes and places do not change; an available word is drawn in a secondary ink that clears 4.5:1 on both of the brand's grounds.
4. the page grows by whole passages: each word, each sentence, or each paragraph. no timeout relabels a fragment; finality releases the exact remainder.
5. out-of-order text appears only after the page, never inside it: a committed word may stand where it will, in the secondary ink, among noise; noise is never content, it cycles and never spells, and a word's letters resolve out of it only after every piece of the word has committed.
6. an exact length is claimed only when the prefix reaches a committed end token; a committed end token anywhere bounds the answer to before it, and nothing past it is drawn.
7. snapshots stay off the page until one is explicitly final; a revision keeps the prior page and offers a review and apply action.
8. complete, stopped, error, paused and revision available are distinct states, named in the margin.
9. a brand changes appearance and motion envelopes, never availability.
10. reduced motion removes the breath, the bloom and the onset, and nothing else.

the spec is [`docs/superpowers/specs/2026-09-07-settle-design.md`](docs/superpowers/specs/2026-09-07-settle-design.md).

## the cost

`pnpm traces:settle` measures every policy on every recording, on a uniform step clock and the raw forward-pass clock, and writes `lib/traces/settle.json`; `lib/traces/findings.ts` is the only source of numbers the copy may cite.

| measure | each word | each sentence | each paragraph |
| --- | --- | --- | --- |
| first passage on the page, median | 12 steps | 39 steps | 128 steps |
| extra wait after text is in order, mean | 3.3 steps | 24.5 steps | 44.7 steps |
| forming text visible, median share of the run | 0% | 90% | 90% |
| exact final output | 60 of 60 | 60 of 60 | 60 of 60 |
| characters drawn before commitment | 0 | 0 | 0 |

a step is one completed forward pass of a 0.6b model at about 119 ms on a laptop; a production model divides the seconds by an order of magnitude and changes none of the shapes.

## the voice

a brand gets five tokens on the one surface, each inside a range that is an invariant: mark (tick, dot, dash, square), bloom (0 to 1), onset (0 to 240 ms), tempo (0.7 to 1.4), grain (0 to 1). five presets ship: after tokens, halcyon, felt, pulse, voltage.

## real trajectories

`data/traces/` holds sixty recorded denoising trajectories from `dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1` (twenty prompts, three sampler configurations, greedy, on an apple m3) and a four-run llada-8b corroboration set. the research note is [`docs/research-note.md`](docs/research-note.md); section 9 holds the audit, the contract, the cost and the literature ledger.

## evidence and limits

three claims about the repository, each tested: zero characters reach the page before their tokens commit, every final page equals the sampler's output, and the cost of each policy is reported per run with denominators. nothing is claimed about a reader. a two-experiment study is designed with the stimuli in the repository; nobody has run it. the written case study is [`docs/case-study.md`](docs/case-study.md).

## run

```bash
pnpm install
pnpm dev
```

| script | what it does |
| --- | --- |
| `pnpm dev` | development server |
| `pnpm build` | production build |
| `pnpm check` | lint, types, tests, build |
| `pnpm test` | unit tests, including the reducer over all sixty recordings |
| `pnpm test:e2e:chromium` | axe at wcag 2.1 aa and reduced motion, in chromium |
| `pnpm traces:settle` | regenerate the cost report and the causal audit |
| `pnpm traces:index` | regenerate the trace index after a capture |

## deploys

vercel builds `main` on push. github pages builds the same commit with `GITHUB_PAGES=true`, which switches to a static export under the `/after-tokens` base path.

## credits

designed and built by globalanomalyindex (christopher robin fiore), with claude as design and engineering partner. the causal audit and the first implementation of the reading contract were made by codex on 7 september 2026 under the name margin. recorded trajectories and text are cc by 4.0; code is mit.

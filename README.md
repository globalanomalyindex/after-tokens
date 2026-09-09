# after tokens

an independent product design and engineering case study on how an answer from a diffusion language model should reach a reader.

- live (github pages): https://globalanomalyindex.github.io/after-tokens/

# after tokens: a product design and engineering case study

> **the question.** how do we make diffusion text rendering clean, simple, beautiful, and brand-able, so that the same answer feels better to read through presentation alone?

> **the answer.** put progress into the words while protecting the reader’s place. Settle distinguishes the source’s guesses, committed text and released passages. Unresolved regions carry a small ambient breath; newly complete words and passages acknowledge their own arrival; finished text rests. Several regions can develop together when the source supplies them together. The renderer never looks ahead at the final answer.

| | |
| --- | --- |
| **role** | product design, interaction design, prototyping, front-end engineering |
| **built** | a pure reducer and its reading contract, a causal replay adapter, a field derived from recorded source state, word and passage completion feedback, a five-token brand voice, three product frames and a phone concept, a playground, a cost instrument over sixty recorded trajectories, a causal audit, a corrected literature ledger, a study design |
| **status** | working prototype. the cost of each release policy is measured on every recording; every output is exact; nothing committed is drawn as a guess, nothing guessed is drawn as committed, and no guess reaches the page. no reader has been measured. |
| **stack** | next.js, typescript, tailwind, vitest, playwright, axe-core |

## the wrong shape

masked diffusion can predict many positions together. the recorded samplers commit positions irreversibly, sometimes inside a sequential block schedule. prediction, commitment and semantic completeness are different events; revisable samplers need an explicit finality contract. the typewriter draws the answer in an order the sampler did not use and puts half-formed words under the reader. a reveal that choreographs the answer, which this case study shipped on september 6, needs the final words, their widths and a map of which matter, and a live source has none of those.

## the audit

an independent audit of that build by a second agent (codex, 7 september 2026, under the name margin) found that 700 of 3,880 corpus words (18 percent) were drawn in their final spelling before all their tokens had committed, that "length fixed" was announced from a retrospective statistic in 42 of 60 runs, and that a claim of "no phrase ever reads out of order" was contradicted by the report's own 5.6 percent. every finding is accepted, reproduced by `pnpm traces:settle`, and built against. the design record is [`docs/redesign.md`](docs/redesign.md).

## the contract

`lib/settle/` is the engine. given the same events, the surface shows the same page, the same forming text, the same field and the same status, whatever comes later. ten rules, kept by a pure reducer:

1. nothing is drawn as the source's text that the source has not committed. the one thing an uncommitted position may draw is the source's own current guess for it, drawn as a guess, and no guess ever reaches the page.
2. a word is drawn only when it is complete: the next committed token begins with whitespace, the token ends with whitespace, or the next position is a committed end.
3. released text stays still while later source events arrive. completion feedback changes decoration, not its baseline, width or readable shape. provisional layout never uses an unseen final word or its width. an available word uses ink that clears the contrast floor on its actual background. dark stages use secondary ink; translucent product bubbles use primary ink and a dotted underline until release.
4. the page grows by whole passages: each word, each sentence, or each paragraph. no timeout relabels a fragment; finality releases the exact remainder.
5. out-of-order material appears only after the released page. open positions reserve space; the source’s current prediction is visibly provisional; committed pieces are fixed source text; whole words appear only after their pieces and boundaries commit. a repeated prior is suppressed. a guessed line break is not final structure. neither source activity nor draft probability is a correctness score.
6. an exact length is claimed only when the prefix reaches a committed end token; a committed end token anywhere bounds the answer to before it, and nothing past it is drawn.
7. snapshots stay off the page until one is explicitly final; a revision keeps the prior page and offers a review and apply action.
8. complete, stopped, error, paused and revision available are distinct states, named in the margin.
9. a brand changes appearance and motion envelopes, never availability.
10. reduced motion and the motion-off control remove decorative movement without changing source availability, passage release or final output. pausing pauses the presentation; terminal states rest.

the original reading spec is [`docs/superpowers/specs/2026-09-07-settle-design.md`](docs/superpowers/specs/2026-09-07-settle-design.md). the current motion rationale, implementation decisions and validation boundaries are in [`docs/motion-direction-2026-09-09.md`](docs/motion-direction-2026-09-09.md).

## the cost

`pnpm traces:settle` measures every policy on every recording, on a uniform step clock and the raw forward-pass clock, and writes `lib/traces/settle.json`; `lib/traces/findings.ts` is the only source of numbers the copy may cite.

| measure | each word | each sentence | each paragraph |
| --- | --- | --- | --- |
| first passage on the page, median | 12 steps | 39 steps | 128 steps |
| extra wait after text is in order, mean | 3.3 steps | 24.5 steps | 44.7 steps |
| forming text visible, median share of the run | 0% | 90% | 90% |
| exact final output | 60 of 60 | 60 of 60 | 60 of 60 |
| characters drawn before commitment | 0 | 0 | 0 |

a step is one completed forward pass of a 0.6b model at about 119 ms on a laptop. this is the capture’s forward-pass clock, not end-to-end latency. production timing and commitment patterns depend on the model, sampler and hardware; faster replay is not a production benchmark. the stages replay at that recorded clock by default, with half of recorded and twice recorded as the other choices.

## the drafts

at every step the model holds a provisional guess for every position it has not committed. `scripts/derive-drafts.py` writes those guesses into the compact traces and the statistics into `data/traces/derived/drafts.json`, and the source display policy admits one at or above a probability of 0.25, as a guess. the revised renderer additionally shows candidate letters only when the complete guess fits its fixed reservation. the statistics below describe eligibility before this fit check, not current screen visibility. over content positions of every recording with at least eight content tokens, where a pair is one open content position at one step:

| measure | all | lowconf-b32 | random-b32 | lowconf-b128 |
| --- | --- | --- | --- | --- |
| a draft is eligible, share of open-position steps | 0.1699 | 0.1301 | 0.1915 | 0.3115 |
| an eligible draft matches the token that later commits | 0.6657 | 0.6103 | 0.718 | 0.5756 |
| steps a draft qualifies before commitment, median | 8 | 4 | 14 | 11 |

at least one draft passes the source display policy on 93 percent of steps (0.9272), and 61 percent of eligible drafts never change again before commitment (0.6145). on the raw probabilities, adjacent open positions show a next-step increase of 0.1096 (lowconf-b32), 0.175 (random-b32) and 0.1264 (lowconf-b128), against 0.0067, 0.0048 and 0.0022 for other open positions. this is an association in the recorded trajectory, not proof that a commitment causes its neighbors to settle. token probability is not answer truth, and none of these statistics says a draft helps a reader.

## the voice

a brand gets five tokens on the one surface, each inside a range that is an invariant: mark (tick, dot, dash, square), bloom (0 to 1), onset (0 to 240 ms), tempo (0.7 to 1.4), grain (0 to 1). five presets ship: after tokens, halcyon, felt, pulse, voltage.

## real trajectories

`data/traces/` holds sixty recorded denoising trajectories from `dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1` (twenty prompts, three sampler configurations, greedy, on an apple m3), the model's per-step drafts, and a four-run llada-8b corroboration set. the research note is [`docs/research-note.md`](docs/research-note.md); section 9 holds the audit, the contract, the drafts, the cost and the literature ledger.

## evidence and limits

four claims about the repository, each tested: zero characters reach the page before their tokens commit, every final page equals the sampler's output, a draft changes no page text and no prefix and never survives its position's commitment, and the cost of each policy and the behavior of the drafts are reported per run with denominators. nothing is claimed about a reader. a two-experiment study is designed with the stimuli in the repository; nobody has run it. the written case study is [`docs/case-study.md`](docs/case-study.md).

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
| `pnpm test:e2e:chromium` | chromium accessibility, reduced motion, token identity, committed-text legibility, playback and final-output checks |
| `pnpm test:e2e` | the browser suite across chromium, webkit and an emulated mobile-portrait profile; not a physical iPhone test |
| `pnpm traces:settle` | regenerate the cost report and the causal audit |
| `pnpm traces:index` | regenerate the trace index after a capture |

## deploys

github pages builds main with `GITHUB_PAGES=true`, which switches to a static export under the `/after-tokens` base path.

## credits

designed and built by globalanomalyindex (christopher robin fiore), with claude as design and engineering partner. the causal audit and the first implementation of the reading contract were made by codex on 7 september 2026 under the name margin; codex developed the motion revision and evidence refresh on 9 september. recorded trajectories and text are cc by 4.0; code is mit.

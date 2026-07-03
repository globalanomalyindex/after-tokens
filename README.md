# after tokens

a design and engineering case study on how to render text from a diffusion language model.

- live (vercel): https://after-tokens.vercel.app
- live (github pages): https://globalanomalyindex.github.io/after-tokens/

autoregressive models write left to right, one token at a time, so the typewriter stream became the default way to show an answer arriving. diffusion models do not work that way: they resolve a whole response at once, refining from noise toward clarity across the answer surface, with confidence rising in parallel rather than position by position. the typewriter is the wrong picture for that process.

this piece works through what the right picture is. the thesis: animation should signal the shape of the answer. a good reveal communicates the shape and state of a response so a person can read how far along it is and how sure the system is, then calibrate their trust in provisional output accordingly. the visual language is anchored in nature (mycelium, fog, aurora) because those are the systems that already resolve everywhere at once.

it is built as a scrolling editorial article with live, interactive demonstrations: the diffusion reveal running under multiple brand identities, a weather widget that arrives whole, and a playground for driving the choreography directly.

## run it

```bash
pnpm install
pnpm dev
```

then open http://localhost:3000.

## scripts

| command | what it does |
| - | - |
| `pnpm dev` | start the dev server |
| `pnpm build` | production build |
| `pnpm test` | run the unit tests (vitest) |
| `pnpm test:e2e` | run the end to end tests (playwright) |
| `pnpm typecheck` | type check without emitting |

## stack

next.js (app router), typescript, tailwind, and motion for the choreography. all animation respects `prefers-reduced-motion`.

## process

this shipped through cycles of build, audit, and cut. a fourth reveal mode (a particle flock) was rebuilt three times and killed for clarity. the first entrance shipped, broke, and was rebuilt around its failure modes. the thesis comparison began as line graphs and became crosshairs lit by real word locks. the close section of the piece documents what was cut, what remains unsolved, and how the thesis would be falsified.

## deploys

the same app ships to two hosts from one codebase.

- vercel: the default build serves at the domain root.
- github pages: the workflow in `.github/workflows/deploy-pages.yml` builds with `GITHUB_PAGES=true`, which switches on next.js static export and a `/after-tokens` base path, then publishes the static `out` directory to pages.

## reference

- design spec: [`docs/superpowers/specs/2026-05-27-diffusion-text-animation-design.md`](docs/superpowers/specs/2026-05-27-diffusion-text-animation-design.md)
- type system notes: [`docs/fonts.md`](docs/fonts.md)

## credit

designed and built by [globalanomalyindex](https://github.com/globalanomalyindex). portfolio theme: looking to nature for answers.

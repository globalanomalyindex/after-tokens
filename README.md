# after tokens

A design and engineering case study on how to render text from a diffusion language model.

Autoregressive models write left to right, one token at a time, so the typewriter stream became the default way to show an answer arriving. Diffusion models do not work that way: they resolve a whole response at once, refining from noise toward clarity across the answer surface, with confidence rising in parallel rather than position by position. The typewriter is the wrong picture for that process.

This piece works through what the right picture is. The thesis: animation should signal the shape of the answer. A good reveal communicates the shape and state of a response so a person can read how far along it is and how sure the system is, and calibrate their trust in provisional output accordingly. The visual language is anchored in nature (mycelium, fog, aurora) because those are the systems that already resolve everywhere at once.

It is built as a scrolling editorial article with live, interactive demonstrations: the diffusion reveal running under multiple brand identities, a weather widget that arrives whole, and a playground for driving the choreography directly.

## Run it

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

| command | what it does |
| --- | --- |
| `pnpm dev` | start the dev server |
| `pnpm build` | production build |
| `pnpm test` | run the unit tests (Vitest) |
| `pnpm test:e2e` | run the end-to-end tests (Playwright) |
| `pnpm typecheck` | type-check without emitting |

## Stack

Next.js (App Router), TypeScript, Tailwind, and Motion for the choreography. All animation respects `prefers-reduced-motion`.

## Reference

- Design spec: [`docs/superpowers/specs/2026-05-27-diffusion-text-animation-design.md`](docs/superpowers/specs/2026-05-27-diffusion-text-animation-design.md)
- Type system notes: [`docs/fonts.md`](docs/fonts.md)

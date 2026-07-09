# after tokens

**An independent product design and engineering case study exploring how diffusion-generated language should arrive on screen.**

[View the live case study](https://after-tokens.vercel.app/) · [GitHub Pages mirror](https://globalanomalyindex.github.io/after-tokens/)

![After Tokens — product design and engineering case study](https://after-tokens.vercel.app/opengraph-image)

> **Hypothesis:** When a model refines many text positions in parallel, the interface should reveal the response as a settling field—not imitate left-to-right typing.

| | |
| --- | --- |
| **Role** | Product design, interaction design, prototyping, and front-end engineering |
| **Built** | A reusable `DiffusionText` engine, four reveal modes, brand variants, a structured weather answer, and an interactive playground |
| **Status** | Working prototype. Its comprehension hypothesis has not yet been validated with users. |
| **Stack** | Next.js, TypeScript, Motion, Tailwind CSS, Vitest, Playwright, and axe-core |

## the problem

Autoregressive models made left-to-right token streaming familiar. Masked diffusion language models can iteratively refine many text positions in parallel, so a typewriter reveal may misrepresent how an answer is forming.

After Tokens explores an alternative: reveal behavior that communicates what is visually settled and what is still changing. The current prototype uses designed choreography and hand-tagged response modes; it does not consume live model-confidence data. A production version would need a trustworthy model signal before animation could honestly represent uncertainty.

Mechanism references: [LLaDA](https://arxiv.org/abs/2502.09992) and [Simple and Effective Masked Diffusion Language Models](https://arxiv.org/abs/2406.07524).

## the system

The implementation separates six layers so each design decision can be tested independently:

1. Response content
2. Tokenization into stable visual atoms
3. Measured word and line geometry
4. A reveal strategy: Mycelium, Fog, Aurora, or Mitosis
5. Choreography across `ready → resolving → resolved`
6. Brand tokens, glyph treatments, and overlays

The same contract drives plain text, rich content, brand specimens, and a weather widget. Reduced motion resolves immediately while preserving a visible state label. Editorial examples expose ordinary screen-reader text; user-triggered results announce once on completion.

## key decisions

I built the prototype through repeated build, audit, and cut cycles. I rebuilt a particle-flock direction three times, then removed it because it reduced legibility and duplicated the simpler Mycelium mode. I rebuilt the entrance after reduced motion, replays, and impatient scrolling exposed its failure modes. I replaced abstract line graphs with word-level locks so the comparison demonstrated the behavior instead of merely describing it.

Nature supplied a motion vocabulary—branching, dissipation, bands, and division—but not proof. The phi-decay cadence is a tuning hypothesis. The case study now states exactly what is implemented, what is simulated, and what a user study would need to falsify.

## evidence and limits

The repository demonstrates a reusable typed engine, deterministic choreography, responsive geometry, reduced-motion behavior, and automated quality checks. It does **not** yet demonstrate that region-based revealing improves comprehension, that the modes map to user intent, or that any timeline corresponds to calibrated model uncertainty.

The glyph choreography is currently tuned for English and Latin-script content. This is a prototype primitive, not a published component library.

## run it

```bash
pnpm install
pnpm dev
```

Then open <http://localhost:3000>.

## scripts

| command | what it does |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm lint` | Run ESLint across the project |
| `pnpm typecheck` | Type-check without emitting |
| `pnpm test` | Run the Vitest unit suite |
| `pnpm test:e2e` | Run Playwright browser tests |
| `pnpm build` | Create the production build |
| `pnpm check` | Run lint, typecheck, unit tests, and a production build |

## deployment

The same app ships to two hosts from one codebase. Vercel is the canonical production URL. GitHub Pages is a mirror built with `GITHUB_PAGES=true`, which enables static export and the `/after-tokens` base path.

Pull requests run lint, typecheck, unit tests, both production build configurations, and Chromium Playwright checks. The Pages workflow repeats those checks and blocks deployment if any fail.

## reference

- [Design specification](docs/superpowers/specs/2026-05-27-diffusion-text-animation-design.md) — historical design direction; the shipped case study is the source of truth where they differ
- [Type system notes](docs/fonts.md)

## credit

Designed and built by [Christopher Robin Fiore](https://github.com/globalanomalyindex), product designer and design engineer.

## license

[MIT](LICENSE) © 2026 Christopher Robin Fiore.

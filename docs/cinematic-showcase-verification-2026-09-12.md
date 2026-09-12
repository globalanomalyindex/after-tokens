# After Tokens — cinematic opening and live comparison verification

12 September 2026 · Christopher Robin Fiore · GitHub: `globalanomalyindex`

I verified the fullscreen opening, upfront live comparison, default raw prefix and continuing-sentence refill together. This is a software and browser verification record for the changes after `bd5cf9f0955fbd7ebdec8c89435ed5ac9af20243`, not a new diffusion capture or reader study.

## What changed

The opening presents four authored sentence commitments through the shared renderer, then contracts the same stage into the page. Skip and Escape restore access immediately; returning sessions, direct links and reduced motion bypass fullscreen. The live gallery follows before the research, with Reshape and each-sentence release selected and the raw committed prefix always visible. Both panels share one authored 8.5-second source clock. Whole-answer release is an explicit comparison. These scenes demonstrate presentation, not inference speed.

I corrected the continuing-field gap with a 160 ms refill alongside the existing 280 ms handover. A transfer that starts after source finality does not refill; an earlier-started refill can finish during terminal fading. The [continuity note](sentence-continuity-fix-2026-09-12.md) retains the cause, initial failing regression and focused checks. The [current handoff](growing-skeleton-v8-handoff-2026-09-12.md) records the complete interaction contract.

Personal credits, citation, page metadata and social preview use **Christopher Robin Fiore**. `globalanomalyindex` remains the GitHub identity.

## Completed checks

| Check | Actual result |
| --- | --- |
| Unit/component suite | 394 passed across 50 files; zero failures |
| Production browser suite | 96 passed: 32 each in Chromium, WebKit and iPhone 14 emulation; no failures, skips, retries or flaky cases |
| Current and historical instrument guards | 166 passed; this reruns the guard suites, not historical motion observations |
| Lint | Passed |
| Normal production build | Passed |
| GitHub Pages static build | Passed; [archived build log](../data/experiments/cinematic-showcase-2026-09-12/pages-build.log) |

The browser run started at `2026-09-12T17:30:34.331Z` and took 550,173.02 ms. The [machine record](cinematic-showcase-verification-2026-09-12.json) lists the cases, exact artifact hashes and 183 source inputs under fingerprint `e46f30035ccad5be6de2077eb6602d49e57b2f9574a0874f5b5caafd8cb1224f`. The [raw browser report](../data/experiments/cinematic-showcase-2026-09-12/browser.json), [unit report](../data/experiments/cinematic-showcase-2026-09-12/unit.json), [guard log](../data/experiments/cinematic-showcase-2026-09-12/guards.log), [build log](../data/experiments/cinematic-showcase-2026-09-12/build.log) and [lint log](../data/experiments/cinematic-showcase-2026-09-12/lint.log) remain available for inspection.

Two regression fixes are included. Centering an overflowing conversation could put the prompt above the reachable scroll origin. Start alignment with automatic vertical margins now centers it when space permits and keeps its top reachable when it overflows; the browser suite checks a 320 × 620 viewport. An explicit offscreen Replay could also restart the clock despite the closed visibility gate. The gallery now rechecks that gate for every run identity; its unit regression holds the restarted clock at zero until reentry. The integrated suite also covers source finality, exact output, sentence continuity, focus containment, scroll unlocking, direct links, session bypass, pause/replay and reduced motion.

I inspected separate [desktop](../data/experiments/cinematic-showcase-2026-09-12/cinematic-showcase-desktop.png) and [mobile](../data/experiments/cinematic-showcase-2026-09-12/cinematic-showcase-mobile.png) gallery captures. The panels are alongside each other at 1380 × 900 and stacked at 390 × 844. The [local visual check](../data/experiments/cinematic-showcase-2026-09-12/cinematic-showcase-visual.json) records exact final text, zero horizontal overflow and no page errors in both cases. These are finite browser captures, not physical-device results or a performance distribution.

## Evidence boundary

The v8 [motion report](growing-skeleton-v8-validation-2026-09-12.json), [browser archive](growing-skeleton-v8-browser-validation-2026-09-12.json) and [recordings](growing-skeleton-v8-showcase-capture-2026-09-12.json) remain frozen at `bd5cf9f`. Their measurements and media are not relabeled as proof of this revision. No reader benefit, model-quality improvement or physical iPhone performance is established here.

This checkpoint records both local builds and the completed software checks. Deployment and verification of the served commit are separate release gates, recorded in the external publication handoff after they complete. No public-hosting success is claimed in this checkpoint.

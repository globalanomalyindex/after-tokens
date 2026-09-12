# Ambient answer composition implementation plan

> **Implementation workflow:** Use the independent work assignments below, then review the complete integration. Implementation and publication proceed through the release checks in this plan.

**Goal:** Replace the default token-shaped waiting surface with a continuous ambient bar composition, then present the exact whole answer together at verified source finality.

**Architecture:** The existing causal reducer gains an `answer` policy. A decorative component consumes activity and motion preferences only; it cannot inspect tokens, future text or final geometry. The existing original visual design contains a controlled motion comparison and a separate availability-cost comparison.

**Tech stack:** Existing Next.js, React, TypeScript, CSS compositor animation, Vitest and Playwright. No new runtime dependency.

**Spec:** `docs/field-experiment-2026-09-09.md`.

## Constraints

- Preserve original typography, palette, section rhythm and brand controls.
- No token rectangles, predicted final line lengths, text blur, per-letter stagger or decorative completion timer controlling release in the default answer mode.
- Bar motion represents an active request, not percent complete, correctness or a reconstructed current ChatGPT animation.
- Static, coherent and independent bar conditions share the same answer policy, source events and final handover.
- Pause, offscreen and hidden-document states suspend animation; manual and system reduced motion are supported.
- Exact whole text is selectable at authoritative finality. Empty, stopped, failed and revised requests remain distinguishable.
- Preserve the original 60-trace corpus and historical three-policy report. Report new batched captures and answer-policy costs separately.
- Reader benefits remain hypotheses. Engineering checks and actual model traces are the completed evidence.

## 1. Source contract and measured cost

Files: `lib/settle/{types,boundary,reader}.ts`, `tests/settle/answer-policy.test.ts`, `data/experiments/answer-policy-cost-2026-09-09.json`.

- [x] Add `answer` to `Policy`; release no passage before contiguous committed EOS, valid explicit finish, or final snapshot.
- [x] Test final snapshots, gaps, partial prefixes, stop/error, no guessed finality, exact output across all 60 runs and preservation of historical costs.
- [x] Generate a separate recorded-clock cost report using `measureReplay`; preserve empty-run exclusions and paired per-trace comparisons.

## 2. Ambient material and accessible answer surface

Files: `components/settle/ambient-composition.tsx`, `app/ambient-composition.css`, `components/settle/settle-answer.tsx`, `tests/settle/answer-surface.test.tsx`.

- [x] Add a component whose input has no source text: `AmbientComposition({ active, motion, condition, complete, runId, tempo })`.
- [x] Author five broad tapered bars in a fixed decorative plane. Animate only transforms and opacity with continuous cycles. Independent control varies periods, with identical resting geometry and bounded per-bar motion ranges.
- [x] Before release render no candidate or committed glyph DOM in answer mode. At release render `state.passages.map(p => p.text).join('')` as one natural text span.
- [x] Show stopped/error partial prefixes behind an explicitly labeled inspect control, without a completion response. Show an explicit empty-answer message outside the selectable answer.
- [x] Test no early glyphs, identical text across motion conditions, complete empty output and partial recovery. Render real DOM; do not test a copied implementation.
- [x] Add a short decorative completion response with glyph transform/filter/opacity unchanged. Keep minimum loading area constant and measure final growth separately.

## 3. Interactive study and case-study integration

Files: `components/settle/ambient-study.tsx`, `components/sections/section-{hook,field,previews,concept,playground}.tsx`, `components/settle/settle-stage.tsx`.

- [x] Default hero and mobile concepts to answer policy; preserve old three policies as available comparisons.
- [x] Drive the three ambient conditions from one replay clock. Include the actual new 32-step recordings and their unedited outputs. Keep the poor random output as a clearly identified counterexample.
- [x] Offer recorded timing and an explicitly labeled inspection pace. Controls remain above growing answers.
- [x] Display answer-policy cost using its new report, not fabricated entries in the historical report.

## 4. Writing, verification and handoff

Files: remaining existing section copy, `README.md`, research note, complete Markdown handoff, browser tests and measured report.

- [x] Explain the skeleton precedent, uncertain formatting, common-fate hypothesis and motion construction using primary sources and official motion guidance.
- [x] Browser checks: no pre-final text, all text in one update, exact final selection, stable glyphs, bar continuity, pause/offscreen/motion-off, desktop/WebKit/mobile emulation, no overflow.
- [x] Record same-source static/coherent/independent comparisons. Report frame measurements and final container height change without claiming physical iPhone or human-study results.
- [x] Run lint, typecheck, unit tests, browser checks, normal and GitHub Pages builds. Obtain independent review of the final code and evidence.
- [x] Update the complete implementation handoff with code, sources, rationale, acceptance gates and unresolved reader hypotheses.
Publication follows the local release checkpoint below. The planned release uses a normal push to `main`; the commit-specific GitHub Actions deployment and delivered live-verification report establish publication status. Do not infer deployment from this plan.

**Local release checkpoint:** All implementation, writing, source validation and rendering checks above are complete. See [release verification](../../ambient-release-verification-2026-09-09.md). The self-contained Markdown source bundle and binary patches are assembled from the final commit, so their commit identifiers and file hashes refer to the delivered tree.

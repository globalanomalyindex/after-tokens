# After Tokens: solid skeleton implementation handoff

> **Historical material: `solid-rounded-skeleton-v1`, revision `a7606d9`.** These parameters and results are preserved for that revision. Continue with the [anchored motion research](anchored-skeleton-research-2026-09-09.md) and [current implementation handoff](anchored-skeleton-handoff-2026-09-09.md). The historical [JSON report](skeleton-motion-validation-2026-09-09.json) is unchanged.

**9 September 2026 · material `solid-rounded-skeleton-v1` · fresh browser verification recorded; reader outcomes unvalidated.**

Continue from the existing repository and preserve the original case-study design. The current material uses solid muted-gray pill bars, a familiar shared opacity pulse, and an optional small change in visible length. Its three conditions are **still**, **breathe** and **reshape**, with reshape as the default. The whole-answer source contract and measured availability costs remain unchanged.

This file supersedes the material instructions in the [feathered ambient handoff](ambient-handoff-2026-09-09.md). That historical document and the `05914c1` reports must retain their original claims. Their 268 unit tests, 42 browser checks and 9,667 matched glyph samples do not validate this new material. The fresh solid-material tests, browser observations and recordings are recorded in section 7 and the [current release record](skeleton-release-verification-2026-09-09.md).

## 1. Build exactly this material

Five solid, uniformly filled bars occupy an authored 8 em loading area. All start at left zero. Their top positions are 0.55, 1.92, 3.31, 4.69 and 6.05 em; widths are 88%, 64%, 92%, 72% and 80%. Each is 0.72 em high. Their ends remain circular and their height and position do not animate. The five rows are an authored composition, not a forecast of five output lines.

| Visible label | Code condition | Opacity | Shape |
| --- | --- | --- | --- |
| still | `static` | Parent 0.86; ink 0.2 | Full authored width, no motion |
| breathe | `breathe` | Parent 0.72 → 1 → 0.72; ink 0.2 | Full authored width |
| reshape | `reshape` | Exactly the same pulse as breathe | Rounded horizontal clipping 0% → 8% at each end → 0% |

The moving cycle is 4,800 ms at tempo 1 with `cubic-bezier(.45, 0, .55, 1)`. The two moving conditions use the same authored waveform and duration. A fresh, fully visible desktop replay starts them together; independent visibility pauses can change their relative exposure after scrolling. Static uses the pulse's nominal opacity midpoint; it is not claimed to match all short-run visible-ink averages. At maximum clipping, rectangular visible width is 84% of the original. Visible area and total ink also change, so a preference for reshape cannot automatically be attributed solely to contour movement.

Use rounded clipping to shorten the visible bar. Do not scale it horizontally: that would distort circular caps. Do not animate height, translate rows, move them on a diagonal, or return to feathering, blur, gradients, a traveling shimmer or a blurred completion glow. The full fill remains uniform within each visible pill.

At source finality, remove the bars immediately and render the exact complete answer in one ordinary text span at full reading contrast. Show the same separate 260 ms thin-outline response around the answer in all three conditions. It is not a glow, a glyph mask or a letter reveal. It must neither delay the answer nor claim its factual correctness.

## 2. Rationale and reference

The [CSS Script reference] I reviewed(https://www.cssscript.com/skeleton-loader-placeholder/) points to [zalog's placeholder-loading source](https://github.com/zalog/placeholder-loading). Inspection found solid rows plus a moving gradient with a 0.8-second default duration. This revision borrows the conventional solid geometry, not that traveling animation. Do not describe the reference as a trial showing better waiting or reading.

[MUI already offers pulse, wave and static skeletons](https://mui.com/material-ui/react-skeleton/). Pulse is therefore prior art. The current question is whether gently shortening a solid bar adds something useful to that familiar pulse, with an honest source boundary and explicit cost for waiting for a whole answer.

Common-fate research motivates shared changes as a grouping cue, but both moving conditions share that cue. This comparison does not isolate it. The small controlled skeleton study reviewed in the [research document](skeleton-motion-study-2026-09-09.md) found no significant advantage over spinners. Carbon's restrained motion guidance informs the short outline; 260 ms remains an authored parameter, not a psychological constant. No dopamine or guaranteed reader-benefit claim is supported.

## 3. Files and responsibilities

Internal files keep their existing `ambient` names. Their public condition labels and material have changed; do not create a second decoder or fork the release rules merely to rename them.

| File | Responsibility |
| --- | --- |
| [components/settle/ambient-composition.tsx](../components/settle/ambient-composition.tsx) | Five authored shapes, condition IDs, default reshape, active/motion state and stable replay identity |
| [app/ambient-composition.css](../app/ambient-composition.css) | Uniform fill, circular caps, opacity pulse, rounded clip-path change, static and reduced-motion states |
| [components/settle/ambient-study.tsx](../components/settle/ambient-study.tsx) | Still/breathe/reshape controls, aligned comparison rows and shared source clock |
| [components/settle/settle-answer.tsx](../components/settle/settle-answer.tsx) | Whole-answer rendering, once-only completion cue, partial/error/revision handling |
| [app/globals.css](../app/globals.css) | Exact readable-text treatment, 8 em minimum occupied frame and thin-outline styling |
| [lib/settle/reader.ts](../lib/settle/reader.ts), [boundary.ts](../lib/settle/boundary.ts) | Source availability and finality, unchanged by material choices |
| [lib/settle/experimental-recordings.ts](../lib/settle/experimental-recordings.ts), [replay.ts](../lib/settle/replay.ts) | Causal fixture events, observed-loop clock and no retrospective answer access |
| [components/sections/section-field.tsx](../components/sections/section-field.tsx) | Current case-study explanation and fresh validation links |

These are the exact geometric values to preserve when inspecting or refining the implementation:

```ts
const widths = [88, 64, 92, 72, 80]; // percentages of the authored container
const tops = [0.55, 1.92, 3.31, 4.69, 6.05]; // em
const height = 0.72; // em, constant
const allocation = 8; // em, not a final answer-length estimate
const period = 4800; // ms at tempo 1
const opacityRange = [0.72, 1, 0.72];
const reshapeInsetPercent = [0, 8, 0]; // at each horizontal end
```

The arrays above are parameter notes, not a replacement component. Continue from the actual source files and use the complete source patch accompanying the final handoff.

## 4. Keep source semantics separate

The composition must receive no tokens, candidate strings, word widths, final answer text, future Markdown or completion percentage. Its geometry depends only on authored parameters and available container dimensions. Do not consult hidden final DOM to make the transition look like a word-for-word morph.

The `answer` policy releases only after source finality: a committed end reached by the contiguous prefix, a valid explicit finish, or an explicitly final snapshot. A guessed end, punctuation, high probability, motion phase, stop or error cannot release a completed answer. The exact final answer appears once with native whitespace handling and selection.

Empty final outputs receive an explicit label. Interrupted or failed sources can expose the committed prefix in a disclosure marked incomplete, without joining later fragments across gaps. Revisions remain explicit review/apply actions, preserving the prior answer. Material changes must not alter these behaviors.

An app-owned form may establish containers before words exist. An enforced schema may guarantee particular structure. A prompt asking for three list items does not guarantee either the list or independent item completion. This renderer makes no assumption that formatting always arrives first. A future item-by-item version needs stable region IDs and explicit source-backed finality for each region; that extension is not implemented here.

## 5. Lifecycle, controls and accessibility

Keep animation instances and phase when motion is switched off or playback is paused. Do not cancel and recreate them with a broad inherited `animation: none` rule. Only a new replay deliberately resets the composition. Static intentionally has no movement. Respect system reduced motion and offer a manual motion-off setting; state remains understandable without animation.

The completion outline is a one-time event. Remove it after its 260 ms response; consume it without deferral if completion occurs while hidden, paused or motion-off. Enabling motion or returning to the page must not replay it. The letters remain at full contrast throughout.

Desktop compares three conditions on one source clock. A shared grid row aligns their panels even when captions wrap; individual offscreen observers are still not a participant exposure controller. Narrow screens show one selected condition; selecting another restarts the same source. Decoration pauses offscreen while the source replay continues after its initial start. This demonstration behavior is not controlled participant exposure. Keep one shared polite announcement, separately named answer regions, and controls above growing content.

The earlier-word option is a separate policy comparison using the same clock. Cache its reducer state by elapsed source-event count, not every animation frame. It may reveal usable words earlier and extend their layout later; it is not a control that isolates skeleton motion.

## 6. Source evidence and costs that carry forward

The original 60 captures use one committed token position per step. Four newer captures use four positions per step over 32 steps, with content-only multi-commit steps of 4, 18, 5 and 32. End/padding positions are included in the four-position total. Poor model text remains unchanged. [Source documentation](../data/experiments/README.md), [replay audit](../data/experiments/parallel-replay-audit-2026-09-09.json).

The unchanged [answer-policy cost report](../data/experiments/answer-policy-cost-2026-09-09.json) measures 57 nonempty original traces, retaining three empty outputs for the 60-run fidelity audit. Median whole-answer first eligibility is 15.8 seconds; paired median extra wait over sentence release is 10.5 seconds. The metric is source-reducer eligibility, not browser paint, perceived waiting or production model latency.

Original recordings use synchronized forward-pass time. The four newer examples use observed capture-loop intervals. The UI defaults to that observed clock; half-speed inspection stretches source time while the decorative period remains independently authored. All eight fresh measurements used explicit 0.5× source inspection to observe a full 4.8-second decorative cycle. The report and videos label that clock; captured times remain separately available. Never call it a model speedup or silently substitute it for the default.

## 7. Fresh verification and continuation

The [fresh report](skeleton-motion-validation-2026-09-09.json) uses namespace `solid-rounded-skeleton-v1` and records runtime/script/source fingerprints. Eight sequential Chromium 148 observations cover the same short-list capture in three conditions at 390 and 1380 px widths, plus narrow long and poor-output reshape cases. All use explicitly selected 0.5× source inspection, allowing a complete 4.8-second decorative cycle. The [list](../public/study/skeleton-answer-mobile.webm) and [long-answer](../public/study/skeleton-answer-long.webm) videos are actual browser recordings at this half-speed inspection setting, not production latency recordings.

All eight observations showed one exact completed-text arrival, no pre-final text, no faded/blurred/transformed final text, and fixed bar and loading-area height. Across 9,648 matched samples of final words' first characters, observed displacement after arrival was 0 px relative to the first final frame and answer surface. This is not a measurement of every glyph. The 390 px long answer still grew its occupied frame by 99.375 px at arrival, from 120 to 219.375 px. Stable text after arrival is not zero final layout change.

The maximum changing contour-edge displacement between sampled frames was 0.3113467 px. The harness resolves the visible rounded inset against the ink rectangle instead of treating its unchanged layout rectangle as evidence of no motion. These sequential observations are geometry diagnostics, not a reader study, a rendering-cost benchmark or physical iPhone validation. Clip-path animation is not assumed to run only on the compositor.

Fresh verification passed 327 unit/component cases across 40 files and 45 browser checks across Chromium, WebKit and iPhone 14 emulation against a fresh normal production build. Normal and Pages production builds passed. Exported-page replay, solid-material, completion-outline and video-hash checks passed in the [release record](skeleton-release-verification-2026-09-09.md). The previous feathered report remains untouched and explicitly historical.

| Gate | Required check |
| --- | --- |
| Material | Solid uniform fills, 0.72 em constant height, circular caps, authored widths, no gradients, masks, blur, shimmer, row translation or scale |
| Treatment | Still has no motion; breathe changes only pulse opacity; reshape adds rounded insets on the same pulse; area and ink changes are acknowledged |
| Final text | No pre-final text, one exact final update, full contrast, no text blur/translation/scale/stagger |
| Geometry | Measure the clipped visible contour, not only the unchanged layout rectangle; separately measure final answer-height expansion and glyph movement after arrival |
| Lifecycle | Motion-off/pause preserves phase; replay resets; hidden or unavailable completion cannot cause a later outline replay |
| Accessibility | Reduced motion, one study announcement, targetable controls, selection and labeled empty/error/partial/revision states |
| Evidence | Record material ID, source, condition, source clock, viewport, revision, sampling method and raw evidence; distinguish browser emulation from physical devices |

For another implementation pass, inspect the actual solid material first. Refine one property at a time without changing release policy. Run the relevant checks after edits and update the documentation with the actual outcomes. Do not carry old pass counts into a new result merely because the source contract is unchanged.

```bash
pnpm check
pnpm test:e2e
GITHUB_PAGES=true pnpm build
```

Fresh source-policy regeneration is required if reducer or event logic changes. A purely visual revision still needs browser validation because clipping, rounded edges, pause and completion behavior can differ across engines. Clip-path use is not proof of compositor-only execution or low power use.

## 8. Reader study and decision rule

Compare reshape against breathe at identical answer timing and pulse. Measure fluidity, distraction, perceived wait, activity interpretation and preference after repeated use. The added contour movement includes altered visible area and total ink; this is a treatment comparison, not a pure psychological-mechanism test. Compare breathe with still separately.

Then compare earlier-word access and whole-answer release as an availability tradeoff, recording task correctness, time to a correct usable answer and presentation hold. Include refusals, wrong answers, long output and interruptions. Ask what the bars imply before explaining them. Do not treat more confidence in a wrong answer as success.

Pilot first, choose the primary measure and smallest useful effect, then power and preregister the study. A preference for still or breathe is a valid result and should change the default if it persists. No reader study has yet established which treatment is better. The [motion study document](skeleton-motion-study-2026-09-09.md) contains the source rationale and falsifiable hypotheses.

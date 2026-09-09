# After Tokens: anchored skeleton implementation handoff

**9 September 2026 · material `adaptive-cell-skeleton-v5` · reader benefits unvalidated.**

Continue from the existing repository and preserve the original case-study design. The capsule still divides into breathing rows and small reshaping pills, with intermittent glimmer. Its waiting height follows a capped estimate from available source content and the container’s actual type metrics. Committed positions and revisable candidates stay distinct. At source finality, measure the real answer, fit any missing room, then let all words arrive together with one small settling motion. Source finality is unchanged; visual availability and initial text travel are separate presentation costs to measure.

This supersedes the material instructions in the [solid skeleton handoff](skeleton-handoff-2026-09-09.md), whose `a7606d9` measurements remain historical. Do not relabel those results as validation of this revision. The [current research note](anchored-skeleton-research-2026-09-09.md) separates primary-source guidance from the authored motion and reader hypotheses.

## 1. Causal sizing and visual arrival

The [estimateAnswerEnvelope](../lib/settle/answer-envelope.ts) helper accepts only a state containing current committed `tokens`, the available width and a text-advance measurement function. It excludes the earliest currently committed EOS and every later position. This path never reads drafts, spins, snapshot candidates, the capacity bound, received count, future answer strings or final word/layout metadata. The recorded Qwen source keeps this behavior.

```ts
type AnswerEnvelopeEstimate = {
  rowCount: number;
  knownAdvancePx: number;
  knownNewlines: number;
  committedFragments: number;
};
// A = summed advance of current non-EOS fragments; W = available width;
// N = known newline breaks. Invalid width falls back to five rows.
const rowCount = Math.max(5, Math.min(14,
  Math.ceil(1.1 * A / W + .5 * N) + 1,
));
```

For a source that actually supplies revisable snapshots, `estimateCandidateEnvelope(candidate, availableWidthPx, measureAdvance)` uses the same bounded formula on the **current received** candidate. It returns `{ rowCount, candidateAdvancePx, candidateNewlines }`, keeping these provisional diagnostics distinct from committed-fragment diagnostics. It measures nonempty lines split on CRLF, CR or LF and counts those line breaks; invalid or nonpositive measured advances contribute zero. A candidate may be mostly noise or later shrink. Its extent is not final geometry or convergence.

The reducer retains only the latest nonfinal `snapshotCandidate: string | null` and clears it on finality, stop, error, revision and reset. Candidates never become committed tokens, prefix text or released passages. In the hook’s waiting branch, select the estimator by source capability:

```ts
const estimate = state.source === 'snapshot'
  ? estimateCandidateEnvelope(state.snapshotCandidate ?? '', width, measureAdvance)
  : estimateAnswerEnvelope(state, width, measureAdvance);
```

The candidate words remain absent from the protected answer DOM. The separate, explicitly labeled draft inspector may display them for comparison. A final-only source supplies no provisional candidate and therefore keeps the five-row initial allocation until actual final text can be measured. Do not synthesize snapshot events from a video, promote repeated identical drafts to finality, or claim a connected Gemini API.

The formula is an authored heuristic, not a proven lower bound or exact layout prediction. Canvas measurement uses the page’s font/style/weight/size/family, disables kerning and adds letter-spacing between characters within each fragment. If Canvas is unavailable, the fallback is character count × font size × 0.52 plus that letter-spacing contribution. Fragment summation does not reproduce final word wrapping or unknown content. The 1.1 factor, half-line newline contribution, one-row slack and 5–14 limits require evaluation.

The [useAnswerEnvelope](../components/settle/use-answer-envelope.ts) hook accepts `{ state, runId, frameRef, pageRef, effectiveMotion }` and returns `{ rowCount, lineHeightPx, barHeightPx, phase, arrivalKey, dismissArrival }`. Its phases are `waiting`, `fitting` and `ready`. Identity includes both `runId` and the source revision version.

During waiting, row count is the maximum estimate so far within a stable sizing context. Width is compared at half-pixel precision; font, line-height and letter-spacing changes reset that maximum. The target frame height is `rowCount * computedLineHeight`. Resize from the current rendered height over 380 ms with `cubic-bezier(.22, 1, .36, 1)`. Do not animate from the previous target: source updates can interrupt a running resize. Motion disabled or changes of at most 1 px resolve directly.

At valid source finality, the actual final text is available. Its natural page height can now be measured while the page is `visibility: hidden`:

1. If actual height exceeds the current rendered frame by more than 1 px and effective motion is active, enter `fitting`, retain the cells and animate to exact height over an authored 180 ms. Then enter `ready` and expose the complete answer.
2. If enough room is already available, enter `ready` immediately and shrink surplus height over 180 ms.
3. Reduced motion, manual motion-off, pause, offscreen/hidden state, empty/failed output or a pending revision bypass the decorative wait and cue. A width/font change during fitting also finishes immediately instead of restarting the waiting budget.
4. Guard completion callbacks by run/version and operation identity. A new run cancels stale fitting. Later visible resize/reflow must not add a new visual delay or completion cue.

The 180 ms fit is an authored duration, not a wall-clock guarantee: scheduling, rendering and callback delivery can extend observed time. Measure source finality and complete visual availability separately. Retained cells during fitting represent presentation preparation; status reads **answer received · fitting the view**. Do not describe that interval as more model work.

Once ready, all words move together at full opacity with no per-word stagger, blur, scale or font-weight change:

```css
.settle-answer-text[data-arriving="true"] {
  animation: settle-answer-ink 180ms cubic-bezier(.25, 1, .5, 1) both;
}
@keyframes settle-answer-ink {
  0% { transform: translateY(1.5px); }
  70% { transform: translateY(-.2px); }
  100% { transform: translateY(0); }
}
```

The maximum excursion from final rest is 1.5 px; the range between extrema is 1.7 px, and total authored path is 1.9 px. This intentionally replaces the earlier zero-arrival-motion contract. At the end of the authored 180 ms animation the text rests; one separate thin outline lasts 260 ms. Optional whole-answer vibration, where supported, follows visual readiness; legacy earlier-passage vibration retains its passage-release behavior. No native iPhone haptic implementation is claimed.

## 2. Material and controls

| Property | Current implementation |
| --- | --- |
| Conditions | `static`, `breathe`, `reshape`; labels still, breathe, reshape; default reshape |
| Composition | Five-line initial area, adaptively growing to fourteen actual line-heights; reshape includes a 950 ms introduction |
| Row widths | Repeating pattern 88%, 92%, 96%, 84%, 70% across the fourteen mounted rows |
| Row tops | `index * lineHeight + (lineHeight - barHeight) / 2`, using actual page type metrics |
| Paragraph anchor | Division offsets move from left 4% to zero; after the introduction, all row offsets stay zero and each cluster’s outer ends stay fixed |
| Bar height | 0.9 × font size, centered within each actual line-height |
| Steady rows | The first and third rows in each five-row pattern are full bars; geometry stays fixed within a stable type/container context while pulse and glimmer change appearance |
| Cluster rows | Rows 2, 4 and 5 in each pattern contain 5, 4 and 5 pills; all fourteen rows remain mounted, containing 43 shapes in total; the first five contain 16 |
| Material | Solid `currentColor` bodies, ink opacity 0.2, 999 px radius, no blur/feather mask/shadow; reshape adds a faint gradient glimmer and clipped division introduction |
| Still | Parent opacity 0.86; all geometry paused at the initial authored phases |
| Shared breath | Parent opacity 0.72 → 1 → 0.72, 4,800 ms at tempo 1, `cubic-bezier(.45, 0, .55, 1)` |
| Cluster phases | 0, 0.43, 0.82 cycles, implemented as negative delays; all are resting keyframes |
| Reshape | 950 ms division introduction, shared pulse, local redistribution, appearing-pill fade/settle and cell-local glimmer |
| Glimmer | 8,000 ms at tempo 1; all cells share a local −110% → 110% horizontal sweep during 16–26% of the cycle; otherwise outside the clipped cell |
| Final handoff | Exact height is measured only after source finality; necessary fitting precedes visual readiness, then whole-text settle and thin outline accompany the answer |

Each pill is described by `[x0, width0, x1, width1]`, as percentages of its own row. The first arrangement is the base; the second makes room for the interior pill. These are the exact cluster definitions, using zero-based row and pill indices:

```ts
const clusters = [
  { row: 1, phase: 0, newborn: 1, pills: [
    [0, 25, 0, 20], [27, 0, 22, 13], [27, 32, 37, 25],
    [61, 16, 64, 13], [79, 21, 79, 21],
  ] },
  { row: 3, phase: .43, newborn: 2, pills: [
    [0, 33, 0, 24], [35, 24, 26, 22], [61, 0, 50, 15],
    [61, 39, 67, 33],
  ] },
  { row: 4, phase: .82, newborn: 2, pills: [
    [0, 18, 0, 18], [20, 31, 20, 23], [53, 0, 45, 12],
    [53, 21, 59, 15], [76, 24, 76, 24],
  ] },
];
```

For each `left` or `width` property, its peak value is `base + 1.025 * (target - base)`. That is 2.5% overshoot of the change, not 2.5% scale of the entire row. Persistent pills whose positions and widths do not change receive no shuffle or nudge animation.

```css
@keyframes skeleton-breathe {
  0%, 100% { opacity: .72; }
  50% { opacity: 1; }
}
@keyframes skeleton-shuffle {
  0%, 16%, 82%, 100% { left: var(--pill-x0); width: var(--pill-w0); }
  36% { left: var(--pill-x-peak); width: var(--pill-w-peak); }
  43%, 62% { left: var(--pill-x1); width: var(--pill-w1); }
}
@keyframes skeleton-nudge {
  0%, 16%, 43%, 62%, 82%, 100% { transform: translateY(0); }
  36% { transform: translateY(-.035em); }
}
@keyframes skeleton-emerge {
  0%, 16%, 82%, 100% { opacity: 0; transform: translateY(.10em) scaleY(.82); }
  36% { opacity: 1; transform: translateY(-.035em) scaleY(1.08); }
  43%, 62% { opacity: 1; transform: translateY(0) scaleY(1); }
}
```

The `__bar` layer is the fixed row envelope and owns the shared pulse. Each `__presence` child owns a pill’s local position and width, plus either a nudge or appearance response; both use `cubic-bezier(.25, 1, .5, 1)` easing and the row’s negative delay. Its `__ink` child supplies the uniform rounded fill. `data-moving` identifies changed geometry, and `data-new` selects the appearing interior pill. The new shape’s ends intentionally deform during vertical scaling. A growing pill narrower than its height is also temporarily a rounded dot rather than a full capsule; do not claim every transient shape has the same circular cap geometry as a steady bar.

The underlying field uses the same authored phase offsets in every condition. At 0, 0.43 and 0.82 cycles, its pills are fully present or absent, without a frozen partial fade or squash. Static holds that arrangement with no pulse; breathe holds geometry and runs the pulse. Reshape adds the introduction and runs all channels. Its visible initial state therefore differs from the controls; do not describe the comparison as isolating geometry or as having an identical entrance.

### Division introduction

[SkeletonDivision](../components/settle/skeleton-division.tsx) still creates five contiguous slabs, each at left 4%, width 88% and height 0.56 × font size. The joined top is `(5 * lineHeight - 2.8 * fontSize) / 2`; each next slab adds 0.56 × font size. The shared clip uses that joined top as its vertical inset and has a 1.4 em radius. It occupies the initial five-line region, even if the waiting frame later grows. Parent opacity begins at 0.2.

| Decorative time | Authored action |
| --- | --- |
| 0–114 ms | Hold the joined capsule |
| By 589 ms | Open the shared clip to the initial five-line region |
| 646 ms | Reach `base + 1.018 * (target - base)` for top, width and height; radius 999 px |
| 750 ms | Reach the first five row centers, left zero and bar height 0.9 × font size |
| 750–950 ms | Reciprocal crossfade: division opacity 0.2 → 0, field opacity 0 → 1 |
| After 950 ms | Division remains inert at opacity zero and `visibility: hidden` until the composition is removed |

Left offsets remain between 4% and zero; they do not overshoot horizontally. Geometry uses `cubic-bezier(.25, 1, .5, 1)`; the final crossfade is linear. This is a one-time CSS choreography, not model stages or a physical spring. Source finality can begin the final size handoff at any point. Visual readiness removes the whole composition even if division has not finished; the renderer never waits for the decorative cycle.

### Intermittent glimmer

Each ink layer has an overflow-clipped `::after` with this faint highlight:

```css
background: linear-gradient(
  90deg, transparent 15%, rgb(255 255 255 / .3) 50%, transparent 85%
);
@keyframes skeleton-glimmer {
  0%, 16% { transform: translateX(-110%); }
  26%, 100% { transform: translateX(110%); }
}
```

All 43 mounted cells use the same phase and linear 8,000 ms cycle; exposing additional rows does not remount them. The sweep is local to each cell’s width, not one physical highlight moving across the entire viewport. Its maximum white-alpha contribution is 0.06 before the row’s breathing opacity, because the 0.3 highlight sits inside ink opacity 0.2. It acknowledges activity; it does not estimate completion or confidence. Still and breathe have no glimmer or division overlay.

All decorative clocks begin together when active motion starts. Cluster movement and glimmer run behind the 950 ms introduction. At tempo 1, the first glimmer sweep occupies 1.28–2.08 seconds of decorative elapsed time, not that interval after field reveal. The existing tempo input gives periods `4800 / rate` and `8000 / rate`, where `rate = clamp(tempo, .7, 1.4)` with a fallback of 1 for nonfinite inputs. The introduction stays 950 ms regardless of tempo. The study’s 0.5× inspection control changes source replay time, not these decorative periods.

Use the complete source files, not the excerpts alone. Source time and decorative time can diverge through pause or visibility behavior; neither a glimmer cycle nor division completion triggers text availability.

## 3. Files and integration

| File | Responsibility |
| --- | --- |
| [ambient-composition.tsx](../components/settle/ambient-composition.tsx) | Authored fourteen-row/pill arrangement, numeric row/type inputs, presence/ink layers, material ID and stable replay identity |
| [ambient-composition.css](../app/ambient-composition.css) | Solid material, local redistribution, appearance/settle, phase offsets, glimmer and reduced-motion pause |
| [skeleton-division.tsx](../components/settle/skeleton-division.tsx), [skeleton-division.css](../app/skeleton-division.css) | One-capsule introduction, bounded division geometry, reciprocal crossfade and phase-preserving pause |
| [ambient-study.tsx](../components/settle/ambient-study.tsx) | Three-condition comparison, shared source clock, inspection speed and aligned captions |
| [answer-envelope.ts](../lib/settle/answer-envelope.ts) | Separate committed-fragment and provisional-candidate size heuristics with shared 5–14 row limits |
| [use-answer-envelope.ts](../components/settle/use-answer-envelope.ts) | Type metrics, interrupted waiting resize, final fit, visual readiness and stale-callback guards |
| [settle-answer.tsx](../components/settle/settle-answer.tsx) | Hidden post-finality measurement page, exact visible answer, fitting status, visual-ready vibration/outline and partial/error/empty/revision states |
| [globals.css](../app/globals.css) | Readable-text rules, answer frame, thin outline and motion-off exceptions for the field, division, pill and glimmer animation layers |
| [reader.ts](../lib/settle/reader.ts), [boundary.ts](../lib/settle/boundary.ts) | Unchanged source finality rules; latest nonfinal snapshot storage and lifecycle cleanup for provisional sizing |
| [experimental-recordings.ts](../lib/settle/experimental-recordings.ts), [replay.ts](../lib/settle/replay.ts) | Causal fixture events and separate observed source clock |
| [google-reference.tsx](../components/settle/google-reference.tsx), [frame audit](google-diffusion-reference-audit-2026-09-09.md) | Three original user-supplied frames, selection controls, observations and provenance limits |
| [snapshot-study.ts](../lib/settle/snapshot-study.ts), [snapshot-study.tsx](../components/settle/snapshot-study.tsx) | Separate authored revision exercise; provisional inspection beside a protected complete-answer view |
| [section-field.tsx](../components/sections/section-field.tsx) | Current explanation, evidence scope and recordings |

Keep the existing `ambient` file names to avoid changing unrelated architecture. The revision changes the waiting material, not the decoder or release policy.

## 4. Source commitments and visual readiness

The cells align to the answer container and type rhythm. Their individual widths and positions are authored independently of actual words. The composition accepts numeric `rowCount`, `lineHeightPx` and `barHeightPx` inputs from the estimate; its displayed amount can respond to current committed content or an available current snapshot’s coarse size. The composition itself receives no raw tokens, drafts, final answer, future word measurements or progress percentage. Only the sizing helper may inspect the current candidate in snapshot mode.

Before source finality, do not read a hidden final answer or measure its eventual DOM. After finality, actual text is no longer future information and can be measured for the final fit. Distinguish these two stages explicitly; prohibiting all post-finality measurement would also prohibit the intended handoff.

An application-owned form or a decoder-enforced schema can establish structure in advance. A prompt asking for three bullets does not guarantee three items, their lengths or independent finality. A future structured variant needs stable region identifiers and source-backed finality per region. That variant is not implemented here. For right-to-left content, validate anchoring to the reading start instead of reusing this English left margin mechanically.

Only source finality can release the completed answer: a committed end reached by the contiguous prefix, a valid explicit finish, or an explicitly final snapshot. A guessed end, punctuation, high probability, stop, error or animation endpoint cannot complete it. Keep the exact final output, including poor model text and whitespace. Empty, interrupted, failed and revisable outputs retain their existing labeled behavior.

The 950 ms composition entrance is decorative and interruptible. Interior pills appear and disappear during waiting; a necessary final size fit can retain the skeleton after source completion. The skeleton disappears at visual readiness without waiting for a loop or a delayed exit fade. That fitting interval is an explicit presentation cost. The separate outline acknowledges completion without asserting that the answer is correct.

## 5. Rationale and limits

[Fluent skeleton guidance](https://fluent2.microsoft.design/components/web/react/core/skeleton/usage) supports coordinated motion and only high-level structure for variable content. The anchored margin and reserved slots are design applications of that guidance. They do not establish improved reading or justify exact line prediction.

[Apple’s Liquid Glass presentation](https://developer.apple.com/videos/play/wwdc2025/219/) describes fluid form and a material for navigation and controls above content. This prototype borrows a restrained settling character while keeping opaque content placeholders; it does not recreate the material. [Apple’s spring guidance](https://developer.apple.com/videos/play/wwdc2023/10158/) motivates continuity and tuning bounce to context, not these exact CSS values. Fixed keyframes are an approximation, not a velocity-preserving physical spring.

After the division introduction, steady full rows and fixed row ends provide spatial references. A small local lift of 0.035 em gives moving pills a floating character, while the appearing pill briefly expands to scaleY 1.08. The whole paragraph does not float. The envelope can grow, and rows may be removed when a new size context permits a smaller estimate; this is separate from internal pill formation. This is a testable compromise with the requested organic feel. The exact overshoot, timing and amplitudes are authored choices; none has been shown to improve comfort, trust, comprehension or dopamine.

The adaptive envelope and final size/answer handoff apply across the three conditions. Reshape adds the division entrance, interior pill appearance, neighbor redistribution, local settling and glimmer together. It also changes initial presentation, visible area, ink and pill presence. Comparing reshape with breathe evaluates this combined treatment, not an isolated contour or common-fate effect. Prior art and the small null-result skeleton study remain documented in the [historical skeleton research](skeleton-motion-study-2026-09-09.md). The previous v2, v3 and v4 iterations were not shipped. V4 local checks do not validate v5.

The [Google frame reference](google-diffusion-reference-audit-2026-09-09.md) shows distributed revisions but does not expose an API or guarantee early final layout. The adjacent snapshot example has an authored 4.2-second clock: a complete-looking candidate at 2.9 seconds remains nonfinal until the explicit event at 4.2 seconds. Its timing and words are an implementation exercise, not a Google replay or benchmark. The separate DiffusionGemma documentation describes block-local parallel refinement with sequential finalized blocks; do not assign its architecture to Gemini Diffusion or promise whole-document simultaneous generation.

The division metaphor and word-like shapes create an interpretation risk: readers may infer model stages, actual words, final line counts or generation progress. Ask about those expectations before explaining the loading state. Authored motion cannot certify the model’s internal progress or the eventual answer’s quality.

## 6. Lifecycle and accessibility

Pause existing animations rather than removing and recreating them. Preserve node identity and phase when playback is paused, the component goes offscreen, manual motion is disabled or reduced motion applies. A new replay intentionally resets the composition. Do not restart motion for every source event. A broad inherited `animation: none` rule must exempt the field, division parent/cells, bar, presence and ink/glimmer animations; their own controls pause those instances.

Reduced motion and manual motion-off pause decorative loops at their current phase, including division. New-row opacity transitions snap to their current shown/hidden state when paused, offscreen or motion-off instead of continuing a fade. With reduced motion active initially, reshape holds one joined capsule during waiting.

At source finality, reduced motion, motion-off, pause or hidden state skips the final fit and text motion, uses exact height and consumes the arrival cue without deferral. Returning to the page or reenabling motion must not replay it. When motion is enabled, a needed fit precedes visual readiness; the entire answer then translates together briefly at full contrast. Letters never blur, scale or stagger. The hidden division DOM is removed with the waiting composition at visual readiness.

Desktop conditions share source timing, but independent visibility observers can alter decorative exposure after scrolling. This gallery is not a controlled participant-exposure tool. Narrow screens select one condition and replay the same source. Preserve the shared polite announcement, named answer regions, selectable text and controls above growing content. System reduced motion and explicit pause/off controls complement automated accessibility checks; assistive-technology sessions remain necessary.

## 7. Verification status and gates

Fresh v5 checks passed: 347 unit/component cases across 42 files, 54 production-browser checks across Chromium, WebKit and iPhone 14 emulation, and 44 standalone measurement/archive guards. Final lint, both production builds with final public copy, TypeScript checking and locally served Pages-export verification passed; independent review reported no important issues. Eight [instrumented observations](anchored-skeleton-motion-validation-2026-09-09.json), their raw recordings and two [separate passive presentation captures](anchored-skeleton-showcase-capture-2026-09-09.json) are archived. The [release record](anchored-skeleton-release-verification-2026-09-09.md) keeps these completed local gates separate from commit-specific publication evidence and documents the two media-request cancellations alongside successful decode/hash checks.

The eight observations preserve exact output with no sampled pre-final protected text. They show the intended approximately 1.7 px arrival range, followed by zero displacement over 7,330 matched post-settle word-first-glyph samples. The longer case grows from five to ten waiting rows and then shrinks to its smaller final page. All eight reveal in the same sampled frame as source completion; none exercises a required hidden size fit. Do not present that result as a measured 180 ms fitting bound or zero product latency.

Three separate [underallocation stress trials](anchored-skeleton-fit-stress-2026-09-09.json) force the sky-blue fixture’s final event immediately after a fresh five-row allocation. The same cells remain while the entire text is hidden during fitting. Observed source-complete-to-full-visibility delays are **200.1 ms Chromium, 204 ms WebKit and 195 ms iPhone 14 emulation**. Each then shows one 180 ms whole-answer settle and zero movement in 1,080 post-settle comparisons. These are artificial branch tests, one per profile, not model latency, a delay distribution or a physical-iPhone result. Preserve their scheduling cost; do not round it down to the authored 180 ms.

The dense harness reads geometry and styles for all 43 cells every sampled frame. Its loading rAF-gap p95 values span 150.9–216.7 ms even across the still and moving conditions, so these diagnostics cannot establish normal playback smoothness or a performance advantage. Preserve the diagnostic videos and raw logs. The separate passive presentation captures omit dense per-frame sampling and retain their own manifest. The evidence-page videos use `anchored-skeleton-showcase-mobile.webm` and `anchored-skeleton-showcase-long.webm`; the original `anchored-skeleton-mobile.webm` and `anchored-skeleton-long.webm` remain instrumented artifacts. Never substitute one type for the other. Browser recording itself still has overhead.

Do not copy the historical `a7606d9` totals of 327 unit/component cases, 45 browser checks or 9,648 final-word samples into a new result. The unpublished v4 checks also belong to that prior implementation. New observations must identify `adaptive-cell-skeleton-v5`, source/implementation/script fingerprints, viewport, clock and sampling method.

| Gate | Required evidence |
| --- | --- |
| Causality | Commit path reads current commitments only and excludes earliest EOS/later positions; snapshot path reads only its latest current candidate; candidates never become released words; future fields never read; 5–14 limits; exact final DOM measured only after finality |
| Sizing | Waiting maximum, width/font reset, interrupted 380 ms resize and actual line-height; final underallocation, surplus shrink, snapshot/cap cases and measured browser delay |
| Introduction | Joined capsule, bounded division and 950 ms field handoff; visual readiness can interrupt it |
| Margin | Row ends remain anchored while local pills redistribute; row positions follow actual type metrics and numeric allocation |
| Movement | Neighbor gaps, bounded appearance/overshoot, glimmer phase preserved across all mounted rows, and no invisible-row exposure outside the frame |
| Appearance | Crisp bodies without blur/feathering/shadow; division clip and faint gradient glimmer are intentional; document transient pill deformation |
| Final text | No pre-final text; one exact full visual answer; measure nominal-fit versus actual delay, initial 1.5/−0.2/0 px travel, and post-settle stability |
| Lifecycle | Fit interruption and new-run guards; pause/off/reduced/hidden bypass; no stale cue or repeated visual delay after resize |
| Snapshot compatibility | Candidate cleanup on final/stop/error/revision/reset; correct-looking nonfinal input stays withheld; final-only five-row fallback; authored example clearly separated from supplied Google images |
| Layout | Separate pre-final frame growth, residual final correction, per-frame height change and glyph motion before/after settling |
| Provenance | Fresh material-specific raw logs/videos; no reuse of v4 pass counts or old zero-motion metrics; no physical-device or reader-benefit inference |

Use the new measurement and archive scripts in `scripts/` and preserve their fingerprint checks. The division animates geometry and clipping; later local `left` and `width` movement also incurs layout and painting. Keep it bounded within the loading area, inspect its rendering cost, and do not claim compositor-only execution or low power use without device measurements. [Browser animation guidance](https://web.dev/articles/animations-guide).

Run verification sequentially when collecting timing-sensitive observations, against a fresh normal production build. A Pages export must then verify its base path, exact replay, current material and actual recording hashes. Source-policy reports need regeneration only if reducer or event logic changes.

## 8. Reader study and continuation

First compare reshape with breathe at identical source timing and shared final handover rules, recording actual visual arrival separately. Measure fluidity and distraction, perceived wait, expected word and line count, mistaken model-stage or completion estimates and repeat-exposure preference. Ask what the bars imply before explaining them. Include short and long answers, errors, refusals, poor text, reduced motion and assistive-technology sessions. Pilot, select one primary outcome and a smallest useful effect, then power and preregister the confirmatory study.

Compare earlier-word access against whole-answer release separately, using their real eligibility times. The unchanged source report finds a paired median 10.5-second additional first-passage wait over sentence release across 57 nonempty original traces. Attractive waiting is not enough if a correct answer becomes useful too late. Breathe or still can remain preferable; increased confidence in a wrong answer is not success.

Preserve the original typography, colors, page layout, source captures and release contract in future edits. Change one motion property at a time when exploring causes, record the actual result, and keep prior evidence attached to the material it measured. The complete source bundle and delivery handoff supply the full implementation for another AI; this document specifies what to preserve and why.

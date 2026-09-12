# After Tokens: responsive cells and a material handover

**Started 9 September 2026 · contract refresh 12 September 2026 · globalanomalyindex · material `responsive-cell-skeleton-v6`.**

This is the implementation and research handoff for my current web and motion design study. The website is the primary artifact. Assistant, search and phone-sized compositions show possible applications of the same material; they are browser prototypes, not production integrations or native iPhone implementations.

## The design decision

I kept the original case study’s editorial design and replaced the abrupt change from skeleton to answer with a material handover. The bubbles visible at release move and reshape toward the actual word groups while the text fades in. Only the new batch settles. Text already available for reading stays in place within the reading page; browser scrolling or movement of the page can still change its viewport position.

The waiting field also becomes less repetitive. Its local cells use independent, seeded rhythms and successive arrangements. Current content can guide approximate row lengths and the space around them. One occasional glimmer coordinates the otherwise local activity. This makes a concrete motion hypothesis possible: a continuous visual relationship between waiting and reading may feel more coherent than a cut. It may also be distracting or too slow. Browser correctness does not settle that question.

The contribution is this combination of source-limited geometry, local motion and a release-time material handover. Rounded skeletons, breathing, shimmer and animated transitions are existing techniques. I do not claim their invention, a proven reading benefit or a new decoder.

## What changed from v5

| Area | V5 | V6 |
| --- | --- | --- |
| Waiting shape | Repeated authored cluster arrangements; current content estimated outer height | Distinct seeded rows and successive local arrangements; current content can guide quantized row occupancy as well as height |
| Arrival | Complete ink appeared, then moved briefly | Visible bubbles reshape toward newly eligible word groups as ink fades in and settles over 280 ms |
| Earlier policies | Legacy forming/source-interval options remained | Word, sentence, paragraph and answer all use released passages and the same cell material |
| Existing text | Whole-answer emphasis | Only a newly released batch animates; earlier passages retain their nodes and do not replay |
| Comparison | Different wide/narrow presentation | One selected condition at every width; reshape is the default, still and breathe remain available |
| Brand controls | Several controls tied to older treatments | Palette and tempo; the text-handover duration stays fixed |
| Framing | Product concept prominent | Web and motion design primary; application sketches secondary |

The [v5 handoff](anchored-skeleton-handoff-2026-09-09.md), [research record](anchored-skeleton-research-2026-09-09.md), [measurement report](anchored-skeleton-motion-validation-2026-09-09.json) and [release record](anchored-skeleton-release-verification-2026-09-09.md) remain historical. They identify `adaptive-cell-skeleton-v5`, published at `06da788390549574949c7cdcd938c3669820f214`. Their counts, timings, hashes and clips do not validate v6.

## Source capability comes before shape

There are two distinct measurements during waiting. Total space and approximate row occupancy do not have identical information requirements.

The demonstration application loads complete recording fixtures to replay them. The causal boundary is inside that application: the replay clock delivers only events up to its current time, and the presentation helpers use the resulting current state rather than inspecting future fixture events, final-answer strings or retrospective word tables. “No future answer” describes that renderer access contract, not the absence of complete recordings from browser memory.

| Source | Total waiting space | Coarse row occupancy | Reading eligibility |
| --- | --- | --- | --- |
| Irreversible position events, as in the recorded Qwen adapter | Current committed non-end fragments before the earliest committed end can contribute; drafts, spins, future answers and the request bound do not | Only the contiguous prefix up to the first gap or end token contributes. Sparse later fragments cannot establish their eventual line positions | Committed pieces and policy boundaries; whole answer waits for authoritative finality |
| Genuinely received revisable snapshots | Latest current nonfinal candidate can contribute | The same current candidate can supply provisional advance budgets and explicit newlines | Only an explicitly final snapshot reaches the protected page |
| Final-only source | Neutral five-row prior | No intermediate lexical evidence; seeded authored widths | Actual final output must arrive before any word targets can be measured |

The snapshot candidate remains provisional and is cleared on final, stop, error, revision and reset. It does not become tokens, a committed prefix or released passages. The separately labeled evolving-draft inspector intentionally displays it for comparison; the protected reading page does not.

The [Google frame audit](google-diffusion-reference-audit-2026-09-09.md) documents my 45-frame archive. Distributed changes, changing text extent and a nearly complete-looking but inconsistent draft motivate protecting the reading surface. Those images do not establish an integration API, finality events, stable early formatting, elapsed generation time or a throughput benchmark. The [authored snapshot exercise](../lib/settle/snapshot-study.ts) uses invented events over 4.2 seconds to exercise the adapter; it is not a Google replay.

### Numeric approximation

The total-size helper uses current permitted text advances, available width and explicit newline count:

```ts
const estimatedRows = clamp(
  Math.ceil(1.1 * knownAdvance / availableWidth + 0.5 * knownNewlines) + 1,
  5,
  14,
)
```

This is a heuristic with slack, not a lower bound or an exact wrapping algorithm. The waiting maximum persists within the current sizing context. Width/font changes allow a new estimate. After earlier passages arrive, their actual height is accounted for and a compact remainder field can start from two rows. The field moves below released text with a small line-height-relative gap. The hook handles this lifecycle; do not apply the initial five-row formula independently on every render.

The row profile separately splits permitted current text at explicit newlines, measures each line’s advance, distributes long advances across the available width, and rounds each occupancy upward in 4% steps. It stops at fourteen rows. A blank known line keeps zero occupancy. A nonzero display budget has a 24% minimum footprint so that very short known fragments do not collapse the visible material into a dot. That minimum is authored loading geometry, not an estimate of source text; the raw quantized profile remains unchanged. This is still approximate: native word wrapping can disagree with advance budgeting, and future input can change a provisional snapshot’s shape.

Only after a passage has met its release policy can its real DOM geometry become a handover target. For whole-answer mode that means source finality; for earlier policies it means the relevant committed passage boundary. Do not unnecessarily wait for finality before measuring an already eligible sentence, and do not measure a future answer to improve the waiting skeleton.

## Motion contract

| Element | Authored behavior at neutral tempo | Meaning and limit |
| --- | --- | --- |
| Introduction | A joined capsule divides toward its initial five row-width budgets over 950 ms; widths are captured at mount | Visual metaphor; not five model stages. The persistent field beneath responds to current profiles and crossfades in over the last 200 ms. Source release can interrupt it |
| Row identities | Fourteen persistent seeded rows; rows 0 and 7 are single bars; others contain 3–6 cells | Distinct identities avoid a repeated five-row tile. Hidden identities stay mounted |
| Content response | Anchored left edge; current numeric occupancy changes the right edge; occupancy at least .94 uses a full bar | Coarse current shape, not exact future text |
| Local shape cycle | Independently phased 4–7 second cycles; each advances to a new seeded arrangement | Authored activity, not confidence, convergence or percentage complete |
| Geometry updates | Active clock sampled every 200 ms; CSS left, width, opacity and local translation ease for 500–700 ms | Position-continuous retargeting, not a physical spring or velocity-continuity guarantee; includes layout and paint work |
| Local breath | Independent 4.2–7 second periods and phases, row opacity .72–1 above cell opacity .2 | Chosen variation; whether it feels calmer or busier requires testing |
| Cell spacing | Positive widths and gaps normalized together; only interior cells can disappear | Neighboring shapes make room while the row retains its bounds |
| Local float | Bounded small cell translation, derived from presence and local cycle | The paragraph does not wobble; no meaning is assigned to individual motion |
| Shared glimmer | 8-second cycle; each cell sweeps locally from left to right at 16–26% of the cycle | A coordinated activity accent, not a single viewport-wide plane or a completion cue |
| Waiting growth | 380 ms frame adjustment from current visible height | Approximate space can grow before release; no guarantee that the final answer fits |
| Underallocation | When newly eligible text exceeds available height by more than 1 px, fit toward the latest target using a 180 ms deadline from the start of that fit | A retarget for the same batch does not restart the complete wait. A genuinely new batch owns a new deadline; browser scheduling can still extend observed elapsed time |
| Bubble-to-word handover | 280 ms; capture visible bubbles, translate/scale toward measured eligible groups, fade out. While the source is receiving, a batch borrows at most six nearby cells, up to two per group. A terminal batch uses all available visible cells | A correspondence built at release; no earlier bubble-to-word identity. A terminal handover fades a still-opening capsule in place; an earlier release leaves it in the continuing field |
| Text arrival | Opacity 0 → .45 at 38% → 1 at 74%; top 1.5 px → −.2 px at 74% → 0 at 100% | Full opacity at 207.2 ms nominal; settled at 280 ms. Maximum distance from rest 1.5 px; extrema span 1.7 px; total path 1.9 px |
| Existing passages | Native inline text; stable passage keys; no replay of the arrival | Ordinary viewport/font reflow can still move text. No claim of invariance under arbitrary layout changes |
| Brand controls | Five palettes; tempo .7–1.4 changes waiting rhythms | Intro and 280 ms handover do not become faster or slower with brand tempo |

No individual word or row receives a left-to-right onset delay. There is no blur, letter scrambling, weight pulse or separate completion outline in the current arrival. Ink is not at full contrast from its first visible frame: the fade is a deliberate tradeoff that must be reported, not concealed under “instant readability.”

Still removes decorative activity; Breathe adds local opacity cycles; Reshape adds division, local geometry changes and glimmer. Current source data can change approximate space in all three. All three retain the same release policy and bubble-to-word handover. This comparison tests a combined waiting treatment. To isolate the handover, add a separate matched comparison in which only that transition changes.

## Integration map

| File | Responsibility |
| --- | --- |
| [reader.ts](../lib/settle/reader.ts), [types.ts](../lib/settle/types.ts) | Source commitments, snapshot candidates, policies, finality and revisions |
| [answer-envelope.ts](../lib/settle/answer-envelope.ts) | Capability-specific total-size estimates from permitted current content |
| [ambient-geometry.ts](../lib/settle/ambient-geometry.ts) | Quantized row profile, deterministic row identities and successive cell arrangements |
| [ambient-composition.tsx](../components/settle/ambient-composition.tsx), [ambient CSS](../app/ambient-composition.css) | Persistent waiting field, active local clock, pauses, local breath and shared glimmer |
| [skeleton-division.tsx](../components/settle/skeleton-division.tsx) | Short capsule introduction toward initial numeric width budgets; the underlying field handles source-driven retargeting |
| [use-reading-surface.ts](../components/settle/use-reading-surface.ts) | Frame measurement, waiting remainder, optional fit and new-batch handover lifecycle |
| [bubble-transfer.tsx](../components/settle/bubble-transfer.tsx) | Capture visible bubble bounds and released word-group targets; render inert transfer cells |
| [settle-answer.tsx](../components/settle/settle-answer.tsx), [global CSS](../app/globals.css) | Released passage DOM, new-batch animation, status, revision review and motion preferences |
| [settle-stage.tsx](../components/settle/settle-stage.tsx), [ambient-study.tsx](../components/settle/ambient-study.tsx) | Shared policy controls, reshape default and single-condition comparisons |

The stage no longer exposes the legacy source-interval preview. Compatibility props may remain in types for older callers, but they do not select the earlier renderer. Avoid restoring a second arrival system merely because those names still exist.

### Minimal use

```tsx
import { SettleAnswer } from '@/components/settle/settle-answer'

<SettleAnswer
  state={readerState}
  runId={replayIdentity}
  ambient="reshape"
  motion={motionEnabled}
  paused={presentationPaused}
  label="answer"
/>
```

`readerState` must come from the source reducer, not from a fabricated completion timer. Change `runId` for a new source/replay. Keep it stable through ordinary events so waiting cells and readable passage identities persist.

The presentation lifecycle is:

```text
current source data → numeric waiting budgets → active cell field
releasedLength increases → measure eligible page and capture visible field
  insufficient room → fit (180 ms authored)
  enough room       → begin handover while frame adjusts
handover (280 ms authored) → new batch stationary
source still receiving → remainder field stays available
source terminal       → no unfinished content presented as complete
```

The transfer groups up to three adjacent words on the same visual row into each target. While the source is still receiving, a batch borrows at most six nearby cells, with up to two per target group, so the continuing field does not all travel toward a small addition. A terminal batch under any policy can use all available visible origins. It captures native range rectangles, including wrapped long words, with a bounded scan. Multiple bubbles may head toward one word group. This is a stylized material bridge, not a one-to-one lexical decoding animation. The actual text remains native selectable text in stable passage nodes. If a terminal handover interrupts the still-visible 950 ms introduction, preserve the exact clipped capsule and fade it in place while the text arrives; do not clone its partially clipped slabs into false standalone shapes. An earlier incremental release leaves that opening in the continuing field rather than cloning or fading it away. Source release never waits for the introduction to finish.

When another batch interrupts an arrival, the earlier batch becomes stationary and the next batch owns the new transition. The transfer layer owns the keyed 280 ms completion clock; passage animation events cannot finish a newer batch. A defensive timeout avoids stranding hidden content if the owning event is lost. That fallback is not a promised presentation latency. During a fit for the same batch, new targets use the remaining time before its existing deadline; a genuinely new batch can start its own fit. A viewport or font change must not replay old text.

If an earlier policy has already released every character before source finality arrives, finality creates a terminal field-fade handover without marking any old text as arriving. Its cells leave over the same 280 ms clock while the frame contracts; already visible words do not fade or move again. Presentation-ready status follows that fade even though text may already have been readable.

## Motion preferences and terminal states

Reduced motion, manual motion-off, presentation pause, an offscreen surface or a hidden document bypass the decorative fit and text-arrival motion. Eligible text becomes fully visible without waiting for those effects. The waiting activity clock pauses; in-flight geometry transitions require explicit pause handling because removing a transition can jump to its target. Source and decorative clocks are separate and are not guaranteed to stay synchronized under visibility changes.

Source complete, stopped, error, presentation paused and revision available remain distinct status words. The handover has its own “text received” fitting/settling descriptions. Those describe presentation after eligibility, not further model reasoning. An empty answer is stated explicitly. Whole-answer stop/error can expose a separately labeled incomplete committed prefix for inspection; it does not manufacture a successful answer.

A later revision keeps the current page and offers review/apply. The prior version remains available after applying. Motion must not conceal a text revision. Optional browser vibration occurs at the beginning of a handover where supported, including a terminal field fade with no new text; physical iPhone haptics are not implemented or validated by this web prototype.

## Research justification and limits

I use the literature to constrain the proposal and define tests, not to claim that a particular easing curve produces a psychological benefit.

| Evidence | Design use | What it does not establish |
| --- | --- | --- |
| [Live-caption stability research](https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/) | Keep already readable text stable; treat instability as a real risk | A benefit for diffusion, the 280 ms fade or the initial settling motion |
| [Apple: Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/) and [Animate with springs](https://developer.apple.com/videos/play/wwdc2023/10158/) | Preserve a visible relationship through change and account for interruption | A prescription for these durations, a physical spring in this implementation or a reader outcome |
| [Animated transitions, Heer and Robertson](https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf) | A reason to test whether material correspondence helps people follow a change; keep staging simple | Proof that chart-transition results transfer to words |
| [Common fate, Chalbi et al.](https://arxiv.org/html/1908.00661) | One shared glimmer can coordinate locally varying rows | A guarantee that independent rhythms are comfortable or that synchrony improves reading |
| [Skeleton comparison, Mejtoft et al.](https://doi.org/10.1145/3232078.3232086) | Treat skeleton familiarity as prior art and measure what readers infer | Skeleton superiority: the small study found no significant benefit on its measured outcomes |
| [Progress-bar appearance, Harrison et al.](https://www.chrisharrison.net/projects/progressbars2/ProgressBarsHarrison.pdf) | Keep perceived duration distinct from elapsed time | A transferable effect size, a completion estimate or permission to fabricate progress |
| [Fluent skeleton guidance](https://fluent2.microsoft.design/components/web/react/core/skeleton/usage) | Coordinated loading activity is established practice; compare this local variation against it | Validation of a more asynchronous field; busyness is a specific risk to test |

The source review remains explicit about diffusion. [Gemini Diffusion’s overview](https://deepmind.google/models/gemini-diffusion/) describes iterative block refinement, but does not document the event interface used here. [DiffusionGemma’s separate explanation](https://ai.google.dev/gemma/docs/diffusiongemma/explained) describes revisable 256-token canvases and sequential finalized blocks; that architecture is not attributed to Gemini Diffusion. The repository’s real Qwen captures and authored snapshot exercise demonstrate the particular adapter capabilities they actually contain.

The case study does not use Zeigarnik as a universal memory law, Gestalt closure as evidence for linguistic completion, or peak-end theory as a reason to add a dramatic finish. It claims no dopamine mechanism. Smoother wrong answers may be easier to trust; false-answer acceptance is therefore a guardrail, not an acceptable side effect.

## Validation and reader study

Implementation checks and reader outcomes must remain separate. Fresh v6 results belong to this material and its new passage, geometry and handover contracts. Existing v5 measurements are historical evidence about v5 alone.

Required implementation gates:

1. Exact final text under every policy, including whitespace; no released text before source eligibility and no future-answer access.
2. Committed gaps cannot create row coordinates; snapshots remain provisional; final-only input uses the neutral fallback.
3. Row left edges, nonnegative widths and nonoverlapping neighbors hold across seeded cycles, source changes and narrow viewports.
4. Actual visible bubble capture hands over to eligible targets; the introduction and empty-origin fallback cannot strand text.
5. Only new batches animate. Old readable text does not replay or jitter when more content arrives; interruption and rapid releases are covered.
6. Measure source eligibility, first ink, full opacity and rest separately, including forced underallocation. Report observed scheduling overhead rather than calling nominal durations hard bounds.
7. Pause, resume, replay, motion-off, reduced motion, offscreen/hidden states, stop/error and revision review remain coherent.
8. Reshape is the initial choice at every width and in every live example. Earlier policies no longer expose the legacy renderer; palette and tempo affect visible material.
9. Production builds, static Pages assets, keyboard/axe checks, browser profiles and responsive visual review pass. Emulation remains distinct from physical-device validation.

The proposed reader study holds source timing, answer content and release policy constant across still, breathe and reshape. It tests fluidity, distraction, activity understanding and mistaken progress estimates. A separate handover comparison isolates the 280 ms transition from the waiting material. A separate availability comparison uses each policy’s real release time; it must account for the substantial earlier-reading advantage instead of presenting waiting as free.

Secondary outcomes include comfort, perceived wait, comprehension, satisfaction and repeated-exposure preference. Include poor outputs and measure mistaken trust. Ask what the shapes mean before explaining them. Pilot the task, define a smallest useful effect and power a confirmatory sample; no participant count or result is invented here. Physical mobile devices, reduced motion and assistive technology need their own sessions.

## Verification status

This document records the implemented v6 contract and the gates for evaluating it. The [12 September release-verification record](responsive-skeleton-v6-release-verification-2026-09-12.md) records current local checks and [eight fresh v6 browser observations](responsive-skeleton-motion-validation-2026-09-12.json) alongside [69 passing browser checks](responsive-skeleton-browser-validation-2026-09-12.json) and [fresh passive captures](responsive-skeleton-showcase-capture-2026-09-12.json), rather than importing v5 results. Commit-specific hosting and live evidence belongs to the delivery report produced after publication. No reader study has been run. A successful build or stable glyph test establishes implementation behavior, not perceived smoothness, comfort, comprehension or novelty priority.

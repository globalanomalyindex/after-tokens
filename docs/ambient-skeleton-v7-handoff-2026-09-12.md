# After Tokens: an ambient score, then readable text

**12 September 2026 · globalanomalyindex · material `ambient-cell-skeleton-v7`.**

My current direction is a calm web motion study: five text-like rows breathe, a small group occasionally changes, and the composition rests before the next episode. The waiting animation follows its own score instead of reacting to the draft. When text is eligible to appear, the existing bubble-to-word handover carries the visible material into real word groups.

The original editorial design remains. The website is the primary artifact; assistant, search and phone-sized compositions are secondary applications. This is a working browser prototype and a testable design proposal, with no reader-benefit or native iPhone claim.

## Why I changed the waiting motion

V6 made the skeleton respond to approximate current text geometry. That was a defensible experiment, but responsiveness also meant continual adjustments. The new direction favors a quiet composition whose changes have a beginning, an end and space between them. Variety comes from a seeded sequence of local events rather than from every draft update.

This makes the waiting animation simpler to integrate. It does not need a model to reveal draft words, token positions or preliminary formatting. It still needs honest lifecycle signals: waiting, text eligible to show, source complete, stopped, error and revision. A pleasing animation cannot infer those states or solve every model’s integration contract.

The tradeoff is visible space. Five authored rows do not forecast the answer’s length. A long answer may need the existing size fit when it is released. Fresh v7 observations measured that cost: the narrow sky-blue case reached near-full opacity at 400 ms and settled/unoccluded readiness at 500 ms after sampled source completion. V6’s successful anticipation of some long answers is not claimed here.

## What the composition means

| Moment | Presentation | Meaning |
| --- | --- | --- |
| Waiting begins | One capsule opens into five authored rows | An answer is being prepared; the rows are not its known structure |
| An episode | One row divides, gathers or redistributes a small group of cells | Local decorative variation, not a token becoming certain |
| A rest | Geometry holds while the soft ambient state remains | Deliberate quiet in the motion score, not a stalled model |
| Eligible text arrives | Optional size fit, then bubbles carry into measured word groups | This text is now allowed onto the reading surface |
| Earlier text is already visible | A compact two-row remainder sits below it | The remaining wait, without replaying old text |
| Source ends | Remaining material leaves; terminal status is explicit | Source completion, distinct from finishing a decorative cycle |

No bubble identifies a word during waiting. Its width, place and episode do not encode confidence, progress, remaining time or decoder stages. The composition is source-independent in that specific sense: its waiting geometry does not consume current drafts or committed fragments. Its lifecycle can still respond to release, pause, completion and the surrounding container.

## Waiting architecture

The waiting score takes an active decorative clock, a stable run seed and container/type metrics. Before any text is released, it reserves five authored rows. After earlier passages are released, a two-row remainder can sit below their measured page height. Received but unreleased text does not change the waiting widths or frame height.

Use stable row/cell identities. At a fixed tempo, an episode affects one local row while the other row geometries hold. Split, gather and rebalance events should vary across the seeded sequence, with deliberate quiet intervals between them. Retarget from the currently displayed geometry and preserve bounds; do not restart a global loop on every source event. This is authored CSS/easing choreography, not a physical spring or a visualization of model computation.

The short division introduction retains its initial width endpoints, preventing source or rerender changes from rewriting a keyframe mid-flight. The persistent field beneath owns the continuing score. All conditions use the same source events and release policy. Still removes decorative activity; Breathe keeps the soft ambient pulse; Reshape adds the opening and local episodes. Reshape remains the initial choice at every viewport width and in every live example.

The score’s current authored parameters are:

| Parameter | Value at neutral tempo | Scope |
| --- | --- | --- |
| Persistent shapes | Five rows, 25 cell identities | Row 0 is one quiet bar; four other rows each retain six cell slots |
| Row extents | Seeded within 86–92%, 80–86%, 89–95%, 76–82%, 62–68% | Fixed for the run; a text-like composition, not known line lengths |
| Visible cells per active row | Four, five or six, seeded independently for each episode rather than cycled through a fixed three-step pattern | The change in count labels a divide/gather; an unchanged count can rebalance. Interior slots fade/shrink while row ends remain fixed |
| Score round | 10.8 seconds | Each of the four active rows receives one cue in a newly seeded order |
| First cue | 1,250–1,550 ms | Leaves space for the opening to finish |
| Cue spacing within a round | 2,200–2,800 ms | Prevents an uninterrupted chain of shape movement |
| Spacing between rounds | 3,000–3,600 ms | A longer quiet gap |
| Local gesture | 900–1,300 ms, eased CSS left/width/opacity changes | Then geometry holds; no per-frame target retargeting |
| Active-clock tick | 100 ms | Checks whether a cue has been reached; unchanged cues do not rewrite CSS targets |
| Breathing | 5,200–7,800 ms per row, with seeded phase | Continues through geometric rests |
| Shared glimmer | Eight-second cycle | A brief coordinated accent, independent of source progress |
| Introduction | 950 ms | Initial width endpoints remain fixed; the continuing field crossfades in over the last 200 ms |
| Brand tempo | .7–1.4 | Changes future clock accumulation instead of rescaling elapsed time; ambient durations respond while the retained fit and text-handover duration stay separate |

An ordinary within-round interval therefore leaves roughly 900–1,900 ms after the authored gesture, and the between-round interval about 1,700–2,700 ms. These are mathematical score bounds at a fixed tempo, not observed browser rest measurements: tick quantization, pause and scheduling matter. A live tempo change can alter an in-flight CSS duration; the one-row-at-a-time timing claim describes the ordinary fixed-tempo score. Breathing and glimmer can continue during a geometric rest. Order, cell count and proportions vary across rounds; the design does not claim an infinitely nonrepeating sequence.

Introduction, breathing, episode, rest and glimmer durations are authored choices, not psychological constants. The independent score must be tested for excessive busyness, repetition and apparent inactivity.

## The retained handover

The release contract remains separate from waiting choreography. The renderer measures actual word groups only after that text meets its policy. For the default whole-answer policy this requires authoritative source finality; earlier word, sentence and paragraph policies can release eligible passages sooner.

The app loads complete recording fixtures to replay them. The causal boundary is inside the app: only events at or before the replay clock reach the reducer, and the presentation helpers consume the resulting current state. “No future answer” describes helper access, not the absence of complete fixtures from browser memory.

| Part | Authored behavior |
| --- | --- |
| Fit if underallocated | If newly eligible text exceeds the available height by more than 1 px, fit toward its actual measured page height using a 180 ms deadline |
| Same-batch retargeting | Use the remaining time before the existing fit deadline; a genuinely new batch can own a new deadline |
| Bubble transfer | 280 ms; capture visible cells, move/scale toward eligible word groups, fade out |
| Text arrival | Opacity 0 → .45 at 38% → 1 at 74%; top 1.5 px → −.2 px at 74% → 0 at the end |
| Full-opacity keyframe | 207.2 ms nominal; this differs from first ink and from settled/unoccluded access |
| While still receiving | Borrow at most six nearby cells, with up to two per target word group; the remaining field continues |
| Terminal batch | May use all available visible origins, regardless of release policy |
| Terminal arrival during the introduction | Fade the exact clipped opening layer in place; do not clone its clipped slabs or wait for the introduction to finish |
| Earlier release during the introduction | Leave the opening in the continuing field while eligible text arrives |
| Late finality with no new characters | Fade the remaining field without marking old passages as arriving |
| Existing readable text | Keep its passage nodes and avoid replaying its arrival; positions are stable within the reading page, not invariant to page scrolling or viewport reflow |

The word targets group up to three neighboring words on the same visual row. Native range rectangles handle wrapping; the scan is bounded. This is a stylized material correspondence after release, not one bubble faithfully turning into the token it represented all along.

Only the new batch receives the opacity ramp and small settling motion. There is no per-word left-to-right stagger, blur, scrambling, weight pulse or separate completion outline. The visible opacity ramp is a real presentation cost: do not call the answer instantly full-contrast. Browser scheduling can extend nominal durations, so source eligibility, first ink, near-full opacity and complete rest need distinct measurements.

The transfer layer owns the keyed completion clock. An older passage animation event cannot finish a newer batch. A defensive timeout prevents hidden text from becoming stranded if the browser loses the owning event; it is not a latency guarantee. An interrupted earlier batch becomes stationary rather than fading again.

## Integration map

| File | Responsibility |
| --- | --- |
| [ambient-score.ts](../lib/settle/ambient-score.ts) | Independent seeded waiting score, row/cell geometry and episode/rest decisions |
| [ambient-composition.tsx](../components/settle/ambient-composition.tsx), [ambient CSS](../app/ambient-composition.css) | Persistent waiting field, active decorative clock and motion preferences |
| [skeleton-division.tsx](../components/settle/skeleton-division.tsx) | Initial capsule choreography with stable endpoints |
| [use-reading-surface.ts](../components/settle/use-reading-surface.ts) | Five-row waiting allocation, two-row remainder, actual released-page measurement, fit and new-batch lifecycle |
| [bubble-transfer.tsx](../components/settle/bubble-transfer.tsx) | Capture visible origins and eligible word targets; own the transfer completion clock |
| [settle-answer.tsx](../components/settle/settle-answer.tsx), [global CSS](../app/globals.css) | Released passage DOM, status, motion preference handling and revision review |
| [reader.ts](../lib/settle/reader.ts), [types.ts](../lib/settle/types.ts) | Eligibility, source finality, stop/error and revision semantics |
| [settle-stage.tsx](../components/settle/settle-stage.tsx), [ambient-study.tsx](../components/settle/ambient-study.tsx) | Shared policy controls, reshape default and single-condition comparison |

The earlier numeric source-profile/envelope helpers can remain historical or compatibility code, but the live waiting path must not call them to choose widths or height. The absence of draft dependence is an acceptance condition, not merely a copy change.

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

`readerState` comes from the source reducer. Keep `runId` stable through ordinary events; change it for a new source or explicit replay. Do not manufacture a completion event from elapsed decorative time.

```text
waiting begins → five-row ambient score
  active time advances → local episode → deliberate rest → next episode
  draft changes        → no waiting-geometry change
eligible text arrives → measure that text → optional fit → 280 ms handover
  source continues    → two-row remainder below readable text
  source finishes     → remaining field leaves; old text does not replay
```

## Source and access rules

An irreversible-position source must keep its commitment promise. A revisable source uses snapshots; only an explicitly final snapshot reaches the protected page. A complete-looking or repeated candidate is not finality. The separately labeled evolving-draft inspector may show provisional content for comparison, but it does not drive the waiting composition.

Stop, error and empty output remain distinct from success. A later revision preserves the old page and offers review/apply, with the previous version retained. Whole-answer failure can expose a separately labeled incomplete committed prefix for inspection; motion must not celebrate it as a finished answer.

Reduced motion, manual motion-off, presentation pause and hidden/offscreen states bypass decorative fitting and text arrival while preserving source eligibility. The ambient activity clock pauses according to presentation state. Replay pause is a pause of the recording, not a claim to pause a live model. Optional browser vibration can acknowledge the beginning of a handover, including a terminal field fade without new text; physical iPhone haptics are not established by this web prototype.

## Research rationale

I use research to identify risks and design tests, not to certify a particular duration or a dopamine response.

| Evidence | Reason for using it | Limit |
| --- | --- | --- |
| [Live-caption stability research](https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/) | Keep previously readable text stable and distinguish reading from provisional activity | Does not validate this waiting score or its arrival motion |
| [Apple: Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/) and [Animate with springs](https://developer.apple.com/videos/play/wwdc2023/10158/) | Preserve continuity, use restraint and account for interruption | This CSS treatment is not a physical spring or Apple's glass material; the guidance supplies no optimum timing for these cells |
| [Heer and Robertson, animated transitions](https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf) | Test whether simple material correspondence helps people follow the shift into text | Chart-transition findings do not prove a text-reading benefit |
| [Chalbi et al., common fate](https://arxiv.org/html/1908.00661) | Use a shared ambient accent to give a locally changing field some coordination | Does not prove that local episodes plus rests feel calm |
| [Bartram et al., motion in the periphery](https://scholars.unh.edu/ccom/979/) | Treat persistent motion and travel as possible distractions; keep activity bounded and compare against stillness | Does not validate these pauses, episode lengths or this loading context |
| [Mejtoft et al., skeleton comparison](https://doi.org/10.1145/3232078.3232086) | Treat skeleton loading as prior art, not an automatic benefit | The small study found no significant superiority on its measured outcomes |
| [Fluent skeleton guidance](https://fluent2.microsoft.design/components/web/react/core/skeleton/usage) | Preserve familiar loading material and be cautious about the structure it appears to promise | Practitioner guidance is not a controlled evaluation of an unknown generated answer |

The move to deliberate rests is a design hypothesis. A rest can reduce how continuously the geometry competes for attention, but can also make the interface look stalled. Variety can make repetition less obvious, but can distract. Neither outcome is resolved by invoking a named psychological effect.

The [Google frame audit](google-diffusion-reference-audit-2026-09-09.md) shows why unstable draft words need care, not why a skeleton should mirror their positions. My archived frames provide no API contract or inference clock. [Gemini Diffusion's overview](https://deepmind.google/models/gemini-diffusion/) describes iterative block refinement; [DiffusionGemma's separate explanation](https://ai.google.dev/gemma/docs/diffusiongemma/explained) describes its own 256-token canvases. The architectures and integration capabilities are not conflated.

This waiting score can also serve other text-generation systems. Its diffusion relevance comes from applying it to real recorded nonsequential sources, preserving their exact output and explaining the cost of withholding earlier usable text. It does not claim to visualize diffusion more accurately than the source itself.

## Validation and reader study

The v7 acceptance conditions are:

1. Identical active time, seed and viewport produce identical waiting geometry despite different unreleased drafts or committed fragments.
2. The waiting allocation stays at five rows; the remainder after earlier release is two rows. Actual released text alone can change the reading-page allocation.
3. Local episodes have genuine rests, preserve left anchors and bounds, and do not turn into simultaneous perpetual reshaping of the whole field.
4. Exact final output, no premature protected text and all source terminal/revision rules remain intact.
5. The retained fit/transfer/intro interruption works with the now fixed waiting allocation; natural underfit cases receive fresh timing measurements.
6. Earlier readable text is not reanimated; local page-relative geometry and absolute viewport movement are reported separately.
7. All live examples default to reshape; still and breathe remain available; reduced motion, pause, offscreen/hidden states and replay remain coherent.
8. Production, Pages, accessibility, browser profiles and passive media are verified against the v7 implementation fingerprint.

The reader comparison holds source, answer, policy and handover constant while varying still, breathe and the new episodic score. Outcomes include fluidity, distraction, perceived inactivity, understanding of what the shapes mean and mistaken progress estimates. Compare the handover separately to isolate it. Compare earlier-reading policies separately at their real eligibility times; whole-answer waiting is not free.

Include poor answers and measure mistaken trust. Pilot the task, define a smallest useful effect and power a confirmatory study. No participant count or benefit is invented here. Physical devices and assistive technology need their own sessions.

## Evidence identity

The frozen runtime has passed 368 unit/component tests across 44 files, 48 adversarial harness guards, lint and the normal production build including TypeScript. The 69 browser checks also passed across Chromium, WebKit and iPhone 14 emulation in 7.1 minutes, with zero failures or retries. Eight fresh motion observations and two passive browser recordings are now archived as separate evidence. The [v7 release record](ambient-skeleton-v7-release-verification-2026-09-12.md) identifies current checks and their status. The observations distinguish source eligibility, first ink, near-full opacity and settled/unoccluded access, especially because five fixed rows can underallocate a long answer.

Current [v7 motion observations](ambient-skeleton-v7-motion-validation-2026-09-12.json) retained five rows and zero waiting-frame growth, exact text and no early protected answer. The four Reshape observations sampled three or four episodes each, with 173–213 post-episode geometric rest samples and zero cell drift during those rests. They do not cover a complete 10.8-second round or prove unlimited variety.

Seven natural cases reached near-full opacity in 199.9–250 ms and settled/unoccluded readiness in 299.9–350 ms after sampled source completion. The narrow sky-blue case required 12 fitting frames, reaching those states at 400 and 500 ms respectively. All eight measured zero rested glyph displacement. The [browser report](ambient-skeleton-v7-browser-validation-2026-09-12.json) separately records three authored 240 px fit tests and two-batch earlier-reading observations; these are not model latency or a physical-device study. The [passive capture manifest](ambient-skeleton-v7-showcase-capture-2026-09-12.json) distinguishes presentation videos and separate screenshot posters from instrumented measurements.

Published v6 is `ca43a251bd095f37dad35163ccc1aad682d06371`, material `responsive-cell-skeleton-v6`. Its 363 tests, 69 browser checks, 39 guards, eight observations and passive captures remain historical. V5 and earlier artifacts likewise retain their original identities. No old result becomes v7 evidence merely because the final handover is shared.

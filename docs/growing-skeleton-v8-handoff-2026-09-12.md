# After Tokens — fuller bars, room to grow

12 September 2026 · current direction v8 · material `growing-cell-skeleton-v8` · Christopher Robin Fiore · GitHub: `globalanomalyindex`

I restore the fuller silhouette of the earlier skeleton: long, rounded bars interspersed with a few larger cells. The waiting area can reserve more room as currently received content accumulates. Its individual shapes keep an authored rhythm, rather than tracking every change in a provisional sentence. Eligible text still arrives through the retained material handover.

This is an implementation and research handoff, with high-level design decisions and their limits. The frozen v8 baseline at `bd5cf9f0955fbd7ebdec8c89435ed5ac9af20243` has evidence including 383 unit/component tests, 72 browser checks, 35 current observer guards, four focused motion observations and two new passive recordings with separate screenshot posters. The [release record](growing-skeleton-v8-release-verification-2026-09-12.md) retains that baseline’s verification status. The subsequent [sentence continuity correction](sentence-continuity-fix-2026-09-12.md) retains its initial focused checks. The [integrated verification record](cinematic-showcase-verification-2026-09-12.md) covers that correction together with the fullscreen opening and upfront live gallery: 394 unit/component tests, 96 browser checks, 166 instrument guards, lint and the normal production build passed. The older measurements and media do not validate these subsequent changes. Historical v7 recordings and measurements remain separately labeled.

## The design decision

I separate three things that the previous versions had coupled too tightly:

1. **The amount of room.** A coarse estimate of content already received can reserve outer height. It starts at five rows, grows at most to fourteen and keeps its largest estimate while waiting at the same typography and width.
2. **The waiting material.** Authored long bars and two-to-three-cell groups breathe and redistribute their space. Their widths have no word identity, confidence value or model-stage meaning.
3. **The reading surface.** Once a passage meets its source and release contract, the browser can measure the actual words and carry the visible material into them. Earlier readable text does not repeat that arrival.

The opening cinematic scene is an authored introduction to this design idea. Four prewritten sentences arrive through the shared sentence-release renderer. The scene begins fullscreen and contracts into its place in the page, then the live comparison comes before the research explanation. It is not a diffusion recording, API trace, latency test or demonstration of model quality. Real source replays, the explicitly authored snapshot exercise and inspected Google reference frames keep their separate provenance.

The fullscreen treatment is introductory choreography, not part of the reader’s inference protocol. Its source events are authored immutable sentence commitments; they are not invented observations of a model becoming certain. The answer is:

> It should feel like a thought taking shape.
>
> Complete sentences find their place while the rest keeps breathing.
>
> Each arrival has a little weight, then settles into something you can read.
>
> Welcome to After Tokens, a motion study of how generated words arrive.

| Authored opening event | Nominal clock or duration |
| --- | ---: |
| Prompt finishes | 2,652 ms |
| Reply opens after the prompt hold | 3,052 ms |
| Four sentence commitments | 4,952 / 6,202 / 7,552 / 8,902 ms |
| Explicit source finality | Committed EOS with the fourth sentence at 8,902 ms |
| Shared handover for each eligible sentence | 280 ms, after any required fit |
| Hold after final text readiness | 750 ms |
| Fullscreen rectangle contracts into the page | 760 ms |

These are authored parameters, not measured model latency or guaranteed browser wall-clock times. The same stage remains mounted while its actual outer rectangle contracts into a reserved slot. Its conversation column keeps the same width through that move, so the docking motion does not deliberately rewrap the words. Page scrolling remains locked until docking completes. Skip or Escape exits immediately to the complete static exchange. Focus stays within the fullscreen scene and background content is inert; prior scroll and background state are restored on exit.

Fullscreen runs on the first ordinary visit in a session. A prior-seen session, URL hash, restored scroll beyond 80 px or reduced-motion preference bypasses it. Replay stays embedded. Manual pause and a hidden document pause its source clock; the embedded replay also pauses offscreen. The accessible transcript and static exchange preserve the same content without requiring motion. This current four-sentence scene supersedes the older two-sentence opening in the frozen baseline, without changing that baseline’s evidence.

The upfront gallery puts the raw committed prefix and the composed reading surface on one replay clock. Its reply and 8.5-second event schedule are explicitly authored, with some later positions delivered before earlier gaps close. Reshape and each-sentence release are selected initially; whole-answer release is available, and the raw prefix remains visible with incomplete word tails marked. Wide layouts place the panels alongside each other; narrow layouts stack them. Pause/resume and replay control the shared clock, which pauses offscreen and when the document is hidden. This allows visitors to inspect the presentation and the earlier availability of ungrouped text together. It is an illustrative demonstration of the current renderer, not a model recording, controlled reader study or evidence that grouping makes an answer faster. Original model recordings remain available later in the case study.

Every preview starts with each sentence. Whole-answer release remains available as a comparison where policy controls are exposed. A revisable snapshot still cannot release a provisional sentence: it needs explicit finality. These defaults favor continuing reading while leaving its availability tradeoff inspectable.

## What changed, and why

V5 provided the useful visual reference: a fuller field that made room gradually. V6 connected individual row occupancy to current content and added more, smaller pills. V7 removed that dependency but left a fixed five-row allocation and an earlier-reading tail of only two rows. Its sequential score distributed changes across rows that were often hidden in the tail. That could make the visible remainder look static even though the clock continued.

I restore only coarse space reservation, with broader cells and independent row rhythms. Keeping at least four rows below released text leaves several visible activity regions. This is a design response to observed presentation behavior, not a measured reader preference or proof that four is optimal.

The other correction is temporal: capture actual on-screen cells before advancing the field below a new sentence. Moving the field first would create transfer origins that the reader had never seen. While the source continues, the remaining field refills alongside the transfer copies instead of waiting for their animation to finish. Terminal activity keeps the original fade behavior. At source finality, surplus activity fades; previously readable words do not celebrate again.

## Source capabilities and honesty

| Available source signal | Permitted waiting input | Reading consequence |
| --- | --- | --- |
| Irreversible committed positions | Currently committed non-EOS fragments before the earliest committed EOS; only their approximate total advance and newline count | A policy can release committed passages when its boundary rule is met |
| Revisable whole snapshots | The latest snapshot actually received, for a coarse height estimate only | Candidate words remain off the protected page until an explicitly final snapshot |
| A completed answer only | No provisional estimate; keep the initial five rows | A valid final snapshot releases the exact answer |
| An enforced app-owned structure | Only a separately documented guaranteed structure | This prototype does not infer such a guarantee from a prompt |

The complete trace fixture exists in the replay application, but presentation helpers receive only events delivered by the replay clock. Future `trace.answer`, unreceived steps, request bounds, positional drafts, confidence and punctuation are not finality signals. A separately labeled draft inspector may show provisional text for comparison; it does not make that text eligible in the protected reading surface.

The current estimate is approximate. Sparse commitments do not reveal where all missing words belong. A revised snapshot can shrink, lengthen or change formatting. The high-water rule intentionally avoids repeatedly shrinking the field for such revisions. This can leave excess room until the final fit. It cannot establish the final list count, paragraph layout or wrapping.

## Runtime contract

The authoritative implementation lives in the files below. Keep the reducer and presentation contracts separate when integrating this design elsewhere.

| File | Responsibility |
| --- | --- |
| `lib/settle/reader.ts`, `types.ts` | Source commitment, provisional snapshots, exact release, finality, stop/error/revision behavior |
| `lib/settle/answer-envelope.ts` | Pure coarse estimate using only current permitted source content |
| `lib/settle/growing-geometry.ts` | Fuller v8 row proportions, persistent cell counts and discrete independently seeded shape targets |
| `lib/settle/ambient-geometry.ts` | Shared row types and historical geometry helpers; its content-profile helper is not used to shape v8 bars |
| `components/settle/use-reading-surface.ts` | Coalesced height estimation, fit deadline, captured-before-advance sequencing and reading lifecycle |
| `components/settle/ambient-composition.tsx`, `app/ambient-composition.css` | Fourteen persistent authored rows, local breathing, shape interpolation and shared glimmer |
| `components/settle/bubble-transfer.tsx` | Actual visible-origin capture, eligible word rectangles and temporary transfer copies |
| `components/settle/settle-answer.tsx`, `app/globals.css` | Protected text nodes, arrival states, continuing field and terminal fade |
| `components/settle/skeleton-division.tsx`, `app/skeleton-division.css` | One-capsule opening for Reshape |
| `components/settle/hero-intro.tsx`, `hero-intro.module.css` | Separate authored cinematic introduction |
| `components/sections/section-showcase.tsx`, `section-showcase.module.css`, `lib/settle/showcase-replay.ts` | Upfront, shared-clock illustrative comparison with a permanently visible raw prefix |

### Height, not draft word shapes

At the page’s actual computed font and available width, the pure estimator follows this numerical rule:

```ts
// advance and newlines describe only content already received through
// a supported source capability. They do not describe the future answer.
const rows = Math.max(5, Math.min(14,
  Math.ceil(1.1 * knownAdvance / availableWidth + 0.5 * knownNewlines) + 1,
))

// Retained for a run at the same width and font. A typography or width
// change may re-estimate; a new run clears the old budget.
capacity = Math.max(capacity, rows)
const remainingRows = Math.max(
  releasedLength > 0 ? 4 : 5,
  Math.min(14, capacity - Math.ceil(releasedPageHeight / lineHeight)),
)
```

The concrete helper handles invalid geometry, source filtering and newline accounting. Reuse that helper rather than copying the illustrative formula without its guards. Active source-only estimation is coalesced into 600 ms samples. A newly released batch, finality, typography change or motion bypass is handled immediately. The container eases to a new waiting height over 380 ms, retargeting from its currently displayed size. Resizing a frame is layout work; this is not a compositor-only animation or a zero-layout-shift claim.

The row budget describes the remaining decorative field, not a global maximum for the reading page. Once a passage is visible, its measured height plus a small gap sits above at least four continuing rows. Revealed rows fade in; identities and glimmer clocks remain mounted. Exact final text can exceed the fourteen-row waiting budget and receives its actual measured space.

### The fuller field

At nominal tempo:

| Property | Authored value or rule |
| --- | --- |
| Mounted rows | 14; initial visible allocation 5 |
| Stable full rows | Indices 0 and 2 within each five-row group |
| Other row identities | 3 persistent cells; the interior one may disappear, leaving 2 visible cells |
| Full-row widths | Seeded approximately 89–98% of the available width |
| Other row widths | Approximately 82–95%, with shorter group-ending rows around 65–81% |
| Source-driven row widths | None |
| Shape cue interval | Independently seeded 4.2–6.6 seconds per row; successive targets, not a repeated pair of arrangements |
| Cue clock sampling | 200 ms active-clock tick; it does not retarget geometry between cues |
| CSS shape transition | Seeded 1,300–1,800 ms at nominal tempo, then unchanged targets until the next cue |
| Local holds | Each row holds after its transition completes; independent rows may move at overlapping times |
| Breath | Independently seeded 4.8–7.4 seconds, row opacity .72–1 over solid bodies at .2 opacity |
| Glimmer | Same normalized phase in every mounted cell; 8-second nominal period, visible crossing from 16–26% of the cycle |
| Opening capsule | 950 ms authored division, with formed field appearing near its end |

A target stays identical until the next cue, allowing CSS to finish a complete gesture instead of restarting its easing every 200 ms. The gaps and ink widths are normalized within each row budget. The first left edge remains anchored and the right edge stays within the row. Zero-width interior cells fade through the shared per-row transition; cells do not mount for each new word. Seeded variation is deterministic and bounded. I do not claim infinite uniqueness, a physical spring, guaranteed velocity continuity or a globally motionless rest interval. Breathing and glimmer may continue while local geometry holds.

Still and Breathe use the same source, release policy and coarse height rule as Reshape. Still holds the material; Breathe adds the pulse. Reshape combines division, independent cell motion and shared glimmer. That is a combined treatment: a comparison cannot assign an observed preference to one ingredient without a separate ablation.

### Arrival and sentence finality

1. Source events make a batch eligible. The reducer still owns that decision.
2. The protected page lays out the exact new batch, initially hidden for its measured fit and handover. No future or provisional lexical text enters that page.
3. If the actual released page is underallocated by more than one pixel, fit it over an authored 180 ms. Retargeting the same pending fit preserves its existing deadline.
4. Capture the actual visible cell rectangles and opacity, plus the new eligible word groups. A still-opening capsule remains its original clipped layer rather than becoming fabricated pill origins.
5. Only after capture, advance the remaining field below the new passage over its authored 380 ms change. When the source is still receiving, refill its borrowed cells over 160 ms concurrently with the 280 ms bridge. Cleanup removes the temporary refill flag without starting another 320 ms fade. Transfers that begin after source finality keep the originals hidden and do not start a refill. A refill that already began while receiving can finish within the terminal fade. This is the small post-baseline sentence continuity correction.
6. The handover lasts 280 ms. New text reaches nominal full opacity at 74% (207.2 ms), then finishes a small vertical settle at 280 ms. No letter stagger or blur is introduced; words in the batch share the arrival clock.
7. Continuing batches borrow a small nearby subset, at most six cells. A final batch with earlier readable text retains this limit. A first batch that is already the complete answer can use the visible field. Remaining terminal activity fades over the same 280 ms handover while the reserved frame height is held. Only after that fade and text settle may surplus height contract over 180 ms. If no new characters arrive at finality, only the field fades, followed by the same delayed contraction; all old text remains untouched.

These authored times are presentation parameters, not measured latency guarantees. A fitting interval can precede the handover; browser scheduling and observation cadence affect wall-clock measurements. Report source eligibility, first visible ink, near-full opacity, unobstructed text rest, later container rest and viewport movement separately. The visual-ready state means text has settled; it can precede the end of the subsequent container contraction. Final exact text is not synonymous with factual correctness.

Motion-off, reduced motion, pause, offscreen/hidden state, source error, stop and revision handling preserve the source contract while bypassing decorative delay. New runs and revisions cancel old callbacks. Resize and font changes must not replay existing words. Empty completion should produce neither invented text nor a completion flourish. CSS completion marks presentation state, never source finality.

## Research rationale

I refreshed the following primary guidance on 12 September 2026. It constrains the design without validating the outcome.

- **Skeletons and unknown structure.** Fluent recommends simple high-level placeholders and cautions against skeletons when structure is unknown. I test an explicit extension: familiar rows with a coarse, fallible capacity estimate, rather than a claim of final layout. [Fluent skeleton guidance](https://fluent2.microsoft.design/components/web/react/core/skeleton/usage).
- **Continuity and bounded completion.** Apple’s spring guidance describes continuity and context-sensitive bounce; it does not require every animation to bounce. I use restrained CSS continuity and a bounded text arrival. This implementation is not Apple’s physical spring model. [Animate with springs, WWDC 2023](https://developer.apple.com/videos/play/wwdc2023/10158/).
- **Space reservation and movement.** Reserving room can limit late layout changes, but unknown final size leaves a tradeoff. The coarse high-water estimate may reduce a final jump while producing earlier growth or excess space. I distinguish local text stability from page/viewport movement. [Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls).
- **Coordinated activity.** Common-fate experiments motivate treating a shared glimmer as a grouping cue. They do not establish that this rhythm improves diffusion reading. [Chalbi and colleagues](https://arxiv.org/html/1908.00661).
- **A reason to protect already readable text.** Live-caption research connects instability with reading discomfort and evaluates stabilization. It supplies a relevant constraint, not an effect size for skeletons or a rationale to delay every answer. [Liu and colleagues, CHI 2023 extended abstracts](https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/).

Prior art remains explicit: the [CSS Script reference](https://www.cssscript.com/skeleton-loader-placeholder/), [zalog implementation](https://github.com/zalog/placeholder-loading) and [MUI pulse/wave/static skeletons](https://mui.com/material-ui/react-skeleton/) precede this study. The controlled skeleton comparison reviewed here had 14 participants and found no significant perceived-speed or navigation advantage over spinners; that does not establish equivalence. [Mejtoft and colleagues](https://doi.org/10.1145/3232078.3232086). Animated progress-bar findings concern a different, determinate stimulus. [Harrison and colleagues](https://www.chrisharrison.net/projects/progressbars2/ProgressBarsHarrison.pdf).

I claim an inspectable design exploration and a source-aware implementation, not first invention or experimentally demonstrated superiority. Zeigarnik, closure and peak-end ideas do not authorize a dopamine claim, a preferred timing value or false certainty. They remain hypotheses or guardrails where the evidence fits.

## What would demonstrate a reader benefit

Keep source timing, release policy, final text and coarse sizing matched across Still, Breathe and Reshape. Measure perceived fluidity, distraction, understanding of the activity cue and mistaken progress/word-count estimates. Observe whether growing the field disrupts reading or pushes controls out of view. Ask what the shapes mean before explaining them.

Test the 280 ms handover separately from waiting motion, including an immediate-text control. Compare sentence versus whole-answer release at their real availability times in a separate task-focused comparison; this cannot isolate a motion effect. Measure time to a correct usable answer, comprehension, satisfaction and false-answer acceptance, including poor source outputs. Counterbalance repeat exposures and include reduced motion, keyboard, screen-reader and mobile sessions. Pilot the task, choose a smallest useful effect and power the confirmatory sample before making benefit claims. No participants or outcomes are invented here.

## Verification and delivery requirements

Baseline evidence belongs to the [v8 release record](growing-skeleton-v8-release-verification-2026-09-12.md). The [integrated opening and gallery record](cinematic-showcase-verification-2026-09-12.md) covers the later software revision, including the continuity correction, short-viewport safe centering and offscreen Replay regression. Its raw checks and source fingerprint are separate from the baseline. The frozen baseline observer report is `docs/growing-skeleton-v8-validation-2026-09-12.json`, with archived raw observations under `data/experiments/growing-skeleton-v8-2026-09-12/`. The four passing focused cases cover whole-answer and sentence release at 390 px and 1380 px. They retain exact output and report zero measured drift in settled reading-page text. Both sentence cases have four handovers, with at most six borrowed cells. Near-full final opacity followed sampled source completion by 200–201 ms; text rest followed at about 300 ms. Where the reserved height exceeded the final page, container rest followed later at 465–467 ms. These observations do not replace the original corpus audit or constitute a reader experiment.

Before calling a published revision verified, require current unit/component checks, the current browser suite, adversarial observer guards, exact archived evidence hashes, a production build and successful verification of the served commit. Test capture-before-shift, nearest-cell limits, no-new-text terminal fade, pause/restart/resize, source-only estimate inputs and absence of provisional protected text. Preserve all old JSON, traces, media and hashes under their historical material identities. Attach exact code and patches to the final release handoff rather than presenting a conceptual recipe as a finished integration.

The prior published revision is [v7](ambient-skeleton-v7-handoff-2026-09-12.md) at `9b42b6f0d744dae59cdc836e4438d6bb61e8419d`. Its five-row/rest observations cannot prove this growing treatment. The [Google reference audit](google-diffusion-reference-audit-2026-09-09.md) distinguishes public model capabilities, inspected visual evidence and this project’s authored integration exercise.

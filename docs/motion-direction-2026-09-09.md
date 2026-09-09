# After Tokens — motion implementation and handoff

**9 September 2026 · implemented prototype · reader evaluation pending**

This document supersedes the earlier proposed motion handoff. It records the renderer revision made after inspecting the reel build at `55ff1759b6371f294352881858443445ad7c9fbb`. The implementation changes layout identity and motion, preserves the causal release contract, and updates the case study. It does not establish a psychological benefit, zero jitter, native iPhone performance or historical novelty.

## The decision

**Put progress where the words form; let readable text keep its shape.**

The presentation moves through four states: suspended, gathering, settling and resting. These names describe the interface, not hidden model cognition or a percentage of work completed. Unresolved positions carry gentle decorative activity. Real source changes update locally. Complete words are immediately readable; passage release receives one local acknowledgement. Finished text rests.

## Before, after and why

| Before: inspected reel build | After: implemented revision | Why |
|---|---|---|
| Every candidate could change inline width. A smooth width still crossed a discrete line-wrap boundary. | Each candidate uses a fixed 2.8ch reservation, independent of its spelling. Committed text may still reflow. | Candidate churn no longer repeatedly rewrites provisional geometry. Final text widths remain unknown. |
| Candidate whitespace changed token parent groups; released passages replaced zone nodes. | Permanent source-token children keep identity through candidate replacement, word completion and release. | A token’s local animation history survives ordinary state transitions. |
| A guessed newline inserted a real break. | Candidate whitespace is flattened inside its reservation; committed text provides authoritative whitespace. | A guess cannot make a paragraph appear and disappear. |
| Reel entry, per-letter blur, bounce, neighboring lift, refocus blur and sentence ripple overlapped. | Immediate committed glyphs, one small-move layout treatment and one local completion response. | The transition acknowledges a source event without staging another reveal over it. |
| Candidate changes repeatedly restarted a delayed breathing row. | The persistent ambient layer starts at a negative regional phase and survives text changes. | The unresolved middle can remain perceptible between candidate updates. |
| Three previews ran at scale 2 while their copy said half pace. | Product previews default to the recorded clock; pace controls correctly label half and twice recorded. | The demonstration’s clock is explicit and consistent. |
| Phone answer width followed intrinsic contents. | Answer bubbles reserve a fixed proportion of their phone frame. | Candidate changes do not resize the surrounding conversation bubble. |
| Replay controls below growing content could move during activation. | Stage playback controls sit above the answer; preview replay captions sit above their frames. | Content growth no longer shifts the target between pointer-down and activation. |
| A secondary-ink mix failed the contrast check on the actual translucent Felt bubble. | Product bubbles use primary committed ink and an anchored dotted underline until release; dark stages retain secondary ink. | State remains visible without sacrificing text contrast or changing geometry. |

## What is now on screen

### Suspended

Open or unresolved positions hold a content-independent reservation. A soft nonlexical treatment breathes over 5.6 seconds, from opacity 0.12 to 0.20. Positions share one of four regional phases rather than independent letter phases or a reading-order wave. The phase begins immediately; it is not a progress estimate.

A source draft is eligible under the existing 0.25 probability floor, hysteresis and attachment rule. It becomes legible only if its complete candidate fits inside the reservation. Fitting draft letters keep a static baseline and provisional opacity. Longer candidates remain nonlexical instead of showing clipped word tails or expanding the line. No probability is presented as the likelihood that the answer is true.

### Gathering

Real source events update the affected positions. Several positions may change together; the renderer adds no letter or reading-order stagger. Candidate whitespace cannot establish a list item, paragraph boundary or exact line length.

A committed token is fixed source text. A committed fragment may be visible before its word boundary is complete; that does not make the fragment a complete word or a true statement. Multi-token words retain their original token children rather than remounting as a replacement word node.

### Settling

Committed glyphs are readable immediately. A newly complete word may receive a 200 ms decorative afterglow. A newly released passage gets one 400 ms local afterglow, and, on dark stages, its readable base changes from secondary to released ink over the brand’s 0–240 ms onset. Translucent product bubbles keep committed glyphs in primary ink; an anchored dotted underline distinguishes unreleased text and disappears at release without changing width. The bloom token controls strength. Zero onset, zero bloom or reduced motion suppress the relevant response.

All newly released ranges in one transaction start together. Feedback does not loop or repeat on later draft snapshots. It is suppressed during a significant relocation and never delays the release boundary, selection or source event.

### Resting

Earlier released text does not replay its arrival as the rest develops. Ambient activity pauses when the presentation is paused, offscreen or in a hidden document. It ends at complete, stopped, error or revision state. Motion off and system reduced motion remove decoration and spatial animation while preserving the same source availability and final text.

The web concept requests a short passage vibration where supported. It is not an implemented native iPhone haptic system and does not claim a separate word tap.

## Layout and identity

The implementation is in `components/settle/settle-answer.tsx`, `components/settle/use-formation-layout.ts` and `app/globals.css`.

The causal reducer remains the authority for committed positions, the word-safe prefix, passages, source status and revision finality. Rendering carves from the same source state with released length zero so released text can retain its token tree. Per-character source offsets determine released styling. Multi-token complete words expand into their existing token children. Keys use run identity, response version and source position; candidate spelling is not a key.

The layout hook operates on changed source/presentation state, not every replay-clock frame. It reads target rectangles and live translations before writes. Necessary small moves translate from the current visible position over 320 ms with `cubic-bezier(.22, 1, .36, 1)`. A move qualifies only for supported spatial elements, unchanged text, previously unreleased content, displacement below 80 px and vertical displacement below 32 px. These thresholds are authored and must be treated as implementation choices.

Large reflows use the authoritative text position immediately. The design avoids a long diagonal flight of readable text across the phone, but the displacement still exists and must be counted. This implementation does not promise zero reflow, especially on commitment of long text, narrow viewports, structural breaks, resize or font changes.

Replay and revision identities reset local motion history. Subsequent candidate snapshots cannot retrigger a release that already occurred. Resize cancels stale spatial animations and resets measurement history. Source finality and snapshot/revision behavior remain separate from motion.

## Reference code and implementation map

The following excerpt is the implemented ambient timing and regional phase rule. Use the repository files above as the authority for full rendering and lifecycle behavior; this fragment alone is not a complete component.

```tsx
const phaseMs = -(Math.floor(sourcePosition / 8) * 3 % 4) * 1400
const style = { '--formation-phase': `${phaseMs}ms` }
```

```css
.settle-ambient {
  position: absolute;
  inset: 0.62em 0.3ch 0.1em;
  border-radius: 50%;
  background: currentColor;
  filter: blur(2.5px);
  opacity: .12;
  pointer-events: none;
  animation: settle-breathe 5600ms ease-in-out var(--formation-phase, 0ms) infinite;
}
@keyframes settle-breathe {
  0%, 100% { opacity: .12; }
  50% { opacity: .20; }
}
.settle[data-active="false"] .settle-ambient {
  animation-play-state: paused;
}
```

The complete stylesheet also handles fitting-draft treatment, the product-bubble underline, terminal states, motion off and reduced motion. Do not apply ambient opacity or blur to committed glyphs. Keep the candidate, readable ink, ambient and spatial-layout responsibilities distinct when extending the renderer.

For another implementer:

1. Preserve the reducer and recorded event clock. Add a source adapter only when its commitment/finality guarantee is explicit.
2. Preserve run/version/position identity through candidate changes and release. Do not key children by candidate text or move them between guessed-word parents.
3. Never measure or reserve the final answer before source availability. Candidate reservations are estimates, and the fit gate is deliberate.
4. Keep committed text readable in the first render. Completion decoration must not become a reveal gate.
5. Extend the single layout transaction instead of reintroducing continuously animated inline widths.
6. Keep per-run acknowledgement deduplication, interruption cleanup and idle behavior. A repeated snapshot is not a new completion.
7. Verify exact output and source-to-legibility behavior before judging how the motion feels.

## Why this can render diffusion

Masked diffusion predicts multiple positions at a step. Some samplers commit several together; others commit fewer, and block schedules may proceed sequentially between blocks. The renderer can display local activity at several source positions without pretending every answer resolves in parallel. It must reproduce the actual event order. [LLaDA, section 2.4 and Appendix B.4](https://arxiv.org/html/2502.09992v3)

A numbered list can develop in several places when those source positions are available. Independent list-item release needs known structural ranges, complete-range/finality signals and a semantic release policy. The current global-prefix reducer does not supply that contract. A guessed newline, repeated candidate, probability or stored final-answer map is insufficient. The prototype does not claim threefold inference speed or independent list finality.

## What the research supports

| Evidence | Design inference | Boundary |
|---|---|---|
| Liu et al. (2023) combined token alignment, semantic updates and smooth animation for live captions; subjective experience improved. | Reduce update disturbance and preserve identity. | This does not isolate animation or establish a diffusion comprehension gain. |
| Heer and Robertson (2007) studied chart transitions and found benefits for tracking, with simple staging preferred to complicated staging. | Coordinate necessary movement and keep each event simple. | Charts are not prose; their study does not prescribe these durations. |
| Schotter, Tran and Rayner (2014) found comprehension costs when rereading was prevented. | Keep earlier words available and protect the reader’s place. | No particular word animation was tested. |
| Bartram, Ware and Calvert (2003) found peripheral motion detectable and some forms distracting. | Keep ambient treatment local and small, then test its attention cost. | Breathing words were not tested. |
| Buell and Norton (2011) studied visible service work and perceived value. | Show real source state without manufacturing labor. | No dopamine response, accuracy improvement or reason to delay available text follows. |

“Satisfying completion feedback” is a design intent, not a biological result. Gestalt closure concerns visual contours. Zeigarnik does not establish a general engagement budget. Peak-end findings do not demonstrate that a sentence flourish improves this experience. These ideas cannot replace a reading study.

The latency citation is corrected: Tan, Messerschmidt, Yin and Nov compared 2-, 9- and 20-second time-to-first-token delays. The study did not test an instantaneous response, clause pacing or subsecond animation. The earlier Zhu pacing citation was not verified and is withdrawn as support. No artificial source delay was added.

Sources: [Liu et al.](https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/), [Heer and Robertson](https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf), [Schotter et al.](https://journals.sagepub.com/doi/10.1177/0956797614531148), [Bartram et al.](https://scholars.unh.edu/ccom/979/), [Buell and Norton](https://www.hbs.edu/ris/Publication%20Files/Norton_Michael_The%20labor%20illusion%20How%20operational_f4269b70-3732-4fc4-8113-72d0c47533e0.pdf), [Tan et al.](https://doi.org/10.1145/3772318.3790716).

## Measurements and validation boundaries

The controlled 9 September observation used Chromium at **390 × 844**, the hook’s `weather__random-b32` trace, and the recorded 1× forward-pass clock for 18 seconds, once per condition. The baseline was `55ff1759b6371f294352881858443445ad7c9fbb`; the revised sample was captured before final editorial and accessibility refinements. There was no scroll or resize during sampling.

| Observed measure | Baseline | Revised sample |
|---|---:|---:|
| Matched source-position remounts | 47 | 0 |
| Frames with blurred or faded committed text | 852 | 0 |
| Maximum released-glyph displacement | 0.19 px | 0 px |
| Maximum identical committed-glyph displacement | 276.5 px | 280.6 px |

Released-glyph stillness is supported by 58,432 nonempty matched samples after the fix. **The worst identical committed-glyph move did not improve.** Different token/group layouts also produce different sample populations, so percentile differences are not an aggregate reader or performance result. Large provisional wraps remain. This is one engineering observation, not evidence of improved comprehension, comfort or physical iPhone performance. [Exact summaries, metric definitions, caveats and reproduction command](motion-validation-2026-09-09.json)

Release checks passed: lint, type checking, **244 tests in 36 test files**, production build and GitHub Pages static build. The full browser run passed **all 21 checks** across Chromium, WebKit and iPhone 14 emulation in 1.9 minutes. This is browser automation, not a physical iPhone benchmark.

The old nine-second desktop-hook measurement—mean movement 3.69→2.38 px per cell per frame and maximum 103.2→101.4 px—belongs to the 8 September width experiment. It is not a result for this revision and does not validate phones, passage promotion or comprehension.

The historical draft report also predates the new width-fit gate. Its 0.1699 eligible share of open-position steps, 0.6657 eventual-token match rate and 0.9272 share of steps with an eligible draft describe the source display policy. They are not the current visible-draft rate after fitting. A new screen-visibility measurement is needed for that claim.

Engineering verification covers causal release, exact final output, identity and lifecycle behavior. The revision includes a component-level corpus check for all sixty final answers under all three policies, complementing the reducer’s existing corpus audit. The completed release checks are recorded above. The browser suite includes accessibility, reduced motion, token identity, committed-text legibility, playback and final-output checks. Browser QA also prompted keyboard-scrollable, labeled regions for the cost and voice tables, primary committed ink in translucent product bubbles, and stable playback-control placement above growing content.

For motion measurement, track matched words across candidate replacement, word completion and release; include 320/375/390/430 px views, desktop, portrait changes and sustained mobile runs. Report maximum displacement, p95/p99 displacement, line-wrap changes, released-text movement, animation restarts, frame gaps and source-to-legibility delay. Keep resize and scrolling separate. Do not average away the single jump that loses the reader’s place. WebKit automation is not evidence of performance on a physical iPhone.

The reader study remains unrun. Compare the prior reel build, layout fixes alone and layout fixes with ambient/completion feedback using identical source events. Measure qualification accuracy, time to a correct usable answer, comfort, place loss, satisfaction and acceptance of provisional or false text. Include repeated exposure and reduced-motion users. Preference alone cannot establish improved comprehension or calibrated trust.

## Writing and scope updated with the implementation

The README, case study, research note, field and contract explanations, brand token descriptions, phone concept and evidence ledger now describe the revised behavior. Unsupported production-speed multipliers and causal neighbor-lift wording were removed. The historical design record retains earlier experiments and labels the new revision as superseding them. The original visual design and recorded corpus remain the foundation.

Independent list finality, live production adapters, full Markdown, scripts without word spacing, physical iPhone validation and reader outcomes remain future work. The implementation makes the motion proposal concrete without presenting those open questions as resolved.

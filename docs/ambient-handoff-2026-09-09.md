# After Tokens: ambient answer implementation handoff

**Historical scope:** the feathered ambient implementation and its verification below belong to revision `05914c1`. The latest solid-bar material is documented in the [skeleton motion study](skeleton-motion-study-2026-09-09.md) and [skeleton handoff](skeleton-handoff-2026-09-09.md). Their fresh validation is separate; this record is preserved rather than relabeled.

**9 September 2026 · implemented working prototype · reader benefit unvalidated.**

This is the current implementation guide for the ambient composition and whole-answer revision. Preserve the original case study's typography, palette, editorial structure and product frames. The task is to make the waiting area behave as a fluid composition, then let the answer arrive together, without pretending to know its words or final layout in advance.

The current revision passes lint, type checking, 268 tests across 40 files and 42 browser checks across Chromium, WebKit and iPhone 14 emulation. Five medium review findings are corrected. Eight rendering observations and both production builds are complete. No reader study or physical iPhone validation has been completed. The complete source bundle and patch accompany the final handoff; this document supplies rationale, architecture and continuation instructions.

## 1. The implemented experience

Five broad, softly feathered bars move inside an 8 em answer area. They share a slow deformation, with much smaller local drift. They are authored visual material: five bars do not mean five lines, five ideas or five unfinished words. Their positions and lengths are independent of token candidates, confidence, final text and formatting.

The source can update sparsely while this composition continues moving. The motion says the request remains active. It is not a percentage, proof of reasoning, or a new commitment on every frame. A normal text-like loading material is deliberately being used as ambient activity, rather than as a precise skeleton of content already known.

At source finality, the bars disappear immediately and the exact answer appears in one plain text span at full reading contrast. A separate 260 ms soft cue around the answer acknowledges completion. The cue does not blur, scale, move or reveal the letters. It is not a bar-to-glyph morph, and it does not hold the answer for its own ending. Source completion also does not mean the answer is correct.

The occupied frame has a minimum height of 8 em. A short answer retains that space; a long answer can expand it once. This avoids a guessed final layout, but it does not eliminate the final height change. Playback controls sit above growing content so the controls do not move under the pointer during ordinary playback.

## 2. Why this direction was chosen

| Earlier approach | Current choice | Reason and cost |
| --- | --- | --- |
| One placeholder per token | Five authored bars, independent of tokens | Tokenization fragments are not future words. Per-token geometry invited boxes, frequent local changes and a misleading appearance of word-level progress. |
| Candidate words reshape their area | Candidates remain outside the default visible text | A provisional space or long guess cannot move the loading layout. This sacrifices access to those candidates. |
| Complete words arrive one at a time | The whole answer appears after finality | Removes the intermediate typing sequence by holding early text. The wait is measured rather than disguised. |
| Separate token animations | Shared primary motion plus small local drift | Tests whether coordinated change feels like one active area. This is a hypothesis, not an established preference. |
| Decorative animation resets with source steps or motion toggles | Persistent CSS animation phase, paused in place | Source events and settings should not repeatedly snap the composition back to its first frame. |
| A fade or blur on new letters | Readable text immediately, separate surrounding cue | Preserves contrast and the native shape of text during the completion response. |

This is applicable to diffusion because the source can predict many open positions and commit them in an order unrelated to reading order. The renderer does not need to draw that process as a cursor advancing across a sentence. However, this waiting treatment can also be used with other whole-result sources. It is not a new diffusion decoding algorithm, and whole-answer release alone is not unique to diffusion.

The contribution under evaluation is the combination of a coherent ambient composition for unknown text, a causal finality boundary, and a visible price for foregoing early reading. Avoid claiming novelty priority for skeletons, synchronized motion or whole-result loading.

## 3. Research and its limits

The [field experiment](field-experiment-2026-09-09.md) contains the primary-source ledger, exact tasks and fuller reasoning. The construction uses four evidence categories:

- **Grouping research:** Chalbi and colleagues studied how coordinated changes can group visual elements. It motivates the coherent-versus-independent comparison, not a claim of improved reading. [Primary paper](https://arxiv.org/html/1908.00661).
- **Skeleton evidence:** Mejtoft and colleagues' 14-person news-site experiment found no significant advantage over a spinner in perceived speed, navigation ease or finding an article. Familiarity is a design starting point, not proof of superiority. [Primary paper](https://doi.org/10.1145/3232078.3232086).
- **Reading stability:** Liu and colleagues studied stabilization of live captions, combining several interventions. That motivates protecting readable text but does not establish that withholding a whole answer helps. [Primary publication](https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/).
- **Motion practice:** Apple's fluid-interface demonstrations and Fluent 2 guidance inform continuity, immediate control, constrained movement and reduced motion. They are professional design guidance, not trials of this loader. [Apple WWDC 2018](https://developer.apple.com/videos/play/wwdc2018/803/), [Fluent 2 Motion](https://fluent2.microsoft.design/motion).

The local Emil and Impeccable guidance was reviewed for interruption, motion purpose, limited layout animation and repeated-use costs. No neurological mechanism, dopamine response, general Zeigarnik benefit, or guaranteed peak-end effect is asserted. The latest ChatGPT loading animation was not inspected on the locked Mac; this work is not presented as its reconstruction.

## 4. Architecture and authoritative files

| Responsibility | File | Boundary to preserve |
| --- | --- | --- |
| Policy and source event types | [lib/settle/types.ts](../lib/settle/types.ts) | `answer` is an explicit release policy, separate from motion appearance. |
| Release and finality | [lib/settle/reader.ts](../lib/settle/reader.ts), [boundary.ts](../lib/settle/boundary.ts) | Only the reducer releases source text. |
| Ordinary recorded replay | [lib/settle/replay.ts](../lib/settle/replay.ts) | Consume causal events without using retrospective answer, word or tail fields. |
| New source recordings | [lib/settle/experimental-recordings.ts](../lib/settle/experimental-recordings.ts) | Override only the recorded clock; preserve source events and failures. |
| Replay clock | [components/settle/use-replay.ts](../components/settle/use-replay.ts) | Source presentation time is separate from decorative animation time. |
| Ambient geometry | [components/settle/ambient-composition.tsx](../components/settle/ambient-composition.tsx) | Accepts no tokens, candidates, final words or progress estimate. |
| Ambient motion | [app/ambient-composition.css](../app/ambient-composition.css) | Persistent transform/opacity animations; static masks; no source-driven layout. |
| Final answer and interruptions | [components/settle/settle-answer.tsx](../components/settle/settle-answer.tsx) | One exact final span; distinct partial, stopped, error and revision states. |
| Answer layout and completion cue | [app/globals.css](../app/globals.css) | Readable glyphs keep full contrast, no filter or transform; cue is a separate sibling. |
| Controlled demonstration | [components/settle/ambient-study.tsx](../components/settle/ambient-study.tsx) | One source clock, three appearances, separate earlier-reading comparison. |
| Case-study chapter | [components/sections/section-field.tsx](../components/sections/section-field.tsx) | Explain the material, evidence and limits without promising final geometry. |

The existing interval renderer remains available through earlier release policies. It is an inspectable alternative, not the geometry engine for the new bars.

### Finality rules

For `answer`, the reducer emits no passages or forming text until a valid source completion. Completion can be established by a committed end token reached through the contiguous committed prefix, a valid explicit finish whose counts match, or an explicitly final snapshot. An end token beyond a gap is insufficient. Punctuation, probability, repeated identical drafts, guessed EOS and elapsed time are insufficient. Stop and error are separate terminal states.

Once a nonempty answer is final, its exact text becomes one passage. `SettleAnswer` joins only released passage text and renders one `.settle-answer-text` span. Native whitespace handling and selection remain available. Empty final output gets an explicit label outside the exact-answer region. Stopped or failed sources can expose their committed prefix through “inspect unfinished text”; that disclosure is labeled incomplete and does not join later fragments across gaps.

Revisable snapshots use the same finality distinction. A later revision is reviewed and explicitly applied, preserving the earlier version. The loading material must not silently overwrite text that has already been read.

### The ambient input boundary

The implemented component receives only:

```ts
type AmbientProps = {
  active: boolean;
  motion: boolean;
  condition?: "coherent" | "static" | "independent";
  complete: boolean;
  runId: string | number;
  tempo?: number;
};
```

Do not expand this interface with candidate text, per-token widths, final line measurements or a retrospective completion percentage. `runId` identifies a deliberate new replay. It must not change on each source event or on a motion toggle.

## 5. Exact motion parameters

At tempo 1, the coherent primary cycle is 5.4 seconds. The five initial bars use these authored values:

| Bar | Left | Width | Top | Independent primary period | Local drift period |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 4% | 77% | 0.55 em | 4.4 s | 7.1 s |
| 2 | 10% | 86% | 1.92 em | 6.3 s | 6.7 s |
| 3 | 2% | 83% | 3.31 em | 5.1 s | 7.9 s |
| 4 | 15% | 71% | 4.69 em | 6.9 s | 7.3 s |
| 5 | 6% | 79% | 6.05 em | 5.6 s | 8.3 s |

Each bar is 0.82 em high. Primary keyframes range from −0.4 to +0.45 em horizontally, −0.16 to +0.18 em vertically, 0.84–1 horizontal scale, 0.9–1.14 vertical scale and 0.67–0.79 outer opacity. Inner ink opacity is 0.23. Local drift is much smaller: at most 0.05 em horizontally and 0.045 em vertically, with horizontal scale 0.997–1.003. These are decorative engineering choices; no cited paper establishes them as optimal.

The independent condition changes periods, not shapes or displacement ranges. It is deterministic phase divergence, not random statistical independence. Different periods produce different speeds and short-run averages, so the current stimuli do not isolate coherence perfectly. A confirmatory study needs additional matching or explicit modeling of these differences.

Motion-off pauses the existing CSS animations. It must not apply an inherited `animation: none !important` that cancels them and creates new instances when motion resumes. The static experimental condition intentionally has no animation. Reduced motion pauses the moving variants. The completion cue is a separate 260 ms box-shadow ornament, created once only when completion is visible, unpaused and motion-enabled; it is consumed if unavailable and removed after animation end. Reenabling motion or returning to the page must not replay it.

## 6. Comparison and recording behavior

Desktop shows static, coherent and independent conditions on the same replay clock and answer state. Narrow screens show one selected condition; choosing another explicitly restarts the source. That mobile comparison is sequential, with exposure differences and possible answer-memory effects. It is not a substitute for counterbalanced participant stimuli.

Offscreen or hidden answer surfaces freeze decoration. The replay starts after its initial visibility trigger and then continues; it does not freeze the source merely because the user scrolls away. A hidden tab can catch up when frames resume. A participant study must use a dedicated exposure controller if matched viewing time matters.

The gallery exposes four experimental runs through dynamic imports. `replayExperiment` inherits the trace object and replaces only `step_ms` with the observed `step_wall_ms`. Avoid spreading the trace object: that could access forbidden retrospective properties. The observed clock is capture-loop availability time, not API latency. The 0.5× control slows source replay for inspection while leaving decorative motion authored independently.

The optional earlier-word surface uses the same events and clock but a different release policy. Its reducer state is cached by the number of elapsed source events, avoiding reconstruction on every animation frame. It does not influence ambient geometry or whole-answer release. All child conditions disable their individual announcements; the study owns one polite status message.

Outcome-specific recording notes appear after source completion. The public page remains an annotated demonstration. Before using it as participant stimuli, remove or control source labels, explanatory teaching and repeated exposure to the same answer.

## 7. Evidence and availability cost

The original 60 traces all committed one position per step: 7,680 positions across 7,680 steps. Parallel candidate predictions do not turn those into batched commitments. The four new 32-step captures commit four positions per step; content-only multi-commit steps number 4 for weather, 18 for sky, 5 for low-confidence sleep and 32 for random sleep. End/padding commitments are included in the four-position total. Poor outputs remain unedited. [Capture evidence](../data/experiments/README.md), [replay audit](../data/experiments/parallel-replay-audit-2026-09-09.json).

The [whole-answer report](../data/experiments/answer-policy-cost-2026-09-09.json) covers the original corpus. Among 57 nonempty runs, first answer release is a median 15,789.6 ms. The paired median additional wait over sentence release is 10,473.6 ms. The mean of each trace's character-mean hold after joining the contiguous prefix is 6,296.8396 ms; this is not the character-weighted corpus mean. All 60 final outputs match and no released character precedes commitment, with empty outputs retained for fidelity checks.

These are reducer eligibility and hold measurements on synchronized forward-pass clocks. They do not measure browser paint, perceived delay, production inference latency or reading speed. New capture-loop timings and old forward-pass timings are not a controlled speed comparison.

The earlier [geometry report](motion-validation-2026-09-09.json) recorded a worst identical committed-glyph move of 280.6 px after versus 276.5 px before for a different renderer. It cannot validate these bars. The fresh eight-observation audit below measures the current whole-answer height change and frame behavior separately.

## 8. How another AI should continue

Read the source boundary and the actual CSS before changing the appearance. Preserve the original visual system and source recordings. Keep the earlier interval alternatives labeled, but do not reintroduce their token cells into the default composition.

For a material refinement, change authored shapes and motion parameters only in the ambient component and its CSS. Keep starting geometry identical across experimental conditions. Inspect the first second, the middle, interruption, completion and repeated playback at desktop and narrow widths. Match the strength and spatial extent of the completion cue across conditions. Do not delay final text to make a beautiful animation finish.

For a source change, validate the event adapter independently before showing the result. Retain bad answers and refusals. Do not curate a convincing parallelism story by moving events in time or replacing model text with a polished answer. Keep the source clock's provenance visible.

For publication, run the checks below, record their exact scope, then update this handoff and the case study together. The existing tests and past review are evidence inputs, not a substitute for verification after new edits. [Independent code review](ambient-code-review-2026-09-09.md).

```bash
pnpm check
pnpm test:e2e
GITHUB_PAGES=true pnpm build
ANSWER_POLICY_REPORT=1 pnpm exec vitest run tests/settle/answer-policy.test.ts
node scripts/audit-parallel-replay.mjs
```

The full patch and source bundle should accompany this document when it is handed to an AI outside this repository. Preserve actual files rather than asking it to recreate the implementation from prose alone.

## 9. Acceptance gates

| Gate | Required observation |
| --- | --- |
| Causal geometry | Changing future final text or unseen events cannot change an earlier frame under the same request state and visual seed. No early final-text measurement or hidden glyph mask exists. |
| Exact release | Every condition releases the exact final answer at the same causal eligibility time. Stop/error and guessed EOS never release a completed answer. |
| Stable readable text | Final text has full intended contrast and no blur, translation, scaling or stagger. Measure any subsequent glyph displacement and the final container-height change. |
| Persistent motion | Motion-off/pause retains animation instance and phase; reenabling resumes without a reset. A new run deliberately resets. |
| Single completion response | One visible completion causes at most one 260 ms ornament. Completing hidden or motion-off cannot schedule a later replay of the cue. |
| Controls and accessibility | Controls remain targetable during growth; one study announcement; named regions; selectable text; reduced motion; clear empty, failed, stopped and revision states. |
| Mobile observation | Verify the one-condition selector, replay behavior and long final answers in actual browser profiles. Record physical-device testing separately if performed. |
| Evidence scope | Source validation, geometry, browser appearance and reader outcomes are reported separately. Old results are not relabeled as evidence for this revision. |

Current verification passes lint and types, 268 tests in 40 files, and all 42 browser checks on the fresh CSS across Chromium, WebKit and iPhone 14 emulation. Coverage includes seven answer-surface lifecycle tests and four experimental-adapter tests with forbidden metadata, plus accessibility, reduced motion, phase identity and one-time completion. Eight rendering observations and both production builds are complete; physical iPhone and reader validation remain unrun.

## 10. Reader study and future structured output

First compare static, coherent and independent ambient conditions under identical whole-answer release and identical completion decoration. Counterbalance prompts, control exposure time, include short and long waits and repeat use. Measure perceived fragmentation and smoothness, activity understanding, false progress estimates, comfort and preference. Match or model motion energy and short-run luminance/area differences before attributing an effect specifically to coherence.

Separately compare earlier-word access and whole-answer release at their real availability times. Measure task accuracy, time to a correct usable answer and presentation hold. A whole-answer preference is not a faster-model result. Include incorrect or poor answers and measure whether presentation increases false acceptance. Pilot first, declare a smallest useful effect, power the confirmatory study and report intervals; a nonsignificant difference does not establish equal readability.

A future three-item interface may legitimately show three regions early only if the application owns those regions or the decoder enforces that exact structure. A prompt asking for three bullets is insufficient. Grammar-constrained diffusion is relevant prior work, but syntactic validity alone does not establish independent item finality. [DINGO](https://arxiv.org/abs/2505.23061), [context-free grammar constrained diffusion](https://arxiv.org/abs/2508.10111).

A bounded extension would use stable region IDs, a declared structure contract, versioned source events and an explicit final event for each region. The renderer could then maintain one ambient composition per known region and release complete items independently, while leaving other regions active. An item must not be declared complete because its local animation ends or its last visible token is punctuation. The backend must define whether later content can revise or qualify an earlier item, and revisions must remain explicit.

That extension is not implemented. Test it separately from the current whole-answer policy, including reordered events, missing regions, cancellation, revised items and variable-length content. Do not label three independently requested completions as one model's parallel decoding unless the source actually provides that process.

## Rendering observations for this revision

Eight sequential Chromium observations at 390 and 1380 px viewport widths each produced one complete text update with no pre-final text. Across 9,667 matched first-character samples of final whitespace words, observed displacement after arrival was 0 px. The long explanation grew the occupied answer frame from 120 to 219.375 px at finality. This is a one-time 99.375 px expansion, not zero layout change. The largest measured primary bar rectangle-edge change was 0.5663 px between sampled frames; maximum observed frame gap was 18.8 ms in these runs. These observations describe this development machine and sampled stimuli, not physical iPhone performance or a reader preference.

The [measurement report](ambient-motion-validation-2026-09-09.json) defines all metrics and records implementation/source hashes. The [artifact manifest](../data/experiments/ambient-motion-2026-09-09/manifest.json) links eight compressed raw logs and the two screen recordings. A source deadline and readable text first observed in the same frame is recorded as zero sampled-frame delay; it is not a claim of zero display latency.

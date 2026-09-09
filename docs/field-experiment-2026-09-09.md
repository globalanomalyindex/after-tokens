# A continuous field for text that does not have a final shape yet

**Historical scope:** the feathered ambient implementation and its verification below belong to revision `05914c1`. The latest solid-bar material is documented in the [skeleton motion study](skeleton-motion-study-2026-09-09.md) and [skeleton handoff](skeleton-handoff-2026-09-09.md). Their fresh validation is separate; this record is preserved rather than relabeled.

**Implemented working prototype · 9 September 2026.** Ambient bars, the three-condition comparison and whole-answer release are implemented. The new source captures and reducer costs are checked. Lint, types, 268 tests across 40 files and 42 browser checks pass; eight rendering observations and both production builds are complete. No reader study has been run. This document records implementation and research rationale without claiming that the renderer has solved jitter or improved reading. For architecture, exact code pointers and continuation instructions, use the [ambient implementation handoff](ambient-handoff-2026-09-09.md).

**Latest direction: ambient bars move as one composition inside the answer area, then the complete answer appears together after source finality.** The bars are not mapped to words, tokens, final line count or final geometry. The primary motion study compares static bars, coherent ambient bars and independently moving bars under this same whole-answer policy. Earlier word display is a separate availability tradeoff. The adaptive text skeleton and continuous ink field remain explored alternatives below, not the default implemented treatment.

The design question is narrower than “are skeletons good?” A conventional skeleton previews a layout that usually exists already. Diffusion generation may not yet determine the words, line lengths, paragraph count, or Markdown structure. The useful adaptation is to communicate ongoing activity in the text container while withholding unsupported claims about the answer's final shape. This is an ambient composition with a text-like material, not an exact layout preview or progress estimate. It borrows the whole-result arrival of image generation without claiming the underlying text sampler works like a continuous image process.

## 1. What the evidence actually supports

### Skeleton familiarity is a starting point, not proof of a benefit

Mejtoft, Långström and Söderström's controlled study assigned 14 people equally to versions of a fictional news site using a skeleton or spinner, with a 2.75-second delay on each page. It found no significant difference in perceived speed (p=.16), navigation ease (p=.31), or time to the first requested article (p=.69; spinner 13.60 seconds, skeleton 15.01 seconds). Descriptive ratings favored the skeleton, but the sample does not establish superiority or equivalence. This was page navigation, not reading text while it changed. [Original paper, ECCE 2018](https://doi.org/10.1145/3232078.3232086), [author-uploaded full text](https://www.researchgate.net/publication/326858669_The_effect_of_skeleton_screens_Users%27_perception_of_speed_and_ease_of_navigation).

NN/g describes skeletons as previews of eventual page structure and cautions about distracting animation and flashes during very short loads. Its article is practitioner guidance, not a newly reported controlled NN/g experiment. Its cited 2018 study is the small, nonsignificant comparison above. We should not translate the article's positive summary into “research proves skeletons make diffusion feel faster.” Generating an answer is also a deliberate extension beyond that article's full-page loading use case. [NN/g, *Skeleton Screens 101*](https://www.nngroup.com/articles/skeleton-screens/).

### Official systems constrain what a skeleton can promise

Fluent 2 recommends skeletons when the structure is known, and suggests another indicator when it is unknown. For variable content it recommends consistent, high-level structure rather than exact details. It also advises synchronizing skeleton animation when loading is staggered, to avoid a fragmented display. Its accessibility guidance preserves focus and discourages excessive live-region announcements. These are design-system recommendations, not an effect-size estimate. Here they support representing an app-owned answer frame, while making an unconstrained answer's structure deliberately provisional. [Microsoft Fluent 2 Skeleton guidance](https://fluent2.microsoft.design/components/web/react/core/skeleton/usage).

Carbon similarly treats skeletons as simplified representations of loading content containers, not every control on the page. That supports keeping the reply controls usable and stable while the content area is busy. It does not justify drawing three numbered items before the system knows there will be three. [IBM Carbon loading patterns](https://carbondesignsystem.com/patterns/loading-pattern/).

### Appearance can affect waiting, but the task matters

Harrison, Yeo and Hudson tested pulsation and moving ribbing on determinate horizontal progress bars. Their final experiment, with 16 participants, matched a five-second solid bar to a 5.61-second backward-moving, decelerating ribbed bar, and a fifteen-second solid bar to a 16.75-second ribbed bar. This demonstrates an appearance effect in that task. It does not establish that any shimmer, slow breath, text animation, or diffusion interface has the same effect. The advancing progress front was part of their stimulus; copying the reported approximately 11% effect into this case study would be invalid. [Harrison et al., CHI 2010, primary paper](https://www.chrisharrison.net/projects/progressbars2/ProgressBarsHarrison.pdf).

### Coordinated change can make several elements read as one group

Chalbi and colleagues studied common fate using animated visual elements, including a 100-person online grouping experiment with four circles and two-second animations, followed by a smaller visualization study. Their results extend grouping beyond shared position changes to coordinated changes such as luminance and size; the visualization follow-up shows that context matters. This motivates comparing a shared luminance rhythm against independent token pulses. It does not establish an optimal breathing period, reduced distraction, or improved text comprehension. [Chalbi et al., *Common Fate for Animated Transitions in Visualization*](https://arxiv.org/html/1908.00661).

### Texture can communicate a broad state without pretending to be words

Chong and Treisman studied mean-size judgments for sets of circles, including brief displays, and found efficient perception of ensemble properties. Their stimuli were not text or loaders. The restrained inference is that a surface may convey an aggregate visual state without requiring inspection of each element; it does not follow that readers can recover exact progress from its texture. A field should therefore signal “this area remains active,” not a numerical estimate hidden in visual density. [Chong and Treisman, *Representation of statistical properties*](https://www.sciencedirect.com/science/article/pii/S0042698902005965).

### Reading needs its own stable layer

Liu and colleagues compared live-caption stabilization strategies with 123 participants viewing short captioned clips. Their improvements combined token alignment, more meaningful update units, and animation smoothing; several subjective measures improved over comparison strategies. The study supports taking instability seriously, but does not isolate one animation as the cause, validate this diffusion renderer, or prove a comprehension gain here. Our test must measure readable-text stability separately from how attractive the surrounding field looks. [Liu et al., CHI 2023](https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/).

None of these studies measures dopamine release, demonstrates that an unfinished answer invokes a useful Zeigarnik effect, or proves that a completion glow produces a peak-end benefit. A brief completion response is an interaction hypothesis to test. It should not be described as a neurological reward mechanism.

### Motion practice informs construction, not proof of a reader benefit

Apple's *Designing Fluid Interfaces* emphasizes immediate response, interruptible behavior, spatial continuity and small changes between adjacent frames. Its demonstrations concern gestures and dynamic interfaces, not diffusion reading. The relevant inference is to preserve continuous trajectories without source-event resets, keep the answer area spatially consistent, and let Stop or Replay take effect immediately. A “floaty” look should come from continuous motion and gentle deceleration, not from slowing every response or adding a bounce to text. [Apple, WWDC 2018 session 803](https://developer.apple.com/videos/play/wwdc2018/803/).

Fluent 2's motion guidance ties motion to function and recommends considering travel distance, avoiding sluggish transitions, constraining motion to the relevant area, and offering a no-motion setting. It does not require every element to share a phase: grouping and hierarchy depend on context. We therefore test coherence instead of assuming that it helps. [Microsoft Fluent 2 Motion](https://fluent2.microsoft.design/motion).

The local Emil design-engineering and Impeccable product/motion guidance were also reviewed. Applied here: choose a purpose for motion, preserve interruption, avoid casual layout animation, use a brief state response, respect reduced motion, and test repeated exposure. Their aesthetic recommendations are craft heuristics, not controlled evidence. The existing project and user brief supply the product context: an AI answer surface, original case-study typography and palette, no per-token boxes, no typing choreography, and a stable mobile reading area. No new design-system files or theme change are required for this experiment.

| Before | Implemented after | Why |
| --- | --- | --- |
| One rectangular reservation for each source token | A bounded composition of broad, soft bars independent of token count | Stops displaying tokenizer fragments as if they were future words |
| Each candidate changes local dimensions | Continuous, bounded movement in a fixed decorative plane | Source candidate churn cannot push layout around |
| Each committed word arrives separately | One answer arrival after explicit source finality | Deliberately removes the typewriter reading sequence; its extra wait must be reported |
| Animation restarts on each event | Persistent phase and velocity; source state controls start, stop and finish | Avoids repeated snapping back to an animation's first frame |
| A shimmer front travels left to right | Shared slow deformation across the whole composition | Avoids implying the answer is being scanned or finalized in reading order |

The latest ChatGPT loading animation was not inspected on the locked Mac. This prototype must not be described as a faithful reconstruction, comparison or clone of that current product behavior.

## 2. Can formatting come before the words?

**Sometimes. The interface must distinguish where that knowledge comes from.**

| Situation | What can be known early | What the interface may reserve | What remains unknown |
| --- | --- | --- | --- |
| The application owns a fixed structure, such as three separately requested answer fields | Field count, labels, order and container styles exist before generation | The actual three containers and their labels | Their text lengths, line wraps, accuracy and independent finality unless the source protocol supplies it |
| A decoder enforces a grammar or schema | Only structural facts guaranteed by that constraint; fixed required fields or fixed cardinality if explicitly enforced | The guaranteed containers, with an explicit unknown height policy | A variable-length array's count, prose length, completion time; syntax alone does not establish semantic correctness |
| A prompt requests a numbered list in unconstrained Markdown | The desired format is known; compliance is not guaranteed | A generic answer area, or a clearly identified intended layout | Whether the model will produce the list, its count, nesting, final newlines or heading boundaries |
| Formatting tokens become irrevocably committed during generation | Those source token pieces are fixed | Additional structure only when committed surrounding context establishes its meaning | A dot or newline at an isolated position does not by itself establish a final list or a complete item |
| The source only provides revisable snapshots | The current draft contains a possible layout | A visibly provisional structure, if the product accepts revision | Irreversible boundaries or completion until the source explicitly establishes them |

Constrained diffusion decoding is technically possible. DINGO uses dynamic programming to satisfy regular-expression constraints during inference. Work by Mündler, Dekoninck and Vechev checks whether an arbitrary partial diffusion output admits a completion under a context-free grammar. These are mechanisms for syntactic constraints, not evidence that formatting tokens naturally become fixed first. Neither constrained-decoding integration is implemented here. [DINGO](https://arxiv.org/abs/2505.23061), [Constrained Decoding of Diffusion LLMs with Context-Free Grammars](https://arxiv.org/abs/2508.10111).

### What this project's actual captures show

The original corpus is **60 traces × 128 steps = 7,680 steps**, with exactly one committed token position per step. The capture script deliberately chose that schedule. Parallel candidate prediction is real, but simultaneous multi-token commitment is not represented by those original runs. A boundary token can make several previously committed fragments eligible for display at once; that is a presentation event, not several new source tokens arriving together. [Capture configuration](../scripts/capture-trajectories.py), [original methods](research-note.md).

Four additional experimental captures now use 32 steps for 128 positions, committing four positions per step. Their online candidate records and exact final decodes pass the capture validators. These are new recorded model runs, not an animation that redistributes the old commitments.

| New capture | Content tokens before final EOS | Steps containing two or more content-token commitments | Total steps |
| --- | ---: | ---: | ---: |
| `weather__lowconf-b128-s32` | 17 | 4 | 32 |
| `sky-blue__lowconf-b128-s32` | 71 | 18 | 32 |
| `sleep-tips__lowconf-b128-s32` | 22 | 5 | 32 |
| `sleep-tips__random-b128-s32` | 110 | 32 | 32 |

Four positions per step does **not** mean four readable words, four separate ideas, or four useful content tokens. Some commitments belong to the eventual EOS/padding tail. The outputs retain model failures: the low-confidence sleep answer includes “Avoid enough caffeine,” the sky answer repeats, and the random sleep answer becomes repetitive numerical gibberish. These runs establish genuine batched commitments and useful failure cases, not production answer quality. Their clocks also differ from the original capture's forward-pass-only clock; their latencies are not a controlled speed comparison. [Low-confidence capture validation](../data/experiments/parallel-qwen-2026-09-09/validation.json), [random capture validation](../data/experiments/parallel-qwen-random-2026-09-09/validation.json).

The structure audit classified final decoded output retrospectively and then inspected real commitment times. In the original 60 traces, 32 of 36 final list markers preceded the last token of their first body word, while only 45 of 138 newline characters preceded the last tokens of both adjacent whitespace words. This is mixed timing, not a universal “format first” stage. Final-output classification and neighboring word availability are analysis tools; the renderer cannot use that future knowledge to choose an early layout. [Machine-readable structure audit and definitions](../data/experiments/structure-timing-2026-09-09.json).

For a concrete example, the new low-confidence sleep capture commits the pieces of `1.`, `2.` and `3.` by steps 4, 27 and 29, while the first words of those items finish by steps 25, 30 and 31 respectively (zero-based steps). Some markers arrive before some words; the complete three-item scaffold is not available at the start. A design that displays three completed list slots at step zero would need an app-owned or constrained-format contract, not this trace alone. Even `1.` alone could continue as a decimal; committed surrounding whitespace and line context are needed to establish the list interpretation. [Same structure audit](../data/experiments/structure-timing-2026-09-09.json).

The replay audit adds a useful distinction: the low-confidence sleep answer's first complete causal chunk becomes available at 3,269.713 ms of a 4,047.567 ms run. The random answer's 110 content tokens form only three enormous whitespace runs; its first complete chunk appears at 4,436.178 ms of 4,559.901 ms. Real token parallelism therefore does not guarantee early readable passages. The audit exercises the current replay while final-answer, word, tail and statistics properties throw if read; that verifies this replay boundary, not an interface or reader benefit. [Replay audit](../data/experiments/parallel-replay-audit-2026-09-09.json).

## 3. Implemented: ambient bars, then the answer together

### The material is a composition, not a prediction

Use several broad bars with soft, tapered edges inside one bounded answer area. Their number and arrangement are authored visual composition parameters, independent of token count, predicted words, Markdown, final line count or answer length. They may drift, lengthen, narrow and overlap gently within the decorative plane. Avoid rounded rectangular backing boxes, sharp internal seams and one-to-one alignment with future text. Softness belongs to the bars, not blurred glyphs.

Think of the composition as a single piece of material responding across its area. Several parts change together, with smaller local variation so it does not look like one rigid rectangle scaling up and down. No bar is “word 5”; its length is not confidence; its contraction does not mean the answer is closer to done. A stable nearby status label establishes the literal meaning: the source is generating. An unknown-duration state should not secretly encode a made-up completion percentage.

The field can remain ambient between real source events. This says the request remains active, not that a new token committed on every frame. Completion, stop and error come from the source or request state. Do not make bars progressively organize into the exact future answer, fake an “almost done” phase, or rearrange them to match a retrospectively known list.

### The implemented motion score

These are authored parameters, not research-derived optima. [AmbientComposition](../components/settle/ambient-composition.tsx) and its [CSS](../app/ambient-composition.css) define five bars in an 8 em decorative area. Their initial left offsets are 4%, 10%, 2%, 15% and 6%; widths are 77%, 86%, 83%, 71% and 79%. Each bar is 0.82 em tall, with static feathering along both axes. There is no animated blur or moving shimmer mask.

The coherent condition uses a 5.4-second primary cycle at tempo 1. Its horizontal scale ranges from 0.84 to 1, vertical scale from 0.9 to 1.14, horizontal translation from −0.4 to +0.45 em and vertical translation from −0.16 to +0.18 em. A much smaller inner drift adds local variation. Transform and opacity are the animated properties; that does not by itself prove low power use or compositor behavior on every device.

The independent condition keeps the initial shapes and displacement ranges but uses primary periods of 4.4, 6.3, 5.1, 6.9 and 5.6 seconds. It is deterministic phase divergence, not statistically independent random movement. Different periods also change velocity and short-run average appearance; these are not perfectly matched motion-energy stimuli. Static removes the animation. All conditions begin from the same shape, and tempo scales their periods within the existing 0.7–1.4 range.

At source finality, all bars are removed immediately. The exact answer appears in one ordinary text span at full contrast, with no glyph blur, scale, translation or stagger. A separate soft box-shadow cue around the answer lasts 260 ms once; it animates its own opacity and slight scale, not the text. It is consumed rather than deferred if completion occurs while motion is disabled, paused or hidden, and is removed when it finishes. This is a decorative completion response, not bars physically morphing into letter outlines. [Answer surface and lifecycle](../components/settle/settle-answer.tsx), [answer CSS](../app/globals.css).

The occupied answer frame keeps an authored minimum height of 8 em. Long final answers can expand it once, and shorter answers retain the minimum. The minimum is not a claim about eventual line count. The top anchor and controls remain outside the growing text area; the measured narrow explanation grows once by 99.375 px, as reported below.

Motion-off and pause preserve the ambient animation's current phase. Only a replay/new run deliberately remounts it. Reduced motion leaves static decoration with unchanged source availability. Offscreen or hidden surfaces pause decoration, but the source replay continues after its initial start; returning can show a later source state. That is convenient demonstration behavior, not controlled exposure for a participant study.

[AmbientStudy](../components/settle/ambient-study.tsx) shows all three conditions on one source clock at desktop width. Narrow screens select one condition at a time, and switching conditions explicitly restarts the same recording. Four real experimental captures are selectable at their observed capture-loop clock or 0.5× inspection speed. The optional earlier-word comparison is memoized by source-event count. One polite status announcement serves the study; individual conditions remain named readable regions. Outcome-specific commentary appears only after completion. Stop/error removes the composition and can expose a separately labeled disclosure of the unfinished committed prefix.

### What the whole-answer policy costs

The implemented `answer` policy shows text only when the source explicitly establishes the final answer. It intentionally withholds text that an earlier-word policy could already make readable. It does not speed up the model, prove simultaneous semantic reasoning, or turn single-token source commitments into batches.

The [answer-policy report](../data/experiments/answer-policy-cost-2026-09-09.json) measures source completion, release eligibility, character hold, maximum queued text and exact output on the original corpus. Among 57 nonempty traces, whole-answer first release is a median 15.8 seconds; its paired median additional wait over sentence release is 10.5 seconds. Three empty answers remain in the 60-output audit. These are reducer eligibility times on the synchronized forward-pass clock, not browser paint or API latency. The separate earlier-word comparison makes the tradeoff inspectable. A nicer waiting surface cannot erase these costs.

Do not infer finality from every known position being committed, a high probability, a predicted period, a progress threshold or the animation reaching its endpoint. The reducer's explicit source-completion or final-snapshot contract controls release. If production needs independently completed list items, it needs source-backed region finality; that is a separate capability from whole-answer presentation.

### Alternatives retained for comparison, not silently mixed into the default

| Direction | What it communicates | Potential advantage | Main risk |
| --- | --- | --- | --- |
| Ambient bars, whole answer | An active answer area, with no exact text geometry | Coherent text-like material; a single readable arrival | Withholds usable early text and can imply an answer shape despite disclaimers |
| Adaptive continuous text skeleton | Generic line rhythm that adapts when real structure becomes known | Familiar text affordance and possible earlier reading | Reintroduces line-count expectations, structure changes and intermediate layout movement |
| Continuous ink field | A nonlexical texture with less line structure | Fewer implied word or line boundaries | May resemble image generation or feel less clearly related to text |
| Interval geometry with earlier words | Real available text surrounded by unresolved intervals | Lower availability cost and more visibility into the source | Interval sizing can produce boxes and movement; it is no longer the requested ambient motion study |

The interval renderer can remain an inspectable alternative. The main experiment must not drift back into a skeleton per token because that is easier to attach to the existing data model.

## 4. Causal implementation boundary

The appearance layer needs request state and an already authorized presentation state. It does not need a hidden final answer while generating. This illustrative contract explains the separation; the implemented component accepts the narrower active/motion/condition/complete/runId/tempo props, while SettleAnswer receives reducer state:

```ts
type AnswerPresentation =
  | { kind: "forming"; requestId: string; sourceEventId: string | null }
  | { kind: "final"; requestId: string; text: string; sourceCompletedAtMs: number }
  | { kind: "stopped"; requestId: string }
  | { kind: "error"; requestId: string; message: string };

type AmbientCondition = "static" | "coherent" | "independent";

// The source reducer produces this state. Visual motion never decides finality.
function renderAnswer(
  state: AnswerPresentation,
  condition: AmbientCondition,
  motionAllowed: boolean,
): void;
```

The generating geometry uses viewport, typography, container dimensions and an authored visual seed. It must not read final answer text, final word widths, final EOS split, a future Markdown tree or retrospectively classified list spans. The seed remains stable for a request and is shared across conditions. Token probabilities must not become a brightness scale that looks like confidence in truth.

The completed answer uses natural text layout once it is available. No early glyph masks, exact final line shapes or hidden DOM measurements are permitted. Loading topology and the displayed answer can differ. That honest discontinuity is preferable to secretly using the answer to choreograph its arrival.

## 5. Falsifiable tests and tangible proof

### First, isolate the motion question

The primary comparison has **three conditions under the identical `answer` policy**:

| Condition | Bars and source | What varies |
| --- | --- | --- |
| Static bars | Same initial composition, answer, clock and completion moment | No ambient motion |
| Coherent ambient bars | Same shapes and motion ranges | Shared temporal component with related local movement |
| Independent ambient bars | Same shapes and marginal motion ranges | Independent phases, while avoiding a deliberate reading-order stagger |

The prototype holds final-answer availability and handover constant. It shares initial geometry and displacement ranges, but different independent periods change speed and short-run luminance/area averages. Before a confirmatory study, match or model those differences explicitly. Otherwise, a motion-energy difference could be mistaken for a coherence effect. The static/coherent/independent interface is an inspectable comparison, not an already controlled participant experiment.

An **earlier-word policy vs whole-answer policy** is a second experiment about availability and intermediate reading. It must report presentation hold and task outcomes separately. Likewise, bars vs ink texture is a material comparison, not evidence isolating temporal coherence. Do not bundle all factors into a single “old vs new” claim.

### Engineering checks before claiming improvement

1. Replay identical source events through static, coherent and independent conditions. Assert identical release timestamps and exact final output, including bad model answers. No constituent word is staggered at final release.
2. Perturb unseen future events and final text. Earlier frames must stay identical when the same visible request state and visual seed are preserved. This tests absence of future-shape leakage.
3. Instrument the animation at the frame level: bounded displacement, uninterrupted phase, no retargeting snaps, no unintended long frame stalls. Inspect both beginning and interruption; do not only record a favorable middle segment.
4. Track final-answer glyph identity and movement after release, contrast and any blur. Record the final container height change and neighboring content movement separately from ambient motion.
5. Verify narrow and wide layouts, long answers, late lists, code, empty answers, stop, error and replay. Keep controls outside the growing content's pointer path.
6. Verify reduced motion, manual motion-off, focus and screen-reader output. Decoration is outside the reading order. Announce completion or failure without narrating every source event or bar change.
7. Produce synchronized recordings or a live comparison with the recorded source timeline and explicit availability cost. Preserve the genuine 32-step batches and the original sparse runs as distinct source conditions.

The earlier [motion geometry report](motion-validation-2026-09-09.json) is a baseline result for a different renderer. It did not improve the worst identical committed-glyph displacement (276.5 px before, 280.6 px after in its one controlled Chromium run). It must not be reused as evidence that ambient bars reduce jitter. The fresh browser checks and eight rendering observations below cover this revision; physical iPhone validation remains separate from emulation. The new source captures prove their recorded decoding behavior, not the new interface's quality.

### Reader hypotheses

| Hypothesis | Test | Evidence that would support it | Result that would reject or qualify it |
| --- | --- | --- | --- |
| Coherent bars feel less fragmented | Coherent vs independent ambient, with matched answer timing | Higher whole-area grouping and lower fragmentation ratings | Equal grouping or greater distraction |
| Motion makes waiting feel active without misleading | Coherent vs static bars | Better recognition of an active request without more incorrect progress estimates | Users infer a false percentage, precise answer length or imminent completion |
| The composition feels more fluid | Static, coherent and independent, including interruptions | Better smoothness ratings and fewer visible retargeting disruptions | Preference disappears on repeated use or mobile viewing |
| Whole-answer arrival helps later reading enough to justify its wait | Separate earlier-word vs answer-policy comparison | Better task outcomes or comfort at an acceptable, reported delay | Extra waiting without enough benefit, or readers need early text to act |
| Completion response clarifies finality | Separate handover-on vs handover-off comparison | More accurate recognition that presentation is complete | Increased belief that a poor final answer is factually correct |

Use a counterbalanced comparison with different matched prompts to reduce answer-memory effects. Include short and long waits, good and bad answers, repeated exposure and an interruption task. Ask about what the bars mean before explaining them. “Beautiful” and “working” should not be treated as interchangeable ratings.

Pilot task and question comprehension first, then determine a study size from a chosen primary measure and declared smallest useful effect. Predeclare a practical reading-performance margin; a nonsignificant difference alone does not establish equal readability. Report intervals, errors, task times, availability hold, preference and perceived wait separately. No reader study for these alternatives has been completed.

## 6. Presentation and novelty claim

Show the three ambient-motion conditions with identical source and answer timing. Make the extra wait from whole-answer presentation visible beside a separate earlier-word comparison. Include a short answer, a long answer, late formatting and a retained poor model output. Let the reviewer stop and replay the motion, rather than relying exclusively on a curated video.

The contribution under investigation is **an ambient composition for unknown generated text, combined with an explicit whole-answer presentation policy and an accountable availability cost**. Skeletons, synchronized animation, whole-result loading and diffusion visualizations already exist. Novelty must be argued through this particular interaction, its causal boundary and the measured comparison. Describe it as implemented and testable. Until reader comparisons pass, do not call it proven smoother or faster to read, a faithful current-ChatGPT reconstruction, or a dopamine mechanism.


## 7. Validation status at this documentation checkpoint

The current revision passes lint and type checking, 268 tests across 40 files, and 42 browser checks across Chromium, WebKit and iPhone 14 emulation. Coverage includes seven answer-surface lifecycle tests, four forbidden-metadata adapter tests, accessibility, reduced motion, animation phase identity and one-time completion behavior. The [independent code review](ambient-code-review-2026-09-09.md) records five corrected medium findings. Eight rendering observations and both production builds are complete. These results do not establish reader benefit or physical iPhone behavior; neither has been measured.

## Rendering observations for this revision

Eight sequential Chromium observations at 390 and 1380 px viewport widths each produced one complete text update with no pre-final text. Across 9,667 matched first-character samples of final whitespace words, observed displacement after arrival was 0 px. The long explanation grew the occupied answer frame from 120 to 219.375 px at finality. This is a one-time 99.375 px expansion, not zero layout change. The largest measured primary bar rectangle-edge change was 0.5663 px between sampled frames; maximum observed frame gap was 18.8 ms in these runs. These observations describe this development machine and sampled stimuli, not physical iPhone performance or a reader preference.

The [measurement report](ambient-motion-validation-2026-09-09.json) defines all metrics and records implementation/source hashes. The [artifact manifest](../data/experiments/ambient-motion-2026-09-09/manifest.json) links eight compressed raw logs and the two screen recordings. A source deadline and readable text first observed in the same frame is recorded as zero sampled-frame delay; it is not a claim of zero display latency.

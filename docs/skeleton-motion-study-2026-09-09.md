# After Tokens: still, breathe, reshape

> **Historical material: `solid-rounded-skeleton-v1`, revision `a7606d9`.** These parameters and results are preserved for that revision. Continue with the [anchored motion research](anchored-skeleton-research-2026-09-09.md) and [current implementation handoff](anchored-skeleton-handoff-2026-09-09.md). The historical [JSON report](skeleton-motion-validation-2026-09-09.json) is unchanged.

**9 September 2026 · solid rounded skeleton revision · fresh browser evidence recorded; reader outcomes unvalidated.**

The current material is five crisp, uniformly filled muted-gray bars. Their widths are authored, their height and position remain fixed, and their rounded ends gently move inward and return. The default is **reshape**. It adds a small contour change to a familiar shared opacity pulse. At source finality, every bar disappears immediately and the complete answer becomes readable together. A separate thin outline lasts 260 ms; the letters are never blurred or staggered.

This is a new material revision, identified as `solid-rounded-skeleton-v1`. The previous feathered composition's 268 tests, 42 browser checks, eight Chromium observations and 9,667 matched final-glyph samples belong to revision `05914c1`. Those results remain in the [historical field study](field-experiment-2026-09-09.md) and [historical measurement report](ambient-motion-validation-2026-09-09.json). They do not validate these solid bars. Fresh results appear below and in the [current release record](skeleton-release-verification-2026-09-09.md). Reader benefits and physical iPhone behavior remain unvalidated.

## 1. The question is the added shape movement

| Label | Condition ID | Treatment |
| --- | --- | --- |
| still | `static` | Fixed bar geometry and parent opacity 0.86, the nominal midpoint of the pulse |
| breathe | `breathe` | The same bars with shared parent opacity 0.72 → 1 → 0.72 |
| reshape | `reshape` | The same pulse, plus rounded clipping from zero inset to 8% at each horizontal end and back |

The two moving conditions use a 4,800 ms cycle at tempo 1, with symmetric `cubic-bezier(.45, 0, .55, 1)` easing. Reshape does not translate or scale the bars. Bar height and circular caps stay constant; only their visible horizontal extent changes. At maximum inset the rectangular width is 16% shorter. Visible area and total ink change with that contour. Those changes are part of the treatment, not variables silently claimed to be controlled.

All three conditions share the same source events, whole-answer policy, release timestamp and thin-outline completion cue. Comparing breathe with reshape asks whether the added shape movement is useful or distracting. It does not isolate common fate, test statistically independent motion, or prove a psychological mechanism. Comparing still with breathe asks a separate question about adding a pulse.

## 2. Reference and prior art

My [CSS Script reference](https://www.cssscript.com/skeleton-loader-placeholder/) points to [zalog/placeholder-loading](https://github.com/zalog/placeholder-loading). Its actual SCSS uses solid 10 px rows and a moving gradient over the container, with a default 0.8-second animation. This is a concrete reference for conventional loading geometry. It is neither a controlled usability study nor the exact motion used here. I retained solid text-like bars while removing its traveling shimmer. [Original layout source](https://raw.githubusercontent.com/zalog/placeholder-loading/develop/src/scss/_layout.scss), [duration variables](https://raw.githubusercontent.com/zalog/placeholder-loading/develop/src/scss/_variables.scss).

MUI already supplies pulsing, wave and nonanimated skeletons. Consequently, neither a rounded placeholder nor a pulse is claimed as novel. The proposed contribution is the particular restrained length-change treatment, its application to unknown generated text, and a comparison that reports the cost of whole-answer release. Priority or superiority has not been established. [MUI Skeleton documentation](https://mui.com/material-ui/react-skeleton/).

## 3. What research can justify

Mejtoft, Långström and Söderström assigned 14 people to news-site versions using a skeleton or spinner with 2.75-second delays. They found no significant differences in perceived speed, navigation ease or first-article click time. The small study establishes neither superiority nor equivalence, and did not involve generated text. Familiarity therefore motivates testing this pattern, rather than declaring it beneficial. [Primary paper, ECCE 2018](https://doi.org/10.1145/3232078.3232086).

Sekuler and Bennett demonstrated grouping when elements become brighter or darker together. That motivates a shared pulse, but their experiments did not involve loading text or reader comfort. [Primary publication, 2001](https://journals.sagepub.com/doi/10.1111/1467-9280.00382).

Chalbi and colleagues studied grouping through coordinated visual changes, including luminance and size. Their tasks support the possibility that related changes can be perceived as a group, with context-dependent effects. They do not show that these bars improve waiting or reading. Both moving conditions here already share a rhythm, so the experiment does not isolate that grouping mechanism. [Primary paper](https://arxiv.org/html/1908.00661).

Fluent recommends skeletons for known structure and consistent high-level information when content varies. It suggests a different indicator when structure is unknown. The adaptation is therefore limited: the application owns an answer area, but the five bars do not preview exact answer lines. Whether readers nevertheless infer a line count is a risk to measure. [Fluent 2 Skeleton guidance](https://fluent2.microsoft.design/components/web/react/core/skeleton/usage).

Carbon distinguishes restrained motion for routine work from more expressive motion for occasional significant moments. That informs a quiet pulse and a brief completion outline, but does not establish 4.8 seconds or 260 ms as optimal. W3C technique C39 describes respecting reduced-motion preferences; the prototype also retains pause and motion-off controls. These are design and accessibility guidance, not reader-effect experiments. [Carbon Motion](https://carbondesignsystem.com/elements/motion/overview/), [W3C C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39).

No cited source proves a dopamine response, a useful Zeigarnik effect from incomplete text, a peak-end gain from the outline, or a faster reading experience. The completed answer may still be incorrect. Presentation must not make poor answers appear verified.

## 4. The source and formatting boundaries are unchanged

The original 60 recordings use 128 steps for 128 positions: one commitment per step. They contain parallel predictions but no simultaneous multi-token commitments. Four later experimental recordings use 32 steps for 128 positions, committing four positions per step, including eventual end/padding positions. Their retained outputs include repetition, “Avoid enough caffeine” and numerical gibberish. These are source-process observations, not a quality benchmark. [Capture documentation](../data/experiments/README.md), [causal replay audit](../data/experiments/parallel-replay-audit-2026-09-09.json).

Formatting sometimes appears before neighboring words. In the original corpus, 32 of 36 retrospectively identified list markers preceded their first body word's last token, while only 45 of 138 newlines preceded both neighboring words' last tokens. Neither statistic means the whole layout was available first. An isolated `1.` can still become a decimal. [Structure audit and definitions](../data/experiments/structure-timing-2026-09-09.json).

An application-owned three-field form can reserve those actual fields before generation. A decoder-enforced schema may guarantee specific structural facts. A prompt requesting three bullets does not guarantee compliance, final line lengths or independent item finality. The current bars require none of those guarantees because their five rows are an authored loading composition, not five predicted text rows.

The reducer controls release: a committed end reached by the contiguous prefix, a valid explicit finish, or an explicitly final snapshot establishes finality. Punctuation, guessed EOS, stop, error, confidence and animation phase do not. During generation, the decoration receives no final text, glyph widths or future Markdown tree. At finality, released text appears as one exact span. The occupied area retains an 8 em minimum; long answers can expand it once.

## 5. The wait is a deliberate cost

The unchanged [whole-answer policy report](../data/experiments/answer-policy-cost-2026-09-09.json) covers the original corpus. Across 57 nonempty traces, whole-answer first release is eligible at a median 15.8 seconds. Its paired median additional wait over sentence release is 10.5 seconds; this is not a subtraction of the two policy medians. Three empty answers remain in the 60-output fidelity audit. These reducer measurements do not establish browser legibility or reader preference.

Original traces use synchronized model forward-pass time. The four new recordings use observed capture-loop intervals; those include capture work and are not API latency. Do not compare the two clocks as a model-speed result. The gallery defaults to the new recordings' observed clock. Its 0.5× inspection mode slows source events while leaving the decorative period authored independently.

All eight fresh motion observations explicitly used 0.5× source inspection to expose at least one complete 4.8-second decorative cycle. A roughly four-second observed answer can finish before a full decorative cycle. The report retains captured time separately from the doubled inspection time. This inspection clock does not change the gallery default or represent slower actual inference.

## 6. Proposed reader comparison

Counterbalance matched prompts across still, breathe and reshape, keeping the answer and source clock identical within each comparison. Avoid asking one participant to reread the same answer as the primary task. Include short waits, waits spanning a full cycle, long waits, interruptions and repeat exposure. The public annotated case study is not automatically blinded participant material.

| Hypothesis | Primary comparison | Supporting result | Result that rejects or qualifies it |
| --- | --- | --- | --- |
| A shared pulse communicates ongoing activity | Breathe versus still | Better activity recognition without inflated progress estimates | No benefit, increased distraction or mistaken countdown judgments |
| Length change makes waiting feel more fluid | Reshape versus breathe | Better fluidity or comfort ratings at equal source timing | Pulse alone is preferred, or shape movement is distracting |
| Bars do not falsely preview the answer | All conditions, varied final lengths and formats | Low false confidence in final line count and completion percentage | Readers infer five lines, imminent completion or confidence in correctness |
| Whole-answer arrival justifies its hold | Separate earlier-word versus whole-answer policy test | Useful preference or task benefit at an acceptable measured delay | The same result feels attractive but becomes usable too late |

Record fluidity, distraction, perceived wait, activity interpretation, preference and false-answer acceptance separately. The reshape comparison changes area and total ink as well as contour; report the treatment as a bundle. If a later study seeks a pure contour mechanism, it needs additional controls and a new design.

Pilot the task, choose one primary outcome and a smallest useful effect, then power and preregister the confirmatory study. No participant count or outcome is invented here. Include reduced-motion and assistive-technology sessions; a static preference is a legitimate finding.

## 7. Fresh validation and alternatives

The [fresh machine-readable report](skeleton-motion-validation-2026-09-09.json) identifies material `solid-rounded-skeleton-v1` and fingerprints the implementation, measurement scripts and source fixtures. It contains eight sequential Chromium 148 observations: still, breathe and reshape using the same short-list capture at 390 and 1380 px widths, plus two 390 px reshape cases with long and poor-output text. These are instrumented engineering observations, not a randomized performance or reader study.

| Observation | Fresh result and scope |
| --- | --- |
| Completed text | All eight cases produced one exact nonempty text update, with no pre-final text and no blurred, faded or transformed final-text frames |
| Reading position | 9,648 matched samples of final words' first characters showed 0 px displacement after arrival, relative to the first final frame and answer surface; this does not measure every glyph |
| Loading geometry | Bar height and occupied loading height remained fixed; visible rounded contours were measured separately from unchanged layout rectangles |
| Final layout change | The narrow long explanation grew its occupied frame from 120 to 219.375 px: +99.375 px when the answer first appeared |
| Contour movement | Maximum changing visible-edge displacement was 0.3113467 px between sampled frames across these sequential observations; this is a geometry diagnostic, not a physical-device performance result |

Both moving treatments exhibited a complete bounded opacity cycle; reshape also reached its authored rounded-inset range. All observations used explicitly labeled 0.5× source inspection while the decorative cycle remained 4.8 seconds. The [list recording](../public/study/skeleton-answer-mobile.webm) and [long-answer recording](../public/study/skeleton-answer-long.webm) are actual browser recordings at that half-speed inspection setting. They are not recordings of production API latency.

Fresh verification passed 327 unit/component cases across 40 files and 45 browser checks against a normal production build across Chromium, WebKit and iPhone 14 emulation. Checks include reduced motion, phase preservation, once-only completion, exact final text and automated accessibility. Normal and Pages production builds passed. The exported page passed exact list/explanation replay, solid-material, completion-outline and video-hash checks in the [release record](skeleton-release-verification-2026-09-09.md). Physical iPhone, assistive-technology sessions and reader outcomes remain unvalidated.

Future material changes must repeat these checks and retain their provenance. Stable completed text does not imply zero layout change at arrival, and automated accessibility checks do not establish complete accessibility. Do not reuse `05914c1` geometry or test totals for a later material.

Static and breathe remain meaningful alternatives if reshape offers no benefit. A conventional traveling shimmer is prior art, not the current condition. The feathered composition, continuous ink field and per-token interval layout remain historical explorations. The [skeleton implementation handoff](skeleton-handoff-2026-09-09.md) gives exact parameters, code boundaries and continuation instructions.

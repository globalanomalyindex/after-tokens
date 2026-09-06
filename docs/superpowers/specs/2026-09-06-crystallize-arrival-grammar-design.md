# Crystallize: an arrival grammar for diffusion text

**Design spec for the ground-up redesign of After Tokens**

| | |
|---|---|
| Date | 2026-09-06 |
| Status | Design locked, implementing |
| Author | Christopher Robin Fiore (product designer / design engineer), with Claude as design and engineering partner |
| Portfolio theme | Looking to nature for answers |
| Supersedes | `2026-05-27-diffusion-text-animation-design.md` (four nature modes), `docs/redesign.md` sections 4 to 6 (the reward grammar) |

---

## 1. The question

How do we make diffusion text rendering clean, simple, beautiful, and brand-able, using psychological principles such as the Zeigarnik effect, gestalt closure, and the peak-end rule, so that the same answer feels better to read through presentation alone?

The question has a hidden premise worth stating: the words are fixed. A diffusion language model produces a full answer, and the interface decides in what temporal shape that answer reaches the reader. Every shape is a design. The typewriter is one shape. A fade is another. The sampler's own commit order is a third. The question asks which shape reads best, and how a product can own that shape without breaking it.

## 2. Diagnosis of the current system

The shipped piece (commit ff07f88) has real strengths: a typed engine, sixty recorded sampler trajectories, an audit of every run, and a ledger that traces each decision to a principle. Reviewed against the question, it has four structural problems.

1. **Many levers, no spine.** Nineteen glossary terms, six reward levers, twenty ledger rows, four authored modes plus a recorded one. A reviewer cannot hold the argument in one hand. Clean and simple means one model with a few primitives.
2. **Four metaphors dilute the system.** Fog, aurora, mitosis, and mycelium are four separate reveals. Brand-ability was argued by multiplying modes, which is the opposite of a system. A brand-able system is one grammar with a tunable voice.
3. **The psychology is cited rather than operationalized.** Principles justify decisions after the fact. Nothing measures whether a given reveal has the property a principle names. Nobody can say how many open loops the reveal holds at second two, or where its peak is. Research grade means the properties are computable, so any reveal (typewriter, fade, sampler, ours) can be scored on the same axes.
4. **The chrome competes with the work.** Custom cursor with marching ants, registration crosshairs, section spines, corner glyphs, an exoskeleton frame, a drafting grid, a rainbow title, per-letter colored words, chips in nineteen hues, an eyebrow on every section. The reveal is the design; the page should get out of its way.

One more, from the piece's own close section: reading order is a real cost. The parafoveal preview argument predicts that text arriving out of order inside the reading zone slows the reader. The current reveal accepts that risk and defers it to a study. The redesign resolves it structurally (section 5.3).

## 3. The idea: arrival is a design object with a measurable psychological shape

The same text can arrive in infinitely many temporal shapes. Call the shape of one reveal its **arrival**. An arrival is fully described by one number per word: the time it becomes legible. From that vector, and from the text's phrase structure and salience, four properties follow, each grounded in one mechanism from the psychology of reading and reward. Together they are the **arrival profile**.

| property | mechanism | what it measures | the design rule it yields |
|---|---|---|---|
| tension | Zeigarnik effect (Zeigarnik, 1927); working-memory span for open goals | how many phrases are partly settled at once, over time | hold one or two open loops at a time; never more than three |
| closure | gestalt closure (Wertheimer, 1923); the aha effect (Topolinski and Reber, 2010) | how often a step completes a perceptual whole, and how many wholes complete on the way | batch commits so that each step tends to close a phrase; many small closures before the whole |
| peak and end | peak-end rule (Kahneman et al., 1993); duration neglect | where the most intense moment falls, and how the run ends | put the peak where the gist lands, early; end on one quiet completion |
| fluency | processing fluency (Reber, Schwarz and Winkielman, 2004); parafoveal preview (Rayner, 1998) | whether crisp text ever changes, and whether words become legible in reading order inside a phrase | nothing crisp before commit; crisp text never changes; legibility in reading order within a phrase |

The claim that makes this novel: **a reveal can be designed by shaping these four properties directly**, and any reveal, including ones nobody designed, can be scored on them. The profile turns "psychology-inspired" into "psychology-specified." The study that follows tests whether the specification predicts what readers feel.

### 3.1 Definitions (the metric suite, `lib/arrival/`)

Inputs: the word list with line index and salience (`lib/diffusion/salience.ts`), a lock time per word, and the run's total duration.

**Phrases.** A phrase is the perceptual unit of closure. Segmentation: a line break starts a phrase; a list marker starts a phrase; a word ending in `. ! ? ; :` ends a phrase; a word ending in `,` ends a phrase when the phrase already holds three or more words; a phrase longer than eight words splits into even chunks. Deterministic, language-naive, and stated as a limit (English and Latin script).

**Tension.** A phrase is *open* when some but not all of its words are settled. `openLoops(t)` is the count of open phrases at time t. Report the maximum and the time-weighted mean over the active interval (first lock to last lock).

**Closure.** A phrase *closes* at the lock time of its last word. Locks cluster into *steps* (gaps over 60 ms separate steps). Report the closure count, the share of steps that close at least one phrase (alignment), and the largest single closure as a share of the words.

**Peak and end.** Intensity at time t is the salience-weighted count of locks in the 400 ms window ending at t (the Doherty window), divided by the window. Report the peak's position as a share of the run, the gist time (when the top fifth of words by salience are all settled) as a share of the run, and the end weight (mean intensity over the last 15 percent of the run, divided by the mean over the whole run).

**Fluency.** Report the share of within-phrase word pairs that become legible out of reading order (inversions), and Kendall's tau between legibility order and reading order across the whole answer. The two numbers together state the two-scale claim: tau well below one means the answer arrives out of order at the phrase scale; zero inversions means every phrase reads left to right.

### 3.2 Reference arrivals

The profile is computed for eight arrivals of the same text at the same total duration, so the comparison is fair:

- **typewriter**: reading order, one word per step, linear
- **fade**: every word becomes legible at the end, after a uniform blur-to-crisp ramp
- **scatter**: uniformly random order, linear cadence
- **fog, aurora, mitosis, mycelium**: the four earlier authored modes, scored on the profile
- **crystallize**: the shipped grammar
- and the recorded sampler runs (medians per configuration), scored on the same axes, with the two-channel transform (section 5.3) applied and not applied

Every number that reaches the page is generated into `lib/traces/arrival.json` by `pnpm traces:arrival` and read through `lib/traces/findings.ts`, which stays the only source the copy may cite.

## 4. What a real sampler does (unchanged, condensed)

The sixty recorded trajectories and the LLaDA-8B corroboration stand as captured. Three findings drive the grammar and the rest move to the research note:

1. Commit order is local growth from anchors. Half of consecutive commits land on a neighbor; a fresh anchor opens about every four commits (schedule-free sampler). The grammar's order model is this growth process, under a tension budget.
2. The answer's length is known late (the tail commits at the 92 to 95 percent mark). The grammar draws the answer's extent from the start as open slots; it never claims the sampler knew the length early.
3. Confidence at commit varies (median 0.57; 38 percent under even odds). The grammar carries confidence in the settle beat and in resting opacity, in the recorded mode only.

## 5. The grammar: crystallize

Nature anchor: **crystallization**. A supersaturated solution does not crystallize everywhere at once. Nucleation is rate-limited: a few sites form, each crystal grows locally along its lattice, grains meet at boundaries, and the finished crystal is ordered and still. Each stage maps to a property of the profile: nucleation-limited growth is the tension budget; lattice growth is reading order within a phrase; grain boundaries meeting are closures; the still crystal is the fluent end state. "The answer crystallized" is already the idiom people reach for.

### 5.1 Order: nucleation-limited growth

- **Budget.** At most `K` phrases are open at once. `K = 2` is the grammar's constant. The demo exposes `K` in {1, 2, 3, unbounded} so a viewer can feel the difference; `K = unbounded` is the earlier mycelium behavior, kept as the comparison.
- **Seeds.** The first `K` phrases to open are chosen by salience (phrase salience is the maximum word salience in it), spread across the answer (the second seed is the most salient phrase in the half the first seed did not take). When a phrase closes, the next most salient unopened phrase opens, preferring the largest open gap. So the gist opens first, wherever it sits, and the connective tissue opens last.
- **Nucleus.** When a phrase opens, its most salient word ghosts at once (the forming state: the final word, steady, still short of readable). It is the reason the phrase opened, shown as a belief. Crisp legibility then proceeds from the phrase's first word in reading order; the nucleus snaps when the front reaches it.
- **Growth.** Each step advances every open phrase by its share of the step's words, in reading order. A phrase whose remaining words fit in its share plus one takes all of them, so steps end on closures.

### 5.2 Cadence, lock, peak, end

- **Pre-roll** 320 ms: the answer's extent is on screen (slots at final width, illegible noise) before anything locks.
- **Steps** about twenty per answer, 140 to 260 ms apart, linear on average, with a long-short swing (default 8 percent) from the brand voice. Within a step, words land across a 70 ms spread in reading order.
- **Forming lead.** A word ghosts one step before it locks. The ghost is the final word and never changes.
- **Lock.** Crisp at once (filter 110 ms), heavier, a settle sized to confidence (recorded mode) or to salience (authored mode), a halo that is gone within 900 ms.
- **Peak.** The gist words land in the first stretch by construction (seeds are chosen by salience), and a gist lock settles harder. The intensity curve peaks where the meaning arrives.
- **End: the exhale.** At the last lock, after 420 ms, the field quiets once: slot markers fade, weights equalize over 700 ms, the answer reads finished. No wave, no pulse. The ending is completion, calm and clean.

### 5.3 The two-channel reveal (recorded mode)

The recording contributes the sampler's order, timing, and confidence. Rendering every commit crisp the moment it lands puts crisp text to the right of the eye in an order the eye cannot read, which is the parafoveal cost. So the render splits the signal into two channels:

- **state channel**: a word ghosts the moment its tokens commit (settled, steady, waiting)
- **reading channel**: a word becomes crisp only when every word before it in its phrase is crisp, at least 40 ms after the previous one

`withReadingOrder(strategy, phrases)` is a pure timeline transform. The sampler's order survives in the state channel (tau stays what it was); the reading channel has zero inversions inside phrases. The lag between commit and legibility is measured on the curated runs and reported. This is the structural answer to H2.

### 5.4 What is retired, and the measured reason

- fog, aurora, mitosis: scored on the profile; each fails at least one property (fog and aurora hold every phrase open at once during their sweep; mitosis scatters). They stay in the repository as reference arrivals.
- mycelium's unbounded seeding: opens five or more loops at once; over the tension budget.
- the closing wave and the whole-field pulse: a flourish at the end where the peak-end rule wants completion.
- the halo left on every locked word, the phi cadence, the glass sweep: retired earlier, still retired.
- the four hand-built specimens, the decode glyph styles, the hue wheel: each was a separate animation; the voice tokens replace them with one grammar.

## 6. Brand voice

A brand does not get a new reveal. It gets a **voice** on the one grammar: six tokens with ranges that keep every property of the profile inside its rule.

| token | range | what it changes | the invariant it cannot break |
|---|---|---|---|
| tempo | 0.7 to 1.4 | scales the cadence | step intervals stay inside 100 to 390 ms (Doherty) |
| attack | 90 to 280 ms | the lock's snap to crisp | never gradual enough to lose the aha |
| weight | 0 to 1 | how much heavier a settled word gets (400 to 700) | the frontier between settled and open stays visible |
| glow | 0 to 1 | halo strength at lock | gone within a second |
| hush | 0 to 1 | how dim the open field rests | pending text stays illegible (blur is fixed) |
| swing | 0 to 0.12 | long-short syncopation of steps | average rate stays linear |

The tension budget `K`, the phrase segmentation, the forming lead, and the exhale are grammar, outside the voice. Five brands ship as presets: after-tokens (cool, snap, medium weight), halcyon (slow, soft attack, low glow, serif), felt (warm, high glow, heavy), pulse (calm hush, mid), voltage (fast, snap, heavy, no glow, mono).

## 7. The site

Eight sections, one accent, calm chrome. Industry-standard case study order: context, problem, insight, evidence, solution, system, validation, next.

| id | section | what the reader sees |
|---|---|---|
| hook | the answer crystallizes | title, one line, role and year; a real answer settling in a dark stage |
| problem | same words, three arrivals | typewriter, fade, crystallize on one clock, one replay, a profile readout under each |
| profile | arrival has a shape | the four properties, one sentence of psychology each; eight lock maps with their numbers |
| sampler | what a real sampler does | the recorded replay with the two-channel toggle, the live unmask map, three findings, a link to the note |
| grammar | crystallize, decision by decision | the live reveal with a live profile readout; the budget control; eight decisions grouped by property |
| voice | one grammar, five voices | a prompt picker, a brand picker, and the voice tokens as sliders inside their ranges |
| evidence | what is measured, what is claimed | five hypotheses a study can break, the study design, what was cut and why, limits |
| open | further exploration | the structured answer (weather), live sampler wiring, saliency model, non-Latin scripts; colophon |

**Visual system.** Surface bone, ink, dark stages as inserts (unchanged identity). One accent, cobalt, `oklch(0.5 0.19 262)`, the original spec's accent, restored; on stages the lock glow is a cool white. Display type Sligoil Micro (unchanged). Body type moves from JetBrains Mono to Instrument Sans for reading; mono stays for readouts and numbers. Lowercase editorial voice stays. Removed: the custom cursor, registration marks, section numerals, spines, corner glyphs, the exoskeleton frame, the drafting grid, cycling section accents, rainbow lettering, the marching-ants chips. Kept: the section rail (labels), the mobile progress hairline, the scroll-driven heading rise, nature-colored words at one place in the piece.

**Motion.** The reveals are the motion. Chrome motion is limited to entrances under 400 ms with exponential ease-out and the heading rise. Reduced motion resolves every reveal at once and keeps the status text.

## 8. Engineering

- `lib/arrival/phrases.ts`: segmentation. `lib/arrival/profile.ts`: the metric suite. `lib/arrival/references.ts`: typewriter, fade, scatter, and adapters for the existing modes and recorded traces. `lib/arrival/reading-order.ts`: the two-channel transform. Tests for each.
- `lib/diffusion/modes/crystal.ts`: the grammar (`crystal`, `crystalWith({ budget, swing })`). `lib/diffusion/modes/typewriter.ts`, `fade.ts`: reference strategies that share crystal's duration.
- `lib/brand/types.ts`, `brands.ts`, `provider.tsx`: `voice` tokens, clamped, mapped to `--voice-*` CSS variables.
- `components/diffusion/diffusion-text.tsx`: modes `crystal | typewriter | fade | mycelium | fog | aurora | mitosis | trace`; a `voice` prop (default from the brand); `--p` written for the fade; `data-settled` for the exhale; `onWordStates` for the live readout. The decode glyph styles are removed.
- `components/arrival/`: `LockMap`, `ProfileReadout`, `ProfileCard`, `SameWordsThreeArrivals`.
- `tests/arrival/report.test.ts`: writes `lib/traces/arrival.json` when `ARRIVAL_REPORT=1` (`pnpm traces:arrival`); asserts the invariants otherwise.
- Sections rebuilt under `components/sections/`; `app/globals.css` rewritten; e2e specs updated to the eight ids.

## 9. Validation

Five claims a study can break, with the recorded trajectories and the reference arrivals as stimuli:

- **H1 state legibility.** Interrupted at matched timestamps, readers identify which words are settled more accurately under crystallize than under a uniform fade.
- **H2 reading cost.** Reading time of the final answer after crystallize is no worse than after a typewriter. The two-channel reveal is the mechanism; if the cost remains, the design falls back to reading order at the phrase scale too.
- **H3 trust calibration.** Readers' confidence in individual words tracks commit probability under the confidence-scaled render and does not under a uniform one.
- **H4 felt quality.** The same answer at the same duration is rated more satisfying after crystallize than after a typewriter or a fade.
- **H5 tension budget.** Satisfaction rises from `K = 1` to `K = 2` and falls at `K = unbounded`, tracking the Zeigarnik span.

None of these has been measured on this prototype. The profile numbers describe the arrivals, never the readers.

## 10. Further exploration

- a saliency model in place of the authored score, so the nucleus is the model's own surest token
- wiring the grammar to a live sampler's step callback (the trace strategy already consumes that shape)
- structured answers: the weather widget shows the contract carrying color, data, and layout; the profile has no definition for non-text atoms yet
- scripts and languages where the phrase and the word are different units
- haptics on the closures and the exhale, on devices that expose them

## 11. Deliverables

The redesigned site on the branch, the engine and metric library with tests, the generated profile numbers, the written case study (`docs/case-study.md`), the design record (`docs/redesign.md` rewritten), an addendum to the research note, and the readme.

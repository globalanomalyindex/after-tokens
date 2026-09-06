# After Tokens: an arrival grammar for diffusion text

**A product design and engineering case study**

| | |
|---|---|
| Role | Product design, interaction design, prototyping, front-end engineering (solo, with Claude as design and engineering partner) |
| Timeline | May to September 2026 |
| Status | Working prototype; a five-claim user study designed, its stimuli shipped |
| Live | https://after-tokens.vercel.app · source: https://github.com/globalanomalyindex/after-tokens |

## Overview

Diffusion language models produce a whole answer and refine it in parallel. The words are fixed before the interface draws a single one, so the interface chooses the temporal shape in which the answer reaches the reader. Every chat product ships one shape, the typewriter, inherited from models that write one token at a time.

After Tokens asks what shape an answer should arrive in, and answers with a system: a way to measure any reveal on four properties from the psychology of reading and reward, one reveal grammar built to keep all four inside their rules, and a brand voice that colors the grammar without breaking it. The claim under test is that the same words, at the same duration, read as a better answer through presentation alone.

## The challenge

The brief was a question with a hidden premise. *How do we make diffusion text rendering clean, simple, beautiful, and brand-able, using psychological principles such as the Zeigarnik effect, gestalt closure, and the peak-end rule, so that the same answer feels better to read through presentation alone?* The premise is that the words are fixed and the arrival is free. That makes the arrival a design object, and design objects can be specified, measured, and owned.

Three constraints shaped the work.

1. **Honesty about the model.** A reveal that pretends to know what the sampler knows is worse than a typewriter. Every visual claim about model state had to trace to a real signal or say it was authored.
2. **Reading cost.** Text arriving out of order inside the reader's field of view could slow reading. The parafoveal preview literature predicts it. The earlier prototype deferred this risk to a study; the redesign had to resolve it structurally.
3. **A system, one grammar.** The earlier prototype argued brand-ability by shipping four nature-themed reveals. Four reveals are four products. A system is one grammar with a tunable voice.

## Research

### What a real sampler does

Sixty denoising trajectories were recorded from a real masked diffusion language model (Qwen3 0.6B adapted with the MDLM objective, greedy, on an Apple M3) across twenty prompts and three sampler configurations, with a four-run LLaDA-8B corroboration set. Three findings drive the grammar:

- Commit order is local growth from a few confident anchors. Half of consecutive commits land beside the previous one; a fresh anchor opens about every four commits under the schedule-free sampler.
- The answer's length is known late: the end-of-sequence tail commits at the 92 to 95 percent mark.
- Confidence at commit varies: median probability 0.57, and 38 percent of commits under even odds.

A finding that constrains everything else: before a position commits, the model's provisional guess for it changes a median of 5.3 times. A legible draft would show most words wrong before showing them right. Uncommitted text has to stay illegible.

### What a reader needs

Four mechanisms from cognitive science, each with a design rule:

| mechanism | source | what it says | the rule |
|---|---|---|---|
| Zeigarnik effect | Zeigarnik, 1927 | open loops hold attention; too many overwhelm | one or two open loops at a time |
| gestalt closure, aha effect | Wertheimer, 1923; Topolinski and Reber, 2010 | a whole completing is felt; a sudden one is felt as insight | many small closures before the whole; snap, never sharpen |
| peak-end rule | Kahneman et al., 1993 | an experience is remembered by its most intense moment and its end | peak at the gist, end on completion |
| parafoveal preview, processing fluency | Rayner, 1998; Reber, Schwarz and Winkielman, 2004 | the eye samples the next word early; ease is felt as liking | crisp text never changes; inside a phrase, reading order |

## The insight: arrival is a design object

An arrival is one number per word, the time it becomes legible. From that vector, the phrase structure, and each word's salience, four properties follow, one per mechanism. Together they are the **arrival profile**:

- **Tension**: how many phrases are partly settled at once (maximum and time-weighted mean).
- **Closure**: how many phrases complete, and how often a step of locks completes one.
- **Peak and end**: where salience-weighted intensity peaks, when the gist is fully legible, and how heavy the last stretch is.
- **Fluency**: within-phrase inversions, order at the phrase scale (Kendall's tau), and a reader model: one fixation per 250 ms, charged when the next word is still illegible at the end of a fixation.

The profile scores any reveal, whether or not anyone designed it. That turns psychology-inspired into psychology-specified, and it let the redesign put numbers on what it kept and what it cut.

## Design principles

1. **Design the arrival by its profile.** Shape the four properties directly; let the visuals follow.
2. **One grammar, many voices.** Brand expression is a set of tokens with ranges that keep the profile inside its rules.
3. **State fidelity.** A lock carries sampler state only when a real signal drives it; authored timing says so.
4. **The reveal is the design.** The page gets out of its way.

## The solution: crystallize

The nature anchor is crystallization. A supersaturated solution nucleates at a few sites; each crystal grows along its lattice; grains meet at boundaries; the finished crystal is ordered and still. Each stage is one property: rate-limited nucleation is the tension budget, lattice growth is reading order inside a phrase, grains meeting are closures, the still crystal is the fluent end.

**Order.** At most two phrases are open at once. The next phrase opens by salience, pulled toward the untouched part of the answer, so the gist opens first wherever it sits and the connective tissue opens last. When a phrase opens, its most salient word (the nucleus) turns crisp the same step, ahead of the words before it; crisp legibility then proceeds from the phrase's first word. Every front advances every step, and a phrase whose remainder fits the step takes all of it, so steps end on closures.

**Cadence.** A 320 ms pre-roll while the answer's extent appears as illegible slots at final width; about twenty steps 140 to 260 ms apart, linear on average because the recorded cadence is linear, with an eight percent long-short swing; a word ghosts one step before it locks, and the ghost is the final word.

**Lock, peak, exhale.** A lock is crisp at once, heavier, with a settle sized to salience (or to commit probability in the recorded mode) and a halo gone within a second. The nucleus settles hardest: the peak is where the meaning arrives. After the last lock, the field quiets once. No wave, no pulse.

**The two-channel reveal.** For a recorded sampler run, the render splits the signal: in the state channel a word ghosts the moment its tokens commit; in the reading channel a word becomes crisp only when every word before it in its phrase is crisp, the phrase's earliest commit kept as its anchor. The sampler's order survives; no phrase reads out of order.

### By the numbers

Medians over the eight fixtures at matched durations:

| arrival | loops at most | reader waits | order at the phrase scale (τ) | end weight | closure-aligned steps |
|---|---|---|---|---|---|
| typewriter | 1 | 0% | +1.00 | 1.02× | 18% |
| fade | 0 | 0% | 0.00 | 6.44× | 100% (one step) |
| scatter | 4.5 | 14% | +0.03 | 1.07× | 18% |
| mycelium (earlier growth mode) | 4.5 | 19% | +0.19 | 0.86× | 34% |
| **crystallize** | **2** | **0%** | **+0.13** | **0.83×** | **36%** |

The grammar holds two loops at most, makes no reader wait, arrives out of order at the phrase scale, closes a phrase on twice as many steps as a typewriter, peaks at 28 percent of the run, and ends at 0.83 of the mean intensity. On the eighteen curated recorded runs the two-channel reveal makes legibility trail commitment by a median of 540 ms on the 36 percent of words that wait, and drops out-of-order pairs inside phrases from 22 percent to 6 percent, all anchors.

## The system: a brand voice

A brand does not get a new reveal. It gets six tokens on the one grammar, each inside a range that is an invariant:

| token | range | keeps |
|---|---|---|
| tempo | 0.7 to 1.4 | every step inside 100 to 390 ms |
| attack | 90 to 280 ms | the lock never gradual enough to lose the aha |
| weight | 0 to 1 | the frontier between settled and open visible |
| glow | 0 to 1 | the halo gone within a second |
| hush | 0 to 1 | pending text illegible; only brightness moves |
| swing | 0 to 0.12 | the average rate linear |

The tension budget, the phrase segmentation, the forming lead, and the exhale are grammar, outside the voice. Five presets ship: After Tokens (cool, snap), Halcyon (slow, soft, serif), Felt (warm, heavy, glowing), Pulse (calm), Voltage (fast, snap, heavy, no glow, mono).

## Process and decisions

- **Four metaphors to one grammar.** Fog, aurora, mitosis, and mycelium were scored on the profile. Fog and aurora hold every phrase open through their sweep and end at 2.9 and 1.8 times the mean intensity; mitosis scatters inside phrases; mycelium opened 4.5 loops at once. They stay in the repository as reference arrivals.
- **The trade the budget makes.** Mycelium bought the earliest gist of any arrival, 56 percent of the run against crystallize's 68, at the cost of 4.5 open loops and reader waits on 19 percent of fixations. The budget trades a tenth of the run for calm. The fifth claim tests whether the trade is right.
- **The anchor.** Strict reading order inside a phrase made the reader wait (26 percent of fixations at the median) because two fronts split the step's words. Locking each phrase's nucleus first, then reading order, brought waits to zero and kept the gist-first feel.
- **The exhale replaced the wave.** The earlier reveal ended on a whole-field wave. The peak-end rule wants completion; the redesign ends on a quiet settle.
- **The chrome went.** A custom cursor, registration marks, section numerals, spines, a drafting grid, a rainbow title, chips in nineteen hues. Body type moved from a monospace to a reading grotesk.

## Validation

Five claims a study can break, with the stimuli shipped:

- **H1 state legibility.** Interrupted at matched timestamps, readers identify settled words more accurately under crystallize than under a uniform fade.
- **H2 reading cost.** Reading time after crystallize is no worse than after a typewriter.
- **H3 trust calibration.** Readers' confidence in words tracks commit probability under the confidence-scaled render.
- **H4 felt quality.** The same answer at the same duration is rated more satisfying after crystallize than after a typewriter or a fade.
- **H5 tension budget.** Satisfaction rises from one loop to two and falls when the budget is removed.

Within subjects; text, geometry, and duration held constant; order randomized; interruptions at matched timestamps; reading time of the final answer; per-word confidence ratings against recorded probabilities; satisfaction and quality ratings after each arrival.

## Impact and limits

What shipped: a typed engine, a metric suite that scores any reveal, a grammar whose every decision traces to a property, a voice system with stated invariants, sixty recorded trajectories with an audit of every run, and a study design with its stimuli. What did not: any measurement of a reader. The profile measures arrivals; the trajectories measure a sampler. The phrase rule is language-naive, the salience score is authored, the reader model is one number, and the strongest argument against the approach, that out-of-order arrival costs reading time, stands until the study runs.

## Reflections

The redesign's turn was to stop justifying decisions with psychology and start specifying them by it. Once an arrival had a profile, the argument about which reveal was better became an argument about numbers, and the numbers said things the eye had missed: that the most beautiful of the earlier modes held five loops open, that strict reading order made a reader wait, that the ending was a flourish where the rule wanted completion. The grammar that survived is simpler than any of the four it replaced, and it is the first version whose claims can be broken.

## Further exploration

A saliency model in the nucleus; a live sampler on the other end of the trace contract; a profile for structured answers; other scripts where the phrase and the word are different units; haptics on closures and the exhale.

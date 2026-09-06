# The arrival grammar, reasoned from the ground up

This is the design record for the redesigned reveal: the argument in the order it was made, from the question to the engine. Every number cited here is generated into `lib/traces/arrival.json` by `pnpm traces:arrival` and read through `lib/traces/findings.ts`, or comes from the recorded trajectories in `data/traces/`. The earlier record (four nature modes, the reward grammar, the ledger of twenty decisions) is in the git history at commit ff07f88; this record supersedes it.

## 1. The question, and what it hides

How do we make diffusion text rendering clean, simple, beautiful, and brand-able, using psychological principles such as the Zeigarnik effect, gestalt closure, and the peak-end rule, so that the same answer feels better to read through presentation alone?

The premise worth stating: the words are fixed. A diffusion model produces a whole answer and refines it in parallel, so the interface chooses the temporal shape in which the words reach the reader. Every shape is a design. The typewriter is one. A fade is one. The sampler's own commit order is one. The question asks which shape reads best, and how a product can own it without breaking it.

## 2. Diagnosis of the earlier build

Reviewed against the question, the shipped piece had four structural problems. Many levers and no spine: nineteen glossary terms, six reward levers, twenty ledger rows, four authored modes and a recorded one. Four metaphors diluting the system: brand-ability argued by multiplying modes, which is the opposite of a system. Psychology cited rather than operationalized: principles justified decisions after the fact, and nothing could say how many open loops a reveal held at second two. And chrome competing with the work: a custom cursor, registration marks, spines, a grid, chips in nineteen hues. One more, admitted in the piece's own close: reading order is a real cost the earlier reveal deferred to a study.

## 3. Arrival as a design object

An arrival is one number per word: the time it becomes legible. From that vector, the phrase structure, and each word's salience, four properties follow, each grounded in one mechanism. Together they are the arrival profile (`lib/arrival/profile.ts`), and any reveal can be scored on it.

- **Tension** (Zeigarnik, 1927). Open phrases over time: the maximum and the time-weighted mean. Rule: one or two at a time, never more than three.
- **Closure** (Wertheimer, 1923; Topolinski and Reber, 2010). Closures, lock clusters as steps, the share of steps that complete a phrase. Rule: batch commits so a step tends to close a phrase.
- **Peak and end** (Kahneman et al., 1993). Salience-weighted intensity in the 400 ms attention window, the peak's position, the gist time, the end weight. Rule: peak at the gist, end quiet.
- **Fluency** (Rayner, 1998; Reber, Schwarz and Winkielman, 2004). Within-phrase inversions, Kendall's tau at the answer scale, and a reader model: one fixation per 250 ms, charged when the next word is still illegible at the end of the fixation. Rule: nothing crisp before commit, crisp text never changes, inside a phrase one crisp anchor then reading order.

A phrase is the perceptual unit of closure: a line break or a list marker starts one, terminal punctuation ends one, a comma ends one after three words, and eight words is the cap. Stated as a limit for English and Latin script.

## 4. What the profile said about the earlier arrivals

Scored over the eight coda fixtures at matched durations: the typewriter holds one loop, makes no reader wait, and reads in order at every scale (tau +1). The fade holds no loop and lands 6.4 times the mean intensity in its last stretch. The scatter opens 4.5 loops at the median and makes a reader wait on 14 percent of fixations. Fog and aurora hold every phrase open through their sweep and end at 2.9 and 1.8 times the mean. Mitosis scatters inside phrases. Mycelium, the earlier growth mode, opened 4.5 loops at once and made a reader wait on 19 percent of fixations; it bought the earliest gist of any arrival, 56 percent of the run. That trade is the one the redesign had to decide.

## 5. The grammar: crystallize

Nature anchor: crystallization. A supersaturated solution nucleates at a few sites; each crystal grows locally along its lattice; grains meet at boundaries; the finished crystal is ordered and still. Rate-limited nucleation is the tension budget. Lattice growth is reading order inside a phrase. Grains meeting are closures. The still crystal is the fluent end.

**Order.** At most two phrases are open at once; that is the grammar's constant. The next phrase to open is the most salient one left, pulled toward the part of the answer nothing has touched, so the gist opens first wherever it sits and the connective tissue opens last. When a phrase opens, its most salient word (the nucleus) locks the same step, ahead of the words before it, and crisp legibility then proceeds from the phrase's first word. Every open front advances every step, never fewer words per step than fronts, and a phrase whose remaining words fit in its share plus one takes all of them, so steps end on closures.

**Cadence.** A 320 ms pre-roll while the extent appears, about twenty steps 140 to 260 ms apart, linear on average because the recorded cadence is linear, an eight percent long-short swing from the voice, a 70 ms spread inside a step in reading order. A word ghosts one step before it locks; the ghost is the final word and never changes. Pending glyphs churn every 390 ms, the sampler's measured rate.

**Lock, peak, exhale.** A lock is crisp at once, heavier by the voice's weight, with a settle sized to salience (or to commit probability in the recorded mode) and a halo gone within a second. The nucleus settles hardest and its halo lingers longest: the peak is where the meaning arrives. At the last lock, after 420 ms, the field quiets once: slot markers fade, weights equalize over 700 ms. No wave, no pulse.

**The numbers it produces** (medians over the eight fixtures): two loops at most, mean 1.5; no reader waits; 9 percent of within-phrase pairs out of order, all of them anchors; tau +0.13 at the phrase scale; a phrase closed on 36 percent of steps against the typewriter's 18; the peak at 28 percent of the run; the last stretch at 0.83 of the mean. The gist lands at 68 percent of the run, the same as the typewriter's 69; the budget costs the earlier growth mode's tenth of the run, and the fifth claim tests whether calm is worth it.

## 6. The two-channel reveal for recorded runs

A recording contributes the sampler's order, timing, and confidence. Rendering every commit crisp the moment it lands puts crisp text to the right of the eye in an order the eye cannot read. So `withReadingOrder` (`lib/arrival/reading-order.ts`) splits the signal. In the state channel a word ghosts the moment its tokens commit. In the reading channel a word becomes crisp only when every word before it in its phrase is crisp, at least 40 ms after the previous one, with the phrase's earliest commit kept as its one crisp anchor. On the eighteen curated runs at the shaped pace, legibility trails commitment by a median of 540 ms on the 36 percent of words that wait, the answer's total duration barely moves, tau in the reading channel rises from 0.86 to 0.91, and inside phrases the out-of-order pairs fall from 22 percent to 6 percent, all anchors. The transform cannot remove a wait the sampler itself imposes, and the report carries both numbers.

## 7. The voice

A brand gets a voice on the one grammar: tempo (0.7 to 1.4), attack (90 to 280 ms), weight (0 to 1), glow (0 to 1), hush (0 to 1), swing (0 to 0.12). Each range is an invariant: tempo keeps every step inside 100 to 390 ms, attack never softens past the aha, hush never makes a pending word legible, swing keeps the average linear. The budget, the phrases, the forming lead, and the exhale are grammar, outside the voice. Five presets ship.

## 8. What was retired, and why

Fog, aurora, and mitosis (fail the profile; kept as reference arrivals). Unbounded seeding (over the budget). The closing wave and the whole-field pulse (flourishes where the rule wants completion). The four hand-built specimens and the glyph styles (separate animations where a system needs one). The drafting chrome (the reveal is the design). The body face moved from a monospace to a reading grotesk, for the same reason the piece exists: the same words read better with a better presentation.

## 9. What is authored and what is measured

The order model's shape, the cadence bounds, the churn rate, the guess floor, the confidence scaling, and the phrase and reader models' constants are fitted to or set by the data and the literature. The blur radius, the opacity floor, the settle sizes, the spread, the swing, the recede range, the gap bonus, and the exhale timing are tuned by eye and labeled so. The profile numbers describe arrivals. Nothing here shows that the reveal helps a reader; that is what the five claims and the study are for.

# The reveal, reasoned from the ground up

This is the design record for the shipped reveal: the argument in the order it was actually made, from the problem to the engine. Every number cited here lives in `lib/traces/findings.ts` and is reproducible from `data/traces/`.

## 1. The problem, stated without the animation

A masked diffusion language model holds a full-length field of positions. At every denoising step each position is either committed or open, and every open position carries a belief. A sampler commits some positions per step under a rule (confidence ranked, or random) and a schedule (blocks, or none). The answer's content, order, and length all emerge over the run.

A person watching that happen needs three things at a glance: how far along the answer is, which parts are settled, and how much to trust the settled parts. They need them without paying a reading-time penalty for having watched. That is a legibility and trust problem. Animation is the medium it is solved in.

## 2. What a real sampler does

Sixty recorded trajectories (one 0.6B model, three samplers, greedy) and a four-run 8B corroboration set say:

1. Under the default block schedule the order is nearly sequential (τ +0.96); inside a block it is local growth from anchors (51% of consecutive commits are neighbors). Random order with the same blocks keeps τ +0.75. The schedule owns the macro order.
2. Before a position commits, the model's argmax is the corpus prior almost every time (median probability 0.065, which decodes as "the"). Only about one belief change in thirty carries real probability (≥ 0.25). A position's guess changes 5.3 times before it commits.
3. Commits are weaker than they look: median probability 0.57, and 38% under even odds.
4. The answer's length is known late: the end-of-sequence tail completes at the 95% mark under the default schedule.
5. The cadence is linear, because the schedule commits a fixed number of tokens per step; the recorded word cadence stays within 0.119 of a straight line.

## 3. What a reader needs, by principle

- **Predictive coding, prediction error.** The reader's own brain is predicting the next word. A shown guess is useful only when it is a belief. Showing the prior injects a false prediction the reader then has to discard. So a guess is rendered only above a probability floor.
- **Parafoveal preview.** The eye pre-processes the word to the right of fixation. Crisp text there that later changes costs saccade re-planning. So nothing is crisp before it is committed, and committed text does not change (true of this sampler family, which does not remask a committed token).
- **Zeigarnik effect.** Open tasks stay active in memory. Open slots at their final width hold the answer's extent and the reader's attention on the whole of it.
- **Change blindness.** Large or continuous whole-field motion masks local change. The locks are the signal, so the field moves as a whole exactly once, at the close.
- **Doherty threshold.** Attention holds when something visibly happens inside about 400 milliseconds. The pending churn runs at 390 milliseconds (the sampler's own measured rate is 387) and the pre-roll is 320.
- **Von Restorff effect.** The item that differs registers. A lock is distinctive at the moment it happens; if every locked word kept a halo, none would be distinct. So the lock is an event that fades within a second, and the word then rests quiet.
- **Dopamine, trust calibration.** The settle beat is a reward signal, sized to the commit's probability so that the render's enthusiasm tracks the sampler's reliability; a weak commit rests dimmer.
- **Gestalt closure, peak-end rule.** The final gaps closing is the moment the sequence is remembered by. The last lock carries the strongest beat, and the closing wave is the one moment everything moves.

## 4. The reveal that follows

A word has four stages. **Open:** an illegible blurred noise word (4.2 px at body size erases letterforms, keeps word shape) in a slot of its final width, low opacity, churning at 390 ms. **Belief** (recorded mode): the model's guess above the floor, less blurred and steadier, still short of readable, crossfading on each change. **Lock:** crisp at once, heavier, a settle sized to probability, a halo that blooms and is gone within 900 ms. **Close:** at the last lock, one wave, the slot markers drop, weights return to uniform, the answer reads finished.

Order in the authored mode is parallel growth: the first step seeds the whole span, later commits extend live clusters with the jump distribution of the recorded schedule-free sampler or open a seed in the largest gap. The block schedule that makes the default sampler read left to right is a product decision the reveal does not inherit. Cadence is batched in steps, about twenty per answer, 140 to 260 milliseconds apart after a 320 millisecond pre-roll, linear on average. The recorded mode plays the sampler's own order and, at 40 ms per step, its own beliefs.

What this removed from the earlier build, with the reason: the phi-decay cadence (the measured cadence is linear; phi stays as the comparison stimulus); the glass sweep that ran field-wide for the length of the reveal (change blindness); the halo that stayed on every locked word until the end (von Restorff); the closing beat at an arbitrary 82% of the run, which unblurred still-pending noise as if it were text (it now fires at the last lock); semi-legible pending noise at 2.2 px (parafoveal preview).

## 5. The hypothesis, as three claims a study can break

- **H1, state legibility.** Interrupted at matched timestamps, readers identify which words are settled more accurately with the lock reveal than with a uniform blur.
- **H2, reading cost.** Reading time of the final answer is no worse than after a typewriter reveal. The parafoveal argument predicts it could be worse; if it is, the right design reveals in reading order and carries state some other way.
- **H3, trust calibration.** Readers' confidence in individual words tracks the sampler's commit probability under the confidence-scaled render and does not under a uniform one.

The recorded trajectories are the stimuli for all three.

## 6. What is authored and what is measured

The order model, the cadence bounds, the churn rate, the guess floor, and the confidence scaling are fitted to or set by the data. The blur radius, the opacity floor, the settle sizes, the step count, and the within-step spread are tuned by eye and labeled so. Nothing here shows that the reveal helps a reader; that is what the study is for.

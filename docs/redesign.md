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

Order in the authored mode is parallel growth with the gist first: each region seeds with its most salient word (a list marker or line opening, a word that echoes the prompt, a proper noun, a number, a long or repeated content word), later commits extend live clusters with the jump distribution of the recorded schedule-free sampler, leaning toward the more salient neighbor, or open a seed in the largest gap. A list shows its skeleton first; a plot shows its heist, vault, and crew before its articles; the answer reads as sculpted rather than typed. The score is an authored hint (gist: Potter 1976; surprisal: Levy 2008); a product would use a saliency model, and a real sampler commits its surest tokens first. The block schedule that makes the default sampler read left to right is a product decision the reveal does not inherit. Cadence is batched in steps, about twenty per answer, 140 to 260 milliseconds apart after a 320 millisecond pre-roll, linear on average. The recorded mode plays the sampler's own order and, at 40 ms per step, its own beliefs.

What this removed from the earlier build, with the reason: the phi-decay cadence (the measured cadence is linear; phi stays as the comparison stimulus); the glass sweep that ran field-wide for the length of the reveal (change blindness); the halo that stayed on every locked word until the end (von Restorff); the closing beat at an arbitrary 82% of the run, which unblurred still-pending noise as if it were text (it now fires at the last lock); semi-legible pending noise at 2.2 px (parafoveal preview).

## 5. The hypothesis, as four claims a study can break

- **H1, state legibility.** Interrupted at matched timestamps, readers identify which words are settled more accurately with the lock reveal than with a uniform blur.
- **H2, reading cost.** Reading time of the final answer is no worse than after a typewriter reveal. The parafoveal argument predicts it could be worse; if it is, the right design reveals in reading order and carries state some other way.
- **H3, trust calibration.** Readers' confidence in individual words tracks the sampler's commit probability under the confidence-scaled render and does not under a uniform one.

- **H4, felt quality.** The same answer, at the same duration, is rated more satisfying and of higher quality after the reward grammar (section 6) than after a uniform fade.

The recorded trajectories are the stimuli for all four.

## 6. The reward grammar: why the same answer can feel better

The words are identical either way. What differs is the shape of the wait and the shape of each arrival, and the research says which shapes the brain pays out for.

- **Reward anticipation** (Howe et al. 2013, dopamine ramps as a reward approaches; Salimpoor et al. 2011, anticipation of a musical peak recruits the caudate as the peak recruits the accumbens). So every lock is preceded by an approach: a word forms for one step, the final word ghosted and steady, before it snaps crisp. And the whole field approaches completion visibly: as the share of settled words rises, the noise words dim and their slot markers fade.
- **Processing fluency** (Reber, Schwarz & Winkielman 2004) and the **aha effect** (Topolinski & Reber 2010, a sudden gain in fluency is felt as insight). So a lock is a snap from ghost to crisp, never a gradual sharpen, and the final answer is the cleanest state on the page.
- **Gestalt closure** at the scale of a phrase. A lock that joins two settled neighbors closes a gap; its settle gets a small bonus. Parallel growth produces many such closures on the way to the whole, where a scan produces one.
- **Goal gradient** (Hull 1932; Kivetz, Urminsky & Zheng 2006; Nunes & Drèze 2006, endowed progress) and the **labor illusion** (Buell & Norton 2011). So the first step seeds the whole span, and the status line counts the words settled while they settle.
- **Groove** (Witek et al. 2014, moderate syncopation is rated most pleasurable; a metronome least). So alternate step intervals run long and short by eight percent, with a short spread inside each step; the average rate stays linear.
- **Information gap** (Loewenstein 1994; Kang et al. 2009, curiosity recruits reward circuitry). So a pending word holds its final width, and the model's real guess shows when it clears the floor.

These are reasons the same answer could feel better. None of them was measured on this prototype. Together they are the fourth claim: H4, felt quality, that the same answer at the same duration is rated more satisfying after this grammar than after a uniform fade. It is falsified if the ratings do not differ, or if the grammar reads as busier without reading as better.

## 7. The recorded mode, and what the recording contributes

A recording contributes the sampler's order, its timing, its confidence at every commit, and the timing of every belief it held above the floor. It also contributes its words, and a 0.6B model's words are not what a reader should be handed: four of the twenty default-sampler runs loop, others refuse or contradict themselves, and the schedule-free runs are short or empty nearly half the time. A hand audit keeps the 18 of 60 that read as complete, coherent answers for the research stage and records a reason for every other run. So the research section replays the model's own words with an audit verdict on every run, and the product demos replay the recorded order, timing, and confidence over the pre-written answer, labeled on the stage. Nothing in the second is invented; only the prose is authored, and the stage says which is which.

The schedule-free runs also spend most of their steps committing end-of-sequence positions, the answer's length settling with nothing to read yet, before the words land in the last stretch. The shaped pace plays a tail-only step in 14 milliseconds and a word step in 120, so the length settles quickly and every visible lock gets a full beat, and a strip under the answer draws the field settling. That is what makes the schedule-free run the showpiece: a few anchors, a stretch of held beliefs while the field contracts, then the flood.

## 8. What is authored and what is measured

The order model, the cadence bounds, the churn rate, the guess floor, and the confidence scaling are fitted to or set by the data. The blur radius, the opacity floor, the settle sizes, the step count, the within-step spread, the swing, the recede range, and the gap-close bonus are tuned by eye and labeled so. Nothing here shows that the reveal helps a reader; that is what the study is for.

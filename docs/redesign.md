# The design record, in order

Three passes made this piece. Each is recorded here with what it got right, what it got wrong, and what the next pass kept. The first two records are preserved in full below the third, because the argument of the case study is the sequence.

## Pass three: Settle (7 September 2026)

### 1. The question, restated

The brief asks how text from a diffusion language model should reach a reader so that the same answer feels clean, calm, beautiful and brand-able. The crystallize pass answered with a choreography of the final answer. The Margin pass answered with a still page and a breathing mark. Both answered a narrower question than the brief.

A diffusion sampler produces two kinds of fact at every step: it commits tokens, at positions, irreversibly, and by committing it reveals the shape of the answer. A typewriter shows only the first kind. Crystallize invented the second from the answer key. Margin threw it away. Settle shows both, each where a reader can use it.

### 2. The audit, accepted

The Codex pass of 7 September audited `ab95e6a` against its own recordings. Its findings are reproduced by `pnpm traces:settle` and cited from `lib/traces/findings.ts`:

- The reveal knew the answer: it joined the final word table, measured it, and reserved every word's final width before the first step.
- 700 of 3,880 words (18.04 percent; 188 of 1,205 in the curated set) span more than one commit step, and the old rule drew their final spelling at the first piece. 353 matched the model's guess at that moment.
- The "length fixed" label was a retrospective statistic; it preceded the causally known length in 42 of 60 runs.
- "No phrase ever reads out of order" was contradicted by the report's own 0.056 median inversion share.
- The 540 ms and 36 percent figures described a shaped replay of 18 curated runs and are not comparable to any causal cost.

### 3. What Margin got right, and where it stopped

Kept: the event contract (commits by position, a bounded finish, snapshots with explicit finality, revisions as events, stop and error as distinct states); the reducer's discipline (validate a batch before releasing any of it; the prefix grows only through received positions; a terminal state cannot be overwritten); release by complete passage with no timeout; readable text that never blurs, scrambles, pulses or moves; brand outside the glyphs; status in words; reduced motion changes decoration only; the cost instrument.

Rejected: rendering nothing diffusion-specific; a 7-pixel bracket in three hues as a brand surface; paying the whole hold in blankness; a case study that argued against its predecessor and stopped.

### 4. The system

The page: released passages, still, selectable. The forming text: committed, contiguous, word-complete text beyond the last passage, dim, brightening into the page. The field: one line of cells, one per token position of the request's bound, showing open, committed, end, held, forming and released, with end runs collapsed to their share. The margin: status words and a breathing mark.

Ten rules, in `docs/superpowers/specs/2026-09-07-settle-design.md` section 4.1, kept by `lib/settle/reader.ts`. The word rule, new in this pass: a token boundary is a word boundary when the next committed token begins with whitespace, the token itself ends with whitespace, or the next position is a committed end. It costs 3.3 steps on average and closes the 18 percent exposure.

Three policies: each word, each sentence, each paragraph. The field derives from state in `lib/settle/field.ts`. The voice is five tokens with ranges in `lib/settle/voice.ts`: mark, bloom, onset (at most 240 ms), tempo, grain.

### 4b. The field, carved into the text (8 September)

The first Settle build kept out-of-order state in a strip of cells beneath the page. Watched, it still read as a typewriter: the page and the forming text both grow by contiguous prefix, so everything readable arrived left to right and the diffusion lived in a strip too thin to carry it. The carved zone (`lib/settle/carve.ts`) moves the field into the text: every position after the word-safe prefix is a slot of static where a word will stand, a complete word stands where it will in the sampler's own order, a held piece stays a slot, and end runs collapse so the zone is carved down from the tail. Rule 5 now reads: out-of-order text appears only after the page, never inside it; an open position is a slot and never letters. The strip remains as the field's compact form.

### 4c. Ink settling (8 September)

The carved zone's hatched slots gave the surface a mechanical texture, and its three registers were more than the reader needed. The refinement, from a review of the live page: a word's shape is fixed the moment it is available, and only its ink changes. An available word appears in a secondary ink that is readable (the page's ink moved toward the ground as far as a 4.5:1 floor allows, computed per brand and ground; a tint toward the accent where a palette cannot dim, as on felt). When its sentence closes, the page's ink settles through the letterforms, bottom to top, in one coordinated movement over the onset, and the word does not move. Placeholders became quiet hairlines. The hypothesis this states for the study: one calm transition inside newly ready words feels more coherent than many independent marks.

### 4d. The noise (8 September)

Marks, whether hairlines or haze, read as a ruler under the text and the words still arrived from nowhere. The piece's original promise was watching an answer denoise. The honest version of that promise: an open position shows a short run of noise glyphs in the answer's own face, dim, cycling slowly and never settling, so they never spell anything; when a word commits, its letters resolve out of that noise left to right over the onset, at the word's final width, in the secondary ink; when its sentence closes, the page's ink settles through it. The audit's line holds, because no letter of a word is drawn before the source has committed every piece of it, and rule 5 now says what noise is: never content.

### 4e. The cursor, and the wait as a product moment (8 September)

The noise glyphs were too random to look at and words still popped. The direction that resolved it came from the user: a cursor, a circle centered on the line like the sentinel at the end of a streaming answer but moving out of order, that idles, jumps from spot to spot, writes a word here and a word there, and finalizes what was resolving, so a reader watches something unfold and stays. Open positions became reserved blank space; a piece of a word a glimmer; a written word opens from the space it reserved so the line slides; the cursor goes only where the source has been and sweeps to the page's end when a sentence settles. A concept chapter draws the wait on a phone: a tick under the thumb when a sentence settles, and a slot at the bottom of the screen for a tip or a sponsored card that appears with the wait and leaves with the answer, with time on app named as a signal and the labor illusion as its guardrail. The piece is framed as a concept exploration: an idea in a working prototype, grounded in the recordings and the audit, untested on readers.

### 4f. The draft, the snap, and the cursor with mass (8 September)

The cursor of 4e moved between blanks. Everything between two written words was empty, and there was nothing to watch but the cursor's travel, so the piece still showed the model's order without showing the model's thinking. The recordings held what was missing. At every denoising step the model has a provisional argmax for every position it has not committed, with a probability, and often that guess is already the word that lands there. `scripts/derive-drafts.py` writes them into the compact traces as `drafts` (one list per step of position, piece and probability, recorded while the probability is at or above 0.2, an empty text withdrawing a guess), and the replay adapter turns each step's list into a `draft` event at that step's instant, after the step's commitment.

A draft is drawn as a draft. It shows once its probability reaches the display floor of 0.25 (`DRAFT_FLOOR`, the one floor the piece already used) and keeps showing while its text holds, so a guess sitting at the floor does not blink. It is drawn in a ghost of the secondary ink whose opacity and sharpness follow the probability, from the floor to certainty. A guess that continues a word is drawn only where the position before it draws letters it can attach to, so no word tail floats in blank space. A guess that the answer ends here is kept in the state and draws no mark, because the answer's extent is told by the cut; whitespace alone and other special tokens draw nothing. A commitment ends the guess at its position, a completed answer holds none, and a draft changes nothing about the page, the prefix, the passages or the status. When the source changes its mind the draft reconsiders, once per change, with a short blur and dip. The honesty line now reads: nothing committed is drawn as a guess, nothing guessed is drawn as committed, and no guess ever reaches the page.

Two committed registers changed with it. A piece of a word that is not complete yet is drawn as the piece it is, in the secondary ink at full weight, because its letters are facts and committed letters are letters people will read; the earlier glimmer drew none of them. And the moment every piece of a word and its boundaries are in, the word snaps in where it stands: 340 ms of blur to sharp, a slight rise, a brief glow, and a glow of the accent around the letters, the cursor's touch, that fades as the word dries in place. Its width slides from the width its positions actually held, blank or draft or pieces, to its own, so the line moves instead of jumping. The word rule for the page is untouched: a word reaches the forming text and the page only when it is complete.

The cursor became a small body with mass. Its head is pulled to its target by a damped spring (stiffness 520, damping ratio 0.74, about a 250 ms arrival with a soft overshoot) and can be retargeted mid-flight; it stretches along its own velocity up to 1.65 times its width, volume preserving, and rounds up as it stops, with its heading taken from the velocity; a trail follows on softer springs and is drawn as one body stretched from the trail to the head, thinning as it lengthens, so a jump reads as one thing moving. It sits after the word or the piece it wrote like a caret, at the middle of the lowercase letters, presses and emits one ring per word it finalizes, sweeps to the end of the page when a sentence closes, and rests and fades when the source is done. Its target is measured every frame it moves, so it follows a word that is still opening, and everything it does is a transform on three elements written once per frame, only while something moves. Reduced motion places it at its target with no trail, no stretch, no ring, and no snap. This is squash and stretch: distorting a shape during an action is what gives it rigidity and mass (Lasseter, "Principles of Traditional Animation Applied to 3D Computer Animation," SIGGRAPH 1987, on the principles the Disney studio developed in the 1930s and Thomas and Johnston codified in 1981). A goo filter was tried for the trail and replaced by the stretched body (Bebber, "The Gooey Effect," CSS-Tricks, 4 February 2015).

The margin gained a phase, read off the field by `lib/settle/phase.ts`: the positions the answer can still occupy are the ones up to the lowest committed end, else the bound; resolve is the committed share plus half the drafted share; under 0.15 the phase is sketching, under 0.5 drafting, under 0.85 polishing, otherwise closing. The margin now reads, for example, "receiving · drafting · 20 of 128 settled". The words are the ones a writer would use for their own draft, the thresholds are authored, and the line is a description of the state that promises nothing about what comes next. The stages now default to the recorded forward-pass clock, about 119 ms per step, where they used to run at half of it; the choices are recorded, half of recorded, and twice recorded. The wait has something in it now, so it no longer has to be hurried.

What the recordings say about the drafts (`DRAFTS` in `lib/traces/findings.ts`, from `data/traces/derived/drafts.json`, over content positions of every recording with at least 8 content tokens, where a pair is one open content position at one step, at the display floor under the reducer's rule, accuracy by decoded text): a shown draft occupies 17 percent of open-position steps (0.1699); two thirds of shown drafts are the token that later commits (accuracy 0.6657); at least one draft is visible on 93 percent of steps (0.9272); a position's draft first shows a median of 8 steps before it commits; and 61 percent of drafts that show never change again before they commit (0.6145). By sampler: `lowconf-b32` 0.1301 visible at 0.6103 accuracy, a median of 4 steps of polish, and a visible share rising across the run from 0.036 in the first tenth to 0.623 in the last; `random-b32` 0.1915 at 0.718, a median of 14 steps, from 0.098 to 0.801; `lowconf-b128` 0.3115 at 0.5756, a median of 11 steps, roughly flat around 0.3 until 0.537 in the last tenth. The neighbor lift, on the raw probabilities at the step after a commitment: the max probability of an open content position beside a just-committed position rises on average by 0.1096 under `lowconf-b32` (n = 1074), 0.175 under `random-b32` (n = 2121) and 0.1264 under `lowconf-b128` (n = 77), against 0.0067, 0.0048 and 0.0022 for every other open position. That is the recorded form of one word settling making its neighbors settle: a commitment lifts its neighbors' confidence by more than an order of magnitude over the rest. Raising the floor buys accuracy with silence: 0.227 of pairs visible at 0.565 accuracy at a floor of 0.15, 0.153 at 0.705 at 0.25, 0.134 at 0.752 at 0.3, and 0.086 at 0.878 at 0.5.

Authored in all of this: the floor, the hysteresis, the attach rule, the phase thresholds, the spring constants, and the snap's timing. Recorded: the drafts, their probabilities, their changes, and the neighbor lift. None of it says that a draft, a snap or a cursor helps a reader. The study is still unrun, and the piece is still a concept exploration in a working prototype.

### 4g. The companion (8 September)

The cursor of 4f was locked to the lines. It flew to the position the source had last committed and sat after the word it wrote like a caret, at the middle of the lowercase letters, which put it on the text a reader was trying to look at. It darted, because the sampler commits anywhere and the spring was tuned to arrive in a quarter of a second. On the phone, where the lines are short and the words are close together, the darting was jitter. And its worst effect was on the argument: a body that flew to each new word and sat after it made the words appear under it left to right, which is the shape the whole piece exists to argue against.

The replacement keeps the body and takes it off the lines. The companion is a small soft body in the brand's color that lives in the answer's open space. Its home is measured a few times a second, every 160 ms: horizontally at the centroid of what is still open in the zone, the blank slots and the drafts; vertically in the gap 0.85 em under the last line written in the zone or on the page; over the first open slot while nothing is written yet; at the end of the page once the source is done. It reaches home on a soft spring (stiffness 13, damping ratio 1, the measured home itself followed at 0.35 per measurement so the body tracks the trend of it and never every step, about a second, no overshoot), so as the answer fills and the open part moves, the body drifts after it instead of jumping. While it waits it wanders on two slow sinusoids (about 4.5 px, periods between 3 and 6 seconds) and breathes, a slow scale on the core at the brand's breath period. It stretches a little along its own velocity when it moves, up to 1.32 times, volume preserving, and rounds up as it stops. Its shape is a core of 1.25 em whose outline slowly changes over 9 s, with a soft radial edge and a glow, and two wisps that turn around it on tilted paths of 11 s and 8.2 s: a small cloud, bone on the after-tokens stage, cobalt on the concept phone.

It never goes to the words. When a word is written, every piece of it and its boundaries committed, the body sends three motes to it, 45 ms apart, along a shallow arc that alternates sides, each flying 260 to 440 ms by distance, 0.3 em across and brief; it leans 7 px toward the word for 420 ms and squashes for 220 ms as it fires. The word stands soft, a 1.4 px blur and a slight sink, until the first mote lands, and then it snaps in: the 340 ms settle of blur to sharp, a rise, and a glow of the accent around the letters. Its color never changes through any of that, so a written word clears the contrast floor at every frame. Several words settling at once get several beams at once, which is what a sampler filling positions in parallel looks like. If motes cannot be sent, because the surface is off screen, or under reduced motion, or because the pool of 36 is exhausted, the word snaps at once.

Two things beside the words changed with it. When a word snaps, the drafts within three positions on either side lift for 640 ms, brighter and sharper with a slight rise, and then return to their own probability: the recorded neighbor lift of 4f, drawn. And after a draft's letters reconsider, the 380 ms remount on a change of mind, they breathe: a slow alternation between full presence and 0.78 over 4.2 s, offset by position at 530 ms per position, so the unresolved part of the answer is never still and never blinks. When a sentence closes the body rings once, a 640 ms expanding ring, and a phone that can tick, ticks; when the source is done the body swells, softens and dissolves over 1.1 s.

The reasons, and their limits. Slow motion in view is the least distracting kind and blinking the worst (Bartram, Ware and Calvert, 2003, self-reported distraction, measured on notification icons beside a primary task), so the body drifts slowly, the motes are small and brief and few, and nothing here blinks. Squash and stretch and follow-through are what give a drawn body mass and intent (Lasseter, SIGGRAPH 1987, a craft argument on the principles the Disney studio developed in the 1930s), and solidity in interface objects was argued for so that changes are easier to follow (Chang and Ungar, 1993, a design paper with no user study), so the body leans, squashes, stretches along its velocity and never teleports. Ambient looping motion is normally to be avoided: the published guidance is to use a static treatment unless a pulse is explicitly asked for (Emil Kowalski). Here it was explicitly asked for, and it carries its guardrail: the loop runs only while the surface is on screen and the recording is playing, pausing the recording holds the body, the wisps and the breath still, and reduced motion places the body at its home, sends no motes so words snap at once without animation, and removes the wisps, the ring, the breath, the lift and the dissolve. What is drawn, and when, is identical either way. The beams to several words at once are the honest shape of a sampler that commits positions out of order and in parallel; they are decoration attached to real commit events, and no beam ever precedes a commitment.

Authored here: the 160 ms home measurement, the centroid rule and the 0.85 em gap, the spring's stiffness of 18 and damping ratio of 1, the 4.5 px wander over 3 to 6 second periods, the 1.32 stretch ceiling, the 1.25 em core and its 9 s morph, the wisps at 11 s and 8.2 s, three motes 45 ms apart flying 260 to 440 ms at 0.3 em with a pool of 36, the 7 px lean over 420 ms, the 220 ms squash, the 1.4 px soft state and the 340 ms snap, the lift's reach of three positions and its 640 ms, the draft's breath at 4.2 s and 530 ms per position, the 640 ms ring and the 1.1 s dissolve. Recorded: the commitments the motes answer, the drafts that breathe, and the neighbors whose confidence the lift draws. The margin's phase, the drafts, the pieces, the word rule, the page and the measured cost are unchanged, and the `cursor` prop keeps its name in the code for callers while the copy calls it the companion. None of this is measured on a reader. The study is still unrun, and the piece is still a concept exploration in a working prototype.

### 5. The cost, measured

On all sixty recordings on the uniform step clock: first passage at a median of 12 steps (word), 39 (sentence), 128 (paragraph); extra wait after text is in order at a mean of 3.3, 24.5 and 44.7 steps; forming text visible for a median 90 percent of the run under sentence and paragraph; 60 of 60 exact outputs and zero characters drawn early under every policy. Margin's sentence policy paid its 23.5-step hold in blankness; Settle draws the held text for 90 percent of the run.

### 6. Retired

The tension budget, the salience map and nucleus, the two-channel reveal, the arrival profile as a design instrument (kept as a tool), the exhale, the "length fixed" label, the 540 ms and 36 percent figures, the sections that presented them, and the reward-grammar psychology as design law. The legacy engine remains as the labeled retrospective reference the audit figure compares against.

### 7. The literature, corrected

Recorded in `docs/research-note.md` section 9. In short: stability of read text is the one well-quantified harm (Liu et al. 2023), rereading must be preserved (Schotter, Tran and Rayner 2014), visible process raises perceived value when the result is good and lowers it when the result disappoints (Buell and Norton 2011), explained waits feel shorter (Maister 1985), and fluency needs a guardrail (Reber and Schwarz 1999), pacing at linguistic boundaries is preferred (Zhu et al. 2026), the Zeigarnik memory effect does not replicate (Ghibellini and Meier 2025), closure is about contours, and peak-end is contested for mild experiences. No study tests non-sequential text arrival.

### 8. Credits

The causal audit and the first implementation of the reading contract were made by Codex on 7 September 2026 under the name Margin, on branch `codex/after-tokens-margin`, with a handoff document that this pass absorbs. The reducer in `lib/settle/reader.ts` is Margin's reducer extended; the boundary rules and the authored fixtures are Margin's; the cost instrument extends Margin's report.

---

## Pass two: the arrival grammar, reasoned from the ground up (6 September 2026)

*Preserved as written. The audit above found that the reveal it describes required the final answer; its profile numbers describe a replay that knew the answer and are cited nowhere else.*

### 1. The question, and what it hides

The brief was a question with a hidden premise: how do we make diffusion text rendering clean, simple, beautiful, and brand-able, using psychological principles such as the Zeigarnik effect, gestalt closure, and the peak-end rule, so that the same answer feels better through presentation alone? The premise was that the words are fixed and the arrival is free. That made the arrival a design object.

### 2. Diagnosis of the earlier build

Four structural problems: many levers and no spine; four nature metaphors diluting a system into four products; psychology cited rather than operationalized; chrome competing with the work.

### 3. Arrival as a design object

An arrival is one number per word, the time it becomes legible. From that vector, the phrase structure, and each word's salience, four properties follow: tension, closure, peak and end, fluency. Together they were the arrival profile, computed in `lib/arrival/profile.ts`.

### 4. What the profile said about the earlier arrivals

Fog and aurora held every phrase open through their sweep; mitosis scattered inside phrases; mycelium opened 4.5 loops at once. They stayed as reference arrivals.

### 5. The grammar: crystallize

At most two phrases open at once; the next phrase opened by salience; the nucleus locked first; every front advanced every step; a 320 ms pre-roll; about twenty steps at 140 to 260 ms; a ghost one step before a lock; an exhale after the last lock.

### 6. The two-channel reveal for recorded runs

The state channel ghosted a word at its first token commit; the reading channel made a word crisp only when every word before it in its phrase was crisp. The audit found the first channel drew final text at the first token and the second still left 5.6 percent of within-phrase pairs out of order.

### 7. The voice

Six tokens with ranges: tempo, attack, weight, glow, hush, swing.

### 8. What was retired, and why

The four metaphors' unbounded seeding, the closing wave, the four specimens, the drafting chrome, the monospace body face.

### 9. What is authored and what is measured

The trajectories measured a sampler; the profile measured arrivals; nothing measured a reader.

---

## Pass one: the four metaphors (27 May to 4 September 2026)

Fog dissipating, aurora, mitosis and mycelium as four reveal modes, each a nature metaphor for non-sequential arrival; a recorded-sampler mode added on 4 September; a reward grammar citing the Zeigarnik effect, gestalt closure and the peak-end rule. Superseded by pass two, which scored the four modes and retired them, and by pass three, which retired the psychology as design law.

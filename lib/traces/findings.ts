import type { ReactNode } from 'react'
import arrivalReport from './arrival.json'

// The findings from the recorded trajectories, written once here so every
// section, the readme, and the research note cite the same numbers. All values
// are medians across the 20 prompts unless the label says otherwise, and every
// one is reproducible from data/traces/summary.json with
// scripts/summarize-trajectories.py.
//
// The honesty frame, which nothing in this file may soften: these numbers say
// what one small sampler does. They do not say that any reveal helps a reader.

export const TRACE_NUMBERS = {
  model: 'Qwen3-0.6B-diffusion-mdlm-v0.1',
  params: '0.6B',
  prompts: 20,
  trajectories: 60,
  steps: 128,
  msPerStepRecorded: 119,
  /** rank correlation between commit order and reading order, median per config */
  tau: { lowconfB32: 0.96, randomB32: 0.75, lowconfB128: 0.38 },
  /** median distance between consecutive commits, in positions */
  meanJump: { lowconfB32: 2.5, randomB32: 10.8, lowconfB128: 2.9, randomExpected: 36.7 },
  /** share of consecutive commits that land on neighboring positions */
  adjacentFrac: { lowconfB32: 0.514, randomB32: 0.071, lowconfB128: 0.500 },
  /** provisional-argmax changes per token before commit, default sampler */
  flipsPerTokenLowconf: 5.3,
  flipsRange: [2.1, 9.4] as const,
  anyFlipFrac: 0.963,
  medianCommitConf: 0.57,
  lowConfCommitFrac: 0.380,
  /** share of default-sampler runs whose end-of-sequence tail committed before the last content token */
  tailFirstFrac: 0.950,
  tailDoneAtFrac: 0.953,
  lastContentAtFrac: 0.992,
  q1StopwordFrac: 0.462,
  overallStopwordFrac: 0.478,
  /** order statistics exclude answers shorter than this many content tokens */
  /** new anchors (commits not adjacent to any committed position) per 100 content tokens, default sampler */
  seedsPer100Default: 22.5,
  /** the same, schedule-free sampler (usable runs); the authored order grows from this regime */
  seedsPer100NoBlock: 28.6,
  /** no-block sampler: share of usable runs whose tail committed before the last content token, and when */
  tailFirstFracNoBlock: 1.000,
  tailDoneAtFracNoBlock: 0.922,
  noBlockMedianContentTokens: 15,
  minContentTokens: 8,
  /** no-block sampler: how many of the 20 answers came back empty, and how many fell under the minimum */
  emptyAnswersNoBlock: 3,
  shortExcludedNoBlock: 9,
  shortExcludedDefault: 0,
  /** default-sampler answers that fell into a repetition loop (one phrase repeated back to back, covering most of the words); none under the other two samplers. see LOOP_RULE in scripts/gen-trace-index.mjs */
  loopedAnswersDefault: 4,
  loopedAnswersOther: 0,
  loopRepsRange: [5, 19] as const,
  loopCoverRange: [0.72, 0.88] as const,
  /** runs the hand audit (data/traces/curated.json) kept for the picker: complete, coherent answers */
  curatedRuns: 18,
  /** the audit of every recorded answer (AUDIT_RULE in scripts/gen-trace-index.mjs): complete means the model chose its own ending */
  audit: {
    lowconfB32: { complete: 16, looped: 4 },
    randomB32: { complete: 20 },
    lowconfB128: { complete: 11, short: 6, empty: 3 },
  },
} as const

const pct = (x: number) => `${Math.round(x * 100)}%`
const N = TRACE_NUMBERS

export const LEAD =
  'Every timeline in this piece was authored, until this one. Sixty denoising trajectories were recorded from a real masked diffusion language model, a 0.6-billion-parameter Qwen3 adapted with the MDLM objective, running greedily on a laptop: which position committed at each of 128 steps, with what confidence, and what the model would have said for every position it had not committed yet. The mode below replays them. The order is the sampler’s and the words are the model’s. Nothing here is mine except the rendering.'

export const ORDER_DRAWN =
  'Each map is one trajectory: positions left to right, denoising steps top to bottom, one mark where each position committed, darker where the model was surer. A staircase is a typewriter. A cloud is a scatter. The default sampler draws four staircases with fuzz inside each. The same rule with no blocks draws something else: most of the run spent committing the empty tail, then a few clusters growing outward at once in the last rows. The random sampler with blocks draws four clouds in a row, which is the tell: the blocks alone make it look sequential.'

export const FINDINGS_HEADING = 'five things a real sampler does that a reveal has to know about'

export type Finding = { n: string; lead: string; stat: string; body: ReactNode }

export const FINDINGS: Finding[] = [
  {
    n: '01',
    lead: 'the default sampler is nearly sequential, and the schedule is why',
    stat: `τ = ${N.tau.lowconfB32 >= 0 ? '+' : ''}${N.tau.lowconfB32.toFixed(2)} with blocks · ${N.tau.lowconfB128 >= 0 ? '+' : ''}${N.tau.lowconfB128.toFixed(2)} without`,
    body: `Under the model card’s default, low-confidence remasking in four blocks of 32, commit order correlates with reading order at τ = ${N.tau.lowconfB32 >= 0 ? '+' : ''}${N.tau.lowconfB32.toFixed(2)}. The answer arrives almost left to right, one block at a time, and only scrambles inside a block. Remove the block schedule and the same rule drops to τ = ${N.tau.lowconfB128 >= 0 ? '+' : ''}${N.tau.lowconfB128.toFixed(2)} on the same prompts. Swap the confidence rule for random order but keep the blocks and τ only falls to ${N.tau.randomB32 >= 0 ? '+' : ''}${N.tau.randomB32.toFixed(2)}. The schedule sets the macro order; the model only supplies the words that fill it. An interface that promises out of order has to know which sampler it is drawing.`,
  },
  {
    n: '02',
    lead: 'commits cluster: growth from anchors',
    stat: `${pct(N.adjacentFrac.lowconfB32)} of consecutive commits are neighbors · ${pct(N.adjacentFrac.randomB32)} under random order`,
    body: `Under the default sampler, ${pct(N.adjacentFrac.lowconfB32)} of consecutive commits land on a neighbor of the previous one, and the median jump between commits is ${N.meanJump.lowconfB32.toFixed(1)} positions where a uniformly random order would give about ${N.meanJump.randomExpected.toFixed(0)}. Swap in random order and the neighbor rate falls to ${pct(N.adjacentFrac.randomB32)}. With no block schedule the picture holds on the eleven answers long enough to measure: ${pct(N.adjacentFrac.lowconfB128)} neighbors, a median jump of ${N.meanJump.lowconfB128.toFixed(1)}. High-confidence words anchor first and the rest fills in around them, about one new anchor every ${Math.round(100 / N.seedsPer100Default)} commits. It is local growth from several seeds at once, which is the shape the authored mycelium mode guessed at before any of this was measured.`,
  },
  {
    n: '03',
    lead: 'the end is decided just before the last words',
    stat: `tail complete at the ${pct(N.tailDoneAtFrac)} mark · last word at ${pct(N.lastContentAtFrac)}`,
    body: `In ${pct(N.tailFirstFrac)} of default-sampler runs every end-of-sequence position committed before the last content word, but only just: the block schedule keeps the tail inside the final block, so the length becomes certain at the ${pct(N.tailDoneAtFrac)} mark and the last word lands at the ${pct(N.lastContentAtFrac)} mark. Remove the blocks and the sampler spends most of its steps committing the empty tail first, then writes the words in the last stretch; the tail finished before the last word in every usable no-block run, at the ${pct(N.tailDoneAtFracNoBlock)} mark. Under both schedules the answer’s extent is a real signal, and under both it arrives late. An interface should draw the length when the sampler knows it and not before, which for these samplers is shortly before the words themselves.`,
  },
  {
    n: '04',
    lead: 'the provisional guess is wrong, repeatedly',
    stat: `${N.flipsPerTokenLowconf.toFixed(1)} changes per token · ${pct(N.anyFlipFrac)} of tokens change at least once`,
    body: `Before a position commits, the model’s current best guess for it changed a median of ${N.flipsPerTokenLowconf.toFixed(1)} times per token (${N.flipsRange[0].toFixed(1)} to ${N.flipsRange[1].toFixed(1)} across prompts), and ${pct(N.anyFlipFrac)} of tokens changed at least once. An interface that rendered the current guess legibly would show most words wrong several times before showing them right. This is the measured case for keeping uncommitted text unreadable, which is what blur does and a fade does not.`,
  },
  {
    n: '05',
    lead: 'commits are less confident than they look',
    stat: `median p = ${N.medianCommitConf.toFixed(2)} · ${pct(N.lowConfCommitFrac)} under even odds`,
    body: `The token committed at each step had a median probability of ${N.medianCommitConf.toFixed(2)}, and ${pct(N.lowConfCommitFrac)} of commits, nearly two in five, went in under even odds, greedy decoding or not: low-confidence remasking takes the surest of what remains, and late in a block what remains is not sure. A reveal that treats every lock as equally certain overstates on a large minority of words. Confidence at commit is a per-word signal the sampler already computes, and in the recorded mode a word whose weakest token committed under thirty percent settles dimmer than its neighbors. That step dims the clearly weak commits, about one word in seven, and leaves the larger minority alone, so the difference still reads as a difference.`,
  },
]

export const LIMITS =
  `This is one model at 0.6 billion parameters, one sampler family, greedy decoding, twenty prompts, one laptop. Larger models and other samplers may order differently. Order statistics exclude answers under ${N.minContentTokens} content tokens, because two tokens are always in order; that excluded ${N.shortExcludedNoBlock} of the 20 no-block runs (${N.emptyAnswersNoBlock} of them came back with no answer at all, the model committing its end-of-sequence tokens first, a known cost of removing the schedule; the usable no-block answers ran a median of ${N.noBlockMedianContentTokens} content tokens) and ${N.shortExcludedDefault} of the default runs. ${N.loopedAnswersDefault === 4 ? 'Four' : String(N.loopedAnswersDefault)} of the twenty default-sampler answers fell into a repetition loop, one phrase repeated ${N.loopRepsRange[0]} to ${N.loopRepsRange[1]} times back to back over ${pct(N.loopCoverRange[0])} to ${pct(N.loopCoverRange[1])} of the words, a known failure of greedy decoding at this scale; ${N.loopedAnswersOther === 0 ? 'no run' : String(N.loopedAnswersOther)} under the other two samplers did. Every recorded answer carries an audit verdict (${N.audit.lowconfB32.complete} of the 20 default runs chose their own ending, ${N.audit.randomB32.complete} of 20 random-order runs did, and ${N.audit.lowconfB128.complete} of 20 no-block runs did, the rest short or empty), and a hand audit kept ${N.curatedRuns} of the 60 as complete, coherent answers; the research stage shows only those, every excluded run keeps its reason in the data, all sixty stay in the statistics they qualify for, and the product demos replay a run's order, timing, and confidence over pre-written words, so no recorded text reaches them. None of it measures whether any reveal helps a reader. That is still the study in the closing section; the recorded trajectories are now its stimulus rather than an authored guess.`

// Numbers derived from the full traces for feeding back into the authored
// design (see data/traces/derived/*.json and scripts/derive-trajectory-models.py).
export const DERIVED = {
  /** default sampler: a pending token's provisional guess changes every this many steps */
  stepsPerFlip: 3.25,
  /** the same, in milliseconds at the recorded pace and at the 40 ms replay pace */
  msPerFlipRecorded: 387,
  msPerFlipReplay: 130,
  /** the authored pending-glyph cycle the engine has shipped with all along */
  authoredCycleMs: 440,
  /** how far the recorded word cadence (median lock fraction by word rank) strays from a straight line */
  cadenceMaxDeviation: 0.119,
  cadenceMeanDeviation: 0.057,
  /** fitted growth-process parameters, default sampler, within blocks */
  growth: {
    adjacentFrac: 0.514,
    seedsPer100Tokens: 22.5,
    jumpHist: { '1': 0.519, '2': 0.227, '3-5': 0.166, '6-10': 0.05, '11+': 0.039 },
  },
  /** the same for the schedule-free sampler (11 usable runs); this is the regime the authored mycelium order grows from */
  growthNoBlock: {
    adjacentFrac: 0.5,
    seedsPer100Tokens: 28.6,
    jumpHist: { '1': 0.514, '2': 0.164, '3-5': 0.164, '6-10': 0.114, '11+': 0.043 },
  },
} as const

// Corroboration at 8B. Four of the coda prompts were also run through
// LLaDA-8B-Instruct (4-bit, llama.cpp on Metal) with the same block schedule.
// llama.cpp's sampler exposes order and timing through its step callback but
// not per-position confidence, so only order statistics are comparable.
export const LLADA = {
  n: 4,
  model: 'LLaDA-8B-Instruct',
  quant: 'Q4_K_S, llama.cpp on Metal',
  params: '8B',
  sampler: 'low-confidence remasking, blocks of 32, greedy',
  tau: 0.9,
  meanJump: 3.9,
  randomExpected: 36,
  adjacentFrac: 0.337,
  /** answers mostly filled the 128 positions, so a tail was often absent; not comparable to the 0.6B figure */
  tailFirstFrac: 0.25,
  msPerStep: 1504,
  contentTokens: 108,
} as const

// The synthesis. Every rendering decision in the shipped reveal, with the
// principle from the glossary and the finding from the data that drive it,
// and how the value was arrived at. This is the design, row by row; the
// reasoning behind it in order is docs/redesign.md.
export type SynthesisTag = 'derived' | 'constraint' | 'tuned' | 'retired'
export type SynthesisRow = { decision: string; from: string; tag: SynthesisTag; effect: string }

export const SYNTHESIS: SynthesisRow[] = [
  {
    decision: 'a pending word is an illegible blur in a slot of its final width',
    from: 'parafoveal preview · zeigarnik effect',
    tag: 'constraint',
    effect: 'nothing crisp appears to the right of the eye before it is committed, so watching costs no reading time; the open slot holds the answer’s extent and the reader’s attention on the whole of it. 4.2 pixels at body size erases letterforms and keeps word shape.',
  },
  {
    decision: 'the pending glyphs change every 390 milliseconds',
    from: 'doherty threshold · finding 04',
    tag: 'derived',
    effect: 'the sampler changed its mind about a pending token every 387 milliseconds at recorded pace; 390 keeps every visible change inside the window where attention holds. The value was 440, set by eye, before it was measured.',
  },
  {
    decision: 'the model’s guess is shown only above a probability of 0.25',
    from: 'predictive coding · prediction error · finding 04',
    tag: 'derived',
    effect: 'below the floor the argmax is the corpus prior (median 0.065) and would read “the” in every slot; above it the slot shows the model’s real belief, forming, and each change is a prediction error made visible. About one change in thirty clears the floor.',
  },
  {
    decision: 'words lock in several places at once, each cluster growing outward from its seed',
    from: 'finding 01 · finding 02 · change blindness',
    tag: 'derived',
    effect: 'the block schedule is what makes the default sampler read left to right, and a schedule is a product decision the reveal does not inherit. Without one the same confidence rule grows a few clusters at once (finding 02), so the order is a growth process: the first step seeds the whole span, every later commit extends a live front with the recorded jump distribution (51% adjacent, schedule-free runs) or opens a new seed in the largest gap left. Growth is staged, local change, which is what the eye can follow; a uniform scatter is what it misses.',
  },
  {
    decision: 'the gist comes first: structure and topic words seed the growth, connective tissue fills last',
    from: 'gist · information gap · surprisal',
    tag: 'derived',
    effect: 'a reader takes the meaning of a line from its content words; the function words are predictable and carry almost none of it. So each region seeds with its most salient word (a list marker or line opening, a word that echoes the prompt, a proper noun, a number, a long or repeated content word) and every front leans toward the more salient neighbor, so a list shows its skeleton first and a plot shows its heist, its vault, and its crew before its articles. The curiosity gap closes on the essentials early, and the answer reads as sculpted rather than typed. The score is a hint the process reads; a product would pick the order with a small saliency model of its own, and a real sampler commits its surest tokens first.',
  },
  {
    decision: 'commits arrive in steps of several words, 140 to 260 milliseconds apart, after a 320 millisecond pre-roll',
    from: 'finding 01 · doherty threshold',
    tag: 'tuned',
    effect: 'a fast diffusion decoder commits several positions per denoising step, so the locks are batched the same way: about twenty steps per answer, each inside the threshold, each landing its words across a 70 millisecond spread so a step reads as a burst rather than a tick. The average rate stays linear, which is the recorded cadence; the step count and the spread are set by eye and labeled so. Phi decay was the first cadence and is retired to the comparison stimulus.',
  },
  {
    decision: 'a word forms for one step before it locks: the final word, ghosted, steady',
    from: 'reward anticipation · parafoveal preview · finding 03',
    tag: 'derived',
    effect: 'every lock is preceded by a beat of expectation. The ghost is the final word and never changes, so previewing it costs the reader nothing (a held word to the right of fixation is the preview benefit, and the cost only comes from words that change); what it buys is an approach before each arrival, which is where the pleasure of a reward is felt. In the recorded mode the forming stage is literal: a word whose first token has committed and whose last has not.',
  },
  {
    decision: 'a lock is crisp at once and the word goes heavier',
    from: 'von restorff effect · aha effect · state fidelity',
    tag: 'constraint',
    effect: 'a committed token is committed, and the weight difference keeps the frontier between settled and open readable across the field. The snap from ghost to crisp is a sudden gain in fluency, and sudden gains are what read as insight; a gradual sharpen would spend the same change without the feeling.',
  },
  {
    decision: 'the open field recedes as the answer fills',
    from: 'goal gradient · reward anticipation · processing fluency',
    tag: 'tuned',
    effect: 'the share of words locked drives the brightness of the noise words and their slot markers, from full at the start to about two thirds at the end, so the field grows quieter as the settled text grows heavier and the approach to completion is visible before completion lands. Pending words stay illegible throughout; only their brightness moves. The range is set by eye.',
  },
  {
    decision: 'a lock that joins two settled neighbors settles harder',
    from: 'gestalt closure · dopamine',
    tag: 'tuned',
    effect: 'when a word lands between two settled words it closes a gap and joins two clusters into one, a small completion at the scale of a phrase. Its settle overshoot gets 0.8% on top of the confidence-sized beat, so the reveal rewards its own local closures on the way to the whole. The bonus is set by eye.',
  },
  {
    decision: 'the steps swing: alternate intervals run long and short by eight percent',
    from: 'groove · doherty threshold',
    tag: 'tuned',
    effect: 'a metronome is the least pleasurable pulse; moderate syncopation is the most. The step interval alternates long and short so the reveal has a pulse with a lilt, while the average rate stays linear and every interval stays inside the threshold. Eight percent is set by ear.',
  },
  {
    decision: 'the status line counts the words settled while the reveal runs',
    from: 'goal gradient · labor illusion',
    tag: 'constraint',
    effect: 'visible progress toward a goal pulls toward it, and an outcome whose work can be seen is valued more, so the readout says how much of the answer has settled while it settles. It is a count of real state, never a proxy for model effort.',
  },
  {
    decision: 'the lock glow blooms and is gone within a second',
    from: 'von restorff effect · change blindness',
    tag: 'constraint',
    effect: 'a lock is distinctive at the moment it happens. A halo left on every locked word until the end made none of them distinct and kept the whole field in motion; that halo is retired.',
  },
  {
    decision: 'the settle overshoot is sized to the commit’s probability',
    from: 'dopamine · trust calibration · finding 05',
    tag: 'derived',
    effect: 'the resolution beat is a reward signal, so it scales with how sure the commit was: half a percent at a probability of 0.3, one and a half at 1. In the authored modes, with no probability, every lock settles as if sure, and the status line says the timeline is authored.',
  },
  {
    decision: 'a weak commit rests dimmer',
    from: 'trust calibration · finding 05',
    tag: 'derived',
    effect: 'thirty-eight percent of commits went in under even odds; a committed word’s resting opacity follows its probability, and a word whose weakest token committed under thirty percent steps down further.',
  },
  {
    decision: 'the field moves as a whole exactly once, at the last lock',
    from: 'gestalt closure · peak-end rule · finding 03',
    tag: 'constraint',
    effect: 'the last word carries the strongest settle, one wave crosses the field, the slot markers drop, and the answer reads finished. The closing beat used to fire at 82% of the run and unblurred still-pending noise as if it were text; it now fires when the last word locks.',
  },
  {
    decision: 'the product demos replay recorded order, timing, and confidence over pre-written words',
    from: 'state fidelity · the audit',
    tag: 'constraint',
    effect: 'what a recording contributes to a reveal is the sampler’s order, timing, confidence, and belief timing, none of which depend on the words being the model’s own. A 0.6B model’s prose is not what a reader should be handed, so the demos put the authored answer in the recorded slots and say so on the stage. The model’s own words stay in the research section, every run with its audit verdict.',
  },
  {
    decision: 'the shaped pace spends the replay where the words are',
    from: 'doherty threshold · finding 03',
    tag: 'tuned',
    effect: 'under the schedule-free sampler most steps commit only end-of-sequence positions, the answer’s length settling with nothing to read yet. A tail-only step plays in 14 milliseconds and a step that commits a word in 120, so the length settles quickly and every visible lock gets a full beat; the strip under the answer draws the field settling. The order is untouched, the other paces stay one click away, and the values are set by eye.',
  },
  {
    decision: 'nine pixels of blur and a 0.32 opacity floor in the comparison',
    from: 'the comparison stimulus',
    tag: 'tuned',
    effect: 'set by eye and shared identically by both panels, which is what makes the comparison fair. A study could move both without touching the thesis.',
  },
  {
    decision: 'the 1/φ decay, in the comparison only',
    from: 'the comparison stimulus',
    tag: 'retired',
    effect: 'the ratio’s property holds (each gap equals the sum of the next two) and it remains the authored acceleration the comparison tests against a linear ramp. The shipped reveal no longer uses it, because no recorded sampler does.',
  },
]

// The hypothesis, as five claims a study can break. The recorded
// trajectories and the reference arrivals are the stimuli for all of them.
export const HYPOTHESES = [
  {
    id: 'H1',
    lead: 'state legibility',
    claim: 'Interrupted at matched timestamps, readers identify which words are settled more accurately under crystallize than under a uniform fade.',
    falsifiedIf: 'accuracy is no better, or readers read authored order as model certainty.',
  },
  {
    id: 'H2',
    lead: 'reading cost',
    claim: 'Reading time of the final answer after crystallize is no worse than after a typewriter. Reading order inside each phrase, with one crisp anchor, is the mechanism.',
    falsifiedIf: 'it is worse. Then the design falls back to reading order at the phrase scale as well.',
  },
  {
    id: 'H3',
    lead: 'trust calibration',
    claim: 'Readers’ confidence in individual words tracks the sampler’s commit probability under the confidence-scaled render, and does not under a uniform one.',
    falsifiedIf: 'confidence ratings are flat across commit probability, or track it equally well under the uniform render.',
  },
  {
    id: 'H4',
    lead: 'felt quality',
    claim: 'The same answer, at the same duration, is rated more satisfying and of higher quality after crystallize than after a typewriter or a fade.',
    falsifiedIf: 'quality and satisfaction ratings do not differ, or the grammar reads as busier without reading as better.',
  },
  {
    id: 'H5',
    lead: 'tension budget',
    claim: 'Satisfaction rises from one open loop to two and falls when the budget is removed, tracking the span of open goals a reader can hold.',
    falsifiedIf: 'ratings are flat across the budget, or rise with it without limit.',
  },
] as const

// The arrival profile (lib/arrival/profile.ts), computed for every arrival
// over the same stimuli and written by `pnpm traces:arrival`
// (tests/arrival/report.test.ts). Medians over the eight coda fixtures for
// the authored arrivals, and over the eighteen curated recorded runs at the
// shaped pace. Every number describes an arrival, never a reader.
export type ArrivalKey =
  | 'typewriter'
  | 'fade'
  | 'scatter'
  | 'fog'
  | 'aurora'
  | 'mitosis'
  | 'mycelium'
  | 'crystal'
  | 'crystal-unbounded'
  | 'crystal-1'
  | 'crystal-3'
  | 'crystal-strict'
export type ArrivalMedians = {
  n: number
  tensionMax: number
  tensionMean: number
  alignment: number
  steps: number
  largestShare: number
  peakAt: number
  gistAt: number
  endWeight: number
  inversions: number
  previewCost: number
  tau: number
  totalMs: number
}
export type RecordedProfile = {
  plain: ArrivalMedians
  ordered: ArrivalMedians
  lagMedianMs: number
  lagMaxMs: number
  waitedShare: number
}
export const ARRIVAL = arrivalReport as unknown as {
  stimuli: { fixtures: number; curatedRuns: number }
  arrivals: Record<ArrivalKey, ArrivalMedians>
  recorded: Record<'all' | 'lowconf-b32' | 'random-b32' | 'lowconf-b128', RecordedProfile>
}

/** The eight arrivals the figure draws, in the order it draws them. */
export const ARRIVAL_ORDER: ArrivalKey[] = ['typewriter', 'fade', 'scatter', 'fog', 'aurora', 'mitosis', 'mycelium', 'crystal']

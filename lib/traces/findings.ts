import type { ReactNode } from 'react'

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
  /** no-block sampler: share of usable runs whose tail committed before the last content token, and when */
  tailFirstFracNoBlock: 1.000,
  tailDoneAtFracNoBlock: 0.922,
  noBlockMedianContentTokens: 15,
  minContentTokens: 8,
  /** no-block sampler: how many of the 20 answers came back empty, and how many fell under the minimum */
  emptyAnswersNoBlock: 3,
  shortExcludedNoBlock: 9,
  shortExcludedDefault: 0,
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
    body: `Under the model card’s default, low-confidence remasking in four blocks of 32, commit order correlates with reading order at τ = ${N.tau.lowconfB32 >= 0 ? '+' : ''}${N.tau.lowconfB32.toFixed(2)}. The answer arrives almost left to right, one block at a time, and only scrambles inside a block. Remove the block schedule and the same rule drops to τ = ${N.tau.lowconfB128 >= 0 ? '+' : ''}${N.tau.lowconfB128.toFixed(2)} on the same prompts. Swap the confidence rule for random order but keep the blocks and τ only falls to ${N.tau.randomB32 >= 0 ? '+' : ''}${N.tau.randomB32.toFixed(2)}. The macro order belongs to the schedule, not the model. An interface that promises out of order has to know which sampler it is drawing.`,
  },
  {
    n: '02',
    lead: 'commits cluster: growth from anchors, not a scatter',
    stat: `${pct(N.adjacentFrac.lowconfB32)} of consecutive commits are neighbors · ${pct(N.adjacentFrac.randomB32)} under random order`,
    body: `Under the default sampler, ${pct(N.adjacentFrac.lowconfB32)} of consecutive commits land on a neighbor of the previous one, and the median jump between commits is ${N.meanJump.lowconfB32.toFixed(1)} positions where a uniformly random order would give about ${N.meanJump.randomExpected.toFixed(0)}. Swap in random order and the neighbor rate falls to ${pct(N.adjacentFrac.randomB32)}. With no block schedule the picture holds on the eleven answers long enough to measure: ${pct(N.adjacentFrac.lowconfB128)} neighbors, a median jump of ${N.meanJump.lowconfB128.toFixed(1)}. High-confidence words anchor first and the rest fills in around them, about one new anchor every ${Math.round(100 / N.seedsPer100Default)} commits. That is neither a typewriter nor a scatter. It is local growth from several seeds at once, which is the shape the authored mycelium mode guessed at before any of this was measured.`,
  },
  {
    n: '03',
    lead: 'the end is decided before the last words, but not early',
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
    body: `The token committed at each step had a median probability of ${N.medianCommitConf.toFixed(2)}, and ${pct(N.lowConfCommitFrac)} of commits, nearly two in five, went in under even odds, greedy decoding or not: low-confidence remasking takes the surest of what remains, and late in a block what remains is not sure. A reveal that treats every lock as equally certain overstates on a large minority of words. Confidence at commit is a per-word signal the sampler already computes, and in the recorded mode a word whose weakest token committed under thirty percent settles dimmer than its neighbors: the clearly weak commits, about one word in seven, rather than the large minority, so that the difference still reads as a difference.`,
  },
]

export const LIMITS =
  `This is one model at 0.6 billion parameters, one sampler family, greedy decoding, twenty prompts, one laptop. Larger models and other samplers may order differently. Order statistics exclude answers under ${N.minContentTokens} content tokens, because two tokens are always in order; that excluded ${N.shortExcludedNoBlock} of the 20 no-block runs (${N.emptyAnswersNoBlock} of them came back with no answer at all, the model committing its end-of-sequence tokens first, a known cost of removing the schedule; the usable no-block answers ran a median of ${N.noBlockMedianContentTokens} content tokens) and ${N.shortExcludedDefault} of the default runs. None of it measures whether any reveal helps a reader. That is still the study in the closing section; the recorded trajectories are now its stimulus rather than an authored guess.`

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
  /** fitted growth-process parameters for the authored mycelium order, default sampler, within blocks */
  growth: {
    adjacentFrac: 0.514,
    seedsPer100Tokens: 22.5,
    jumpHist: { '1': 0.519, '2': 0.227, '3-5': 0.166, '6-10': 0.05, '11+': 0.039 },
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

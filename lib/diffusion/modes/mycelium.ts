import type { ModeStrategy, MeasuredAtom, ResolutionEvent } from '../types'
import { standardReducedFallback } from '../reduced-motion'
import { MyceliumOverlay } from '@/components/diffusion/mycelium-overlay'
import orderModel from '@/data/traces/derived/order-model.json'

export const MYCELIUM_PRE_ROLL_MS = 1500

// Golden ratio decay: each gap is 1/phi (about 0.618) of the previous one.
// This is an authored acceleration, not a measured one. The recorded
// word-lock cadence under the default sampler is close to linear (see
// lib/traces/findings.ts, DERIVED.cadenceMaxDeviation) because the block
// schedule commits a fixed number of tokens per step. No sampler in the
// trace set produces this curve; it stays because it reads well, and the
// comparison chart in the "what a sampler actually does" section shows the
// authored curve against the recorded one so the difference is visible
// rather than implied.
export const PHI = 1.6180339887498949
export const MYCELIUM_FIRST_GAP_MS = 720
export const MYCELIUM_MIN_GAP_MS = 45

export function goldenDecayGap(n: number): number {
  // gap_n = MYCELIUM_FIRST_GAP_MS / PHI^n, clamped to the floor.
  const gap = MYCELIUM_FIRST_GAP_MS / Math.pow(PHI, n)
  return Math.max(MYCELIUM_MIN_GAP_MS, gap)
}

const RESOLVING_TO_RESOLVED_MS = 90
const TAIL_MS = 260

export function computeWordLockTimes(wordCount: number): number[] {
  const times: number[] = []
  if (wordCount === 0) return times
  let t = MYCELIUM_PRE_ROLL_MS
  times.push(t)
  for (let i = 1; i < wordCount; i++) {
    t += goldenDecayGap(i - 1)
    times.push(t)
  }
  return times
}

// Jump-distance histogram fitted to the default sampler (lowconf, block
// size 32) over its 20 recorded runs: data/traces/derived/order-model.json,
// entry "lowconf-b32". A commit at distance 1 from the previous one happens
// 51.9% of the time there, which is what produces an adjacent-commit
// fraction of about 0.514 across a run; a fresh, unrelated anchor happens
// about 22.5 times per 100 content tokens. Both numbers come straight from
// that file; nothing here is eyeballed.
type JumpClass = '1' | '2' | '3-5' | '6-10' | '11+'
const JUMP_HIST = orderModel['lowconf-b32'].jump_hist as Record<JumpClass, number>
const JUMP_CLASSES: JumpClass[] = ['1', '2', '3-5', '6-10', '11+']

// A small deterministic PRNG (mulberry32) seeded from the FNV-1a hash of the
// text, so the growth process below is reproducible per input and nothing
// else in the render path needs to carry random state.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function fnv1a(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function pickJumpClass(rng: () => number): JumpClass {
  const r = rng()
  let cum = 0
  for (const cls of JUMP_CLASSES) {
    cum += JUMP_HIST[cls]
    if (r < cum) return cls
  }
  return JUMP_CLASSES[JUMP_CLASSES.length - 1]!
}

function jumpDistance(cls: JumpClass, rng: () => number): number {
  switch (cls) {
    case '1':
      return 1
    case '2':
      return 2
    case '3-5':
      return 3 + Math.floor(rng() * 3) // 3, 4, 5
    case '6-10':
      return 6 + Math.floor(rng() * 5) // 6..10
    case '11+':
      return -1 // signals "fresh anchor" to the caller
  }
}

/**
 * Build a deterministic growth process over the word indices, fitted to how
 * the default sampler actually commits tokens (see the JUMP_HIST comment
 * above). This deliberately does NOT imitate the sampler's block schedule:
 * the piece's position is that the macro order (which block fills when)
 * belongs to the schedule, and mycelium is a model of what confidence does
 * inside a block, replayed as one continuous growth from a few seeds. Same
 * input text always produces the same order; different text produces a
 * different one.
 *
 * The process: seed a PRNG from the text hash, commit a random first index
 * (the sampler's real first commit is its single surest token, which an
 * authored mode cannot know without the model in the loop, so a seeded pick
 * is the honest stand-in), then repeatedly draw a jump class and try to
 * land the next commit at that distance from the previous one, walking
 * outward if the exact spot is already taken, and falling back to a fresh
 * anchor when nothing nearby is left.
 */
export function computeLockOrder(words: MeasuredAtom[]): number[] {
  const n = words.length
  if (n === 0) return []

  const seedStr = words.map((w) => w.text).join('|')
  const rng = mulberry32(fnv1a(seedStr))

  // Work entirely in array positions (0..n-1); words[i].index === i for
  // every tokenized atom (see lib/diffusion/tokenize.ts), so the word index
  // is only looked up once, at commit time.
  const committed = new Array<boolean>(n).fill(false)
  const order: number[] = []
  const positions: number[] = []

  const commit = (pos: number) => {
    committed[pos] = true
    positions.push(pos)
    order.push(words[pos]!.index)
  }

  const uncommittedIndices = (): number[] => {
    const out: number[] = []
    for (let i = 0; i < n; i++) if (!committed[i]) out.push(i)
    return out
  }

  const freshAnchor = (): number => {
    const pool = uncommittedIndices()
    return pool[Math.floor(rng() * pool.length)]!
  }

  // First commit: a text-seeded random index.
  commit(freshAnchor())

  while (order.length < n) {
    const prevPos = positions[positions.length - 1]!
    const cls = pickJumpClass(rng)
    const d = jumpDistance(cls, rng)

    if (d === -1) {
      commit(freshAnchor())
      continue
    }

    const firstSign = rng() < 0.5 ? 1 : -1
    const posA = prevPos + firstSign * d
    const posB = prevPos - firstSign * d

    let landed = -1
    if (posA >= 0 && posA < n && !committed[posA]) {
      landed = posA
    } else if (posB >= 0 && posB < n && !committed[posB]) {
      landed = posB
    } else {
      // Neither exact spot is free. Walk outward from prev itself (not
      // from the rolled distance) toward the nearest uncommitted index,
      // chosen side first, then the other side.
      for (let k = 1; landed === -1; k++) {
        const p = prevPos + firstSign * k
        if (p < 0 || p >= n) break
        if (!committed[p]) landed = p
      }
      if (landed === -1) {
        for (let k = 1; landed === -1; k++) {
          const p = prevPos - firstSign * k
          if (p < 0 || p >= n) break
          if (!committed[p]) landed = p
        }
      }
    }

    commit(landed === -1 ? freshAnchor() : landed)
  }

  return order
}

function totalDuration(words: MeasuredAtom[]): number {
  if (words.length === 0) return 0
  const times = computeWordLockTimes(words.length)
  const lastLock = times[times.length - 1] ?? 0
  return lastLock + RESOLVING_TO_RESOLVED_MS + TAIL_MS
}

function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const order = computeLockOrder(words)
  const times = computeWordLockTimes(words.length)
  const events: ResolutionEvent[] = []
  order.forEach((wordIndex, orderIdx) => {
    const t = times[orderIdx] ?? 0
    events.push({ wordIndex, state: 'resolving', t })
    events.push({ wordIndex, state: 'resolved', t: t + RESOLVING_TO_RESOLVED_MS })
  })
  return events
}

export const mycelium: ModeStrategy = {
  name: 'mycelium',
  totalDuration,
  computeTimeline,
  renderOverlay: (props) => MyceliumOverlay(props),
  reducedMotionFallback: standardReducedFallback,
}

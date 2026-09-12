/** A decorative score, independent of source text, snapshots and decoder time.
 * Targets change only at spaced cues. CSS completes each gesture and then
 * rests geometrically; breathing and the shared glimmer can continue. */
export const AMBIENT_SCORE_TICK_MS = 100
export const AMBIENT_SCORE_ROWS = 5
export const AMBIENT_SCORE_OPEN_MS = 1250
export const AMBIENT_SCORE_ROUND_MS = 10800

export type ScorePill = { x: number; width: number; opacity: number; float: number }
export type ScoreRow = { index: number; seed: number; width: number; breathPeriodMs: number; breathPhaseMs: number }
export type ScoreShape = { width: number; stable: boolean; pills: ScorePill[]; transitionMs: number; episode: number; cueAtMs: number; gesture: 'hold' | 'divide' | 'gather' | 'balance' }

function hash(value: string): number {
  let n = 2166136261
  for (let index = 0; index < value.length; index++) n = Math.imul(n ^ value.charCodeAt(index), 16777619)
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d)
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b)
  return (n ^ (n >>> 16)) >>> 0
}
function unit(seed: number, key: string): number { return hash(`${seed}:${key}`) / 4294967296 }

export function createAmbientScore(seed: string | number): ScoreRow[] {
  const scoreSeed = hash(String(seed))
  const extents = [.92, .86, .95, .82, .68]
  return extents.map((extent, index) => {
    const rowSeed = hash(`${scoreSeed}:row:${index}`)
    const breathPeriodMs = 5200 + 2600 * unit(rowSeed, 'breath')
    return { index, seed: rowSeed, width: extent - .06 * unit(rowSeed, 'extent'), breathPeriodMs, breathPhaseMs: breathPeriodMs * unit(rowSeed, 'breath-phase') }
  })
}

function rowOrder(seed: number, round: number): number[] {
  // The long first line anchors the composition. Each of the other rows gets
  // one turn per round, in a freshly seeded order; there is no downward sweep.
  const order = [1, 2, 3, 4]
  for (let index = order.length - 1; index > 0; index--) {
    const other = Math.floor(unit(seed, `${round}:order:${index}`) * (index + 1))
    ;[order[index], order[other]] = [order[other]!, order[index]!]
  }
  return order
}

export function ambientScoreCue(rows: readonly ScoreRow[], rowIndex: number, round: number): number {
  if (round < 0 || rowIndex === 0) return -Infinity
  const seed = rows[0]!.seed
  const slot = rowOrder(seed, round).indexOf(rowIndex)
  return AMBIENT_SCORE_OPEN_MS + round * AMBIENT_SCORE_ROUND_MS + slot * 2500 + 300 * unit(seed, `${round}:cue:${slot}`)
}

export function ambientScoreAt(rows: readonly ScoreRow[], elapsedMs: number): ScoreShape[] {
  const time = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0)
  const round = Math.max(0, Math.floor((time - AMBIENT_SCORE_OPEN_MS) / AMBIENT_SCORE_ROUND_MS))
  return rows.map((row) => {
    if (row.index === 0) return { width: row.width, stable: true, pills: [{ x: 0, width: 1, opacity: 1, float: 0 }], transitionMs: 1100, episode: -1, cueAtMs: 0, gesture: 'hold' }
    const episode = time >= ambientScoreCue(rows, row.index, round) ? round : round - 1
    const cueAtMs = episode < 0 ? 0 : ambientScoreCue(rows, row.index, episode)
    // Adjacent chapters vary the count as well as the proportions. Empty
    // interior slots keep their identities; first and last cells stay present.
    const motif = Math.floor(3 * unit(row.seed, `${episode}:motif`))
    const previousMotif = Math.floor(3 * unit(row.seed, `${episode - 1}:motif`))
    const counts = [6, 4, 5]
    const gesture = episode < 0 ? 'hold' : counts[motif]! > counts[previousMotif]! ? 'divide' : counts[motif]! < counts[previousMotif]! ? 'gather' : 'balance'
    const weights = [1.2, motif === 0 ? .55 : 0, .9, motif === 1 ? 0 : .65, .8, .9]
      .map((weight, index) => weight * (.88 + .24 * unit(row.seed, `${episode}:weight:${index}`)))
    const visible = weights.filter((weight) => weight > 0).length
    const gap = .022
    const ink = 1 - (visible - 1) * gap
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    let cursor = 0, seen = false
    const pills = weights.map((weight) => {
      if (weight > 0 && seen) cursor += gap
      const width = ink * weight / total
      const pill = { x: cursor, width, opacity: weight > 0 ? 1 : 0, float: 0 }
      cursor += width
      if (weight > 0) seen = true
      return pill
    })
    return { width: row.width, stable: false, pills, transitionMs: 900 + 400 * unit(row.seed, `${episode}:duration`), episode, cueAtMs, gesture }
  })
}

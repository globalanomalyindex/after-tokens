import type { AmbientRow, AmbientRowGeometry } from './ambient-geometry'

export const GROWING_MATERIAL = 'growing-cell-skeleton-v8'
export const GROWING_TICK_MS = 200
export type GrowingShape = AmbientRowGeometry & { episode: number; cueAtMs: number }

function hash(value: string): number {
  let n = 2166136261
  for (let index = 0; index < value.length; index++) n = Math.imul(n ^ value.charCodeAt(index), 16777619)
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d)
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b)
  return (n ^ (n >>> 16)) >>> 0
}
function unit(seed: number, key: string): number { return hash(`${seed}:${key}`) / 4294967296 }

/** The earlier line-led silhouette, with independently seeded broad cells.
 * Source content can reserve overall height elsewhere; it never reshapes
 * these row widths or drives their decorative clock. */
export function createGrowingRows(seed: string | number): AmbientRow[] {
  const run = hash(String(seed))
  return Array.from({ length: 14 }, (_, index) => {
    const rowSeed = hash(`${run}:row:${index}`)
    const quiet = index % 5 === 0 || index % 5 === 2
    const periodMs = 4200 + 2400 * unit(rowSeed, 'period')
    const breathPeriodMs = 4800 + 2600 * unit(rowSeed, 'breath')
    return {
      seed: rowSeed, index, count: quiet ? 1 : 3,
      width: quiet ? .89 + .09 * unit(rowSeed, 'width')
        : index % 5 === 4 ? .65 + .16 * unit(rowSeed, 'width') : .82 + .13 * unit(rowSeed, 'width'),
      periodMs, phaseMs: .6 * periodMs * unit(rowSeed, 'phase'),
      breathPeriodMs, breathPhaseMs: breathPeriodMs * unit(rowSeed, 'breath-phase'),
      transitionMs: 1300 + 500 * unit(rowSeed, 'transition'),
    }
  })
}

/** A complete gesture, then a geometric hold. The sampled clock changes no
 * target between cues: CSS is allowed to finish its interpolation. This
 * avoids repeatedly restarting an ease-out at every source or timer tick.
 * Three persistent slots normalize width and gaps, preserving nonoverlap
 * under their shared interpolation; a middle slot can divide or gather. */
export function growingRowAt(row: AmbientRow, elapsedMs: number): GrowingShape {
  if (row.count === 1) return { width: row.width, stable: true, pills: [{ x: 0, width: 1, opacity: 1, float: 0 }], episode: -1, cueAtMs: 0 }
  const time = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0)
  const episode = Math.floor((time + row.phaseMs) / row.periodMs)
  const cueAtMs = episode ? episode * row.periodMs - row.phaseMs : 0
  const weights = [1.45 + .5 * unit(row.seed, `${episode}:leading`),
    unit(row.seed, `${episode}:divide`) < .55 ? .25 + .65 * unit(row.seed, `${episode}:middle`) : 0,
    .6 + unit(row.seed, `${episode}:trailing`)]
  const count = weights.filter((value) => value > 0).length
  const gap = .025
  const ink = 1 - (count - 1) * gap
  const total = weights.reduce((sum, value) => sum + value, 0)
  let cursor = 0, seen = false
  const pills = weights.map((value, index) => {
    if (value > 0 && seen) cursor += gap
    const width = ink * value / total
    const pill = { x: cursor, width, opacity: value > 0 ? 1 : 0,
      float: value > 0 ? .014 * (2 * unit(row.seed, `${episode}:float:${index}`) - 1) : .02 }
    cursor += width
    if (value > 0) seen = true
    return pill
  })
  return { width: row.width, stable: false, pills, episode, cueAtMs }
}

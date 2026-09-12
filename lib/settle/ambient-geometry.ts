import type { SettleState } from './types'

export const AMBIENT_ROW_LIMIT = 14
export const AMBIENT_TICK_MS = 200
type ProfileSource = Pick<SettleState, 'source' | 'tokens' | 'snapshotCandidate'>

/** Quantized current ink occupancy, never final formatting or confidence.
 * Whole snapshots supply their current shape; positional commitments supply
 * only the contiguous prefix. A gap makes later line locations unknowable.
 * Sparse commitments still inform the separate total-height estimator.
 * Browser word wrapping can differ from these coarse advance budgets. */
export function deriveAmbientProfile(state: ProfileSource, availableWidthPx: number, measureAdvance: (text: string) => number): number[] {
  if (!Number.isFinite(availableWidthPx) || availableWidthPx <= 0) return []
  let text = ''
  if (state.source === 'snapshot') text = state.snapshotCandidate ?? ''
  else if (state.source === 'commit') {
    for (let position = 0; ; position++) {
      const token = state.tokens[position]
      if (!token || token.end) break
      text += token.text
    }
  }
  if (!text) return []
  const profile: number[] = []
  for (const line of text.split(/\r\n|\r|\n/)) {
    let advance = line ? measureAdvance(line) : 0
    if (!Number.isFinite(advance) || advance < 0) return []
    while (advance > availableWidthPx && profile.length < AMBIENT_ROW_LIMIT) {
      profile.push(1)
      advance -= availableWidthPx
    }
    if (profile.length >= AMBIENT_ROW_LIMIT) break
    profile.push(Math.max(0, Math.min(1, Math.ceil(25 * advance / availableWidthPx - 1e-8) / 25)))
  }
  return profile
}

export type AmbientRow = {
  seed: number; index: number; count: number; width: number
  periodMs: number; phaseMs: number; breathPeriodMs: number; breathPhaseMs: number; transitionMs: number
}
export type AmbientPill = { x: number; width: number; opacity: number; float: number }
export type AmbientRowGeometry = { width: number; stable: boolean; pills: AmbientPill[] }

function hash(value: string): number {
  let number = 2166136261
  for (let index = 0; index < value.length; index++) number = Math.imul(number ^ value.charCodeAt(index), 16777619)
  number = Math.imul(number ^ (number >>> 16), 0x7feb352d)
  number = Math.imul(number ^ (number >>> 15), 0x846ca68b)
  return (number ^ (number >>> 16)) >>> 0
}
function unit(seed: number, key: string): number { return hash(`${seed}:${key}`) / 4294967296 }
function clamp(value: number, minimum = 0, maximum = 1): number { return Math.max(minimum, Math.min(maximum, value)) }
function smooth(value: number): number { const t = clamp(value); return t * t * (3 - 2 * t) }

/** Stable identities and independently seeded rhythms avoid a five-row tile.
 * This variation is authored activity, not model state. */
export function createAmbientRows(seed: string | number): AmbientRow[] {
  const run = hash(String(seed))
  return Array.from({ length: AMBIENT_ROW_LIMIT }, (_, index) => {
    const rowSeed = hash(`${run}:row:${index}`)
    const periodMs = 4000 + 3000 * unit(rowSeed, 'period')
    const breathPeriodMs = 4200 + 2800 * unit(rowSeed, 'breath')
    return {
      seed: rowSeed, index,
      count: index === 0 || index === 7 ? 1 : 3 + Math.floor(4 * unit(rowSeed, 'count')),
      width: .66 + .3 * unit(rowSeed, 'width'), periodMs,
      phaseMs: periodMs * unit(rowSeed, 'phase'), breathPeriodMs,
      breathPhaseMs: breathPeriodMs * unit(rowSeed, 'breath-phase'),
      transitionMs: 500 + 200 * unit(rowSeed, 'transition'),
    }
  })
}

function weights(row: AmbientRow, cycle: number): number[] {
  // Only an interior cell disappears. First/last identities preserve bounds.
  const absent = unit(row.seed, `${cycle}:absent`) < .6
    ? 1 + Math.floor(unit(row.seed, `${cycle}:which`) * (row.count - 2)) : -1
  return Array.from({ length: row.count }, (_, index) => index === absent ? 0 : .35 + 1.4 * unit(row.seed, `${cycle}:weight:${index}`))
}

/** Successive seeded targets, not a repeated pair of arrangements. Positive
 * widths and gaps are normalized together, preserving nonoverlap under the
 * shared per-row interpolation. CSS follows with position-continuous easing;
 * this is not a velocity-preserving physical spring. */
export function ambientRowAt(row: AmbientRow, elapsedMs: number, occupancy?: number): AmbientRowGeometry {
  const rawWidth = occupancy !== undefined && Number.isFinite(occupancy) ? clamp(occupancy) : row.width
  // An authored minimum footprint keeps a short prefix from becoming a dot.
  // Preserve actual blank rows; this display floor is not measured text width.
  const width = rawWidth > 0 ? Math.max(.24, rawWidth) : 0
  const stable = row.count === 1 || (occupancy !== undefined && Number.isFinite(occupancy) && occupancy >= .94)
  if (stable) return {
    width, stable,
    pills: Array.from({ length: row.count }, (_, index) => ({ x: index ? 1 : 0, width: index ? 0 : 1, opacity: index ? 0 : 1, float: 0 })),
  }
  const time = (Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0) + row.phaseMs) / row.periodMs
  const cycle = Math.floor(time)
  // Brief rests let zero-width cells disappear. The smooth middle prevents
  // a jump when the next seeded cycle becomes the current one.
  const mix = smooth((time - cycle - .18) / .64)
  const from = weights(row, cycle), to = weights(row, cycle + 1)
  const values = from.map((value, index) => value + mix * (to[index]! - value))
  const presence = values.map((value) => clamp(value / .3))
  const gap = .02 + .008 * unit(row.seed, 'gap')
  const gaps = presence.map((value, index) => index ? gap * value : 0)
  const inkBudget = 1 - gaps.reduce((sum, value) => sum + value, 0)
  const total = values.reduce((sum, value) => sum + value, 0)
  let cursor = 0
  const pills = values.map((value, index) => {
    cursor += gaps[index]!
    const pillWidth = inkBudget * value / total
    const pill = {
      x: cursor, width: pillWidth, opacity: presence[index]!,
      float: .035 * (1 - presence[index]!) - .018 * Math.sin(2 * Math.PI * time + index * .7) * presence[index]!,
    }
    cursor += pillWidth
    return pill
  })
  return { width, stable, pills }
}

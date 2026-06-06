import type { MeasuredAtom } from '../types'

// Aurora groups words into VISUAL lines (by their measured y), not logical
// source lines. A single wrapped paragraph is one logical line but several
// visual rows, and aurora's whole identity is a luminous band sweeping each
// row and locking its tokens as it passes. Both the strategy (lock timing)
// and the overlay (the bands) derive from this same grouping so the glow
// tracks the words exactly.

export const AURORA_PRE_ROLL_MS = 1400
export const AURORA_BAND_SWEEP_MS = 1050
export const AURORA_BAND_STAGGER_MS = 240
export const AURORA_WORD_ACTIVATE_MS = 220

export type AuroraGroup = {
  y: number
  h: number
  minC: number // x of the leftmost word center
  maxC: number // x of the rightmost word center
  words: MeasuredAtom[]
}

// Group measured atoms into visual rows by vertical center, with a tolerance
// of ~60% of line height so glyphs of differing heights still share a row.
export function groupByVisualLine(words: MeasuredAtom[]): AuroraGroup[] {
  if (words.length === 0) return []
  const sorted = [...words].sort((a, b) => a.bbox.y - b.bbox.y || a.bbox.x - b.bbox.x)
  const groups: AuroraGroup[] = []
  for (const w of sorted) {
    const cx = w.bbox.x + w.bbox.w / 2
    const cy = w.bbox.y + w.bbox.h / 2
    const last = groups[groups.length - 1]
    if (last && Math.abs(cy - (last.y + last.h / 2)) <= last.h * 0.6) {
      last.words.push(w)
      last.minC = Math.min(last.minC, cx)
      last.maxC = Math.max(last.maxC, cx)
      last.y = Math.min(last.y, w.bbox.y)
      last.h = Math.max(last.h, w.bbox.h)
    } else {
      groups.push({ y: w.bbox.y, h: w.bbox.h, minC: cx, maxC: cx, words: [w] })
    }
  }
  return groups
}

export function auroraTotalMs(lineCount: number): number {
  if (lineCount === 0) return 0
  return (
    AURORA_PRE_ROLL_MS +
    (lineCount - 1) * AURORA_BAND_STAGGER_MS +
    AURORA_BAND_SWEEP_MS +
    AURORA_WORD_ACTIVATE_MS
  )
}

// What the overlay needs per row: geometry + a SCALE-INVARIANT progress window
// (startP..endP as fractions of the native total). Because the choreographer
// normalizes progress to 0..1 over the (possibly duration-scaled) total, these
// native ratios line up with the actual lock progress at any thinking speed.
export type AuroraLine = {
  idx: number
  y: number
  h: number
  minC: number
  maxC: number
  startP: number
  endP: number
}

export function computeAuroraLines(words: MeasuredAtom[]): AuroraLine[] {
  const groups = groupByVisualLine(words)
  const total = auroraTotalMs(groups.length)
  if (total === 0) return []
  return groups.map((g, idx) => {
    const startMs = AURORA_PRE_ROLL_MS + idx * AURORA_BAND_STAGGER_MS
    const endMs = startMs + AURORA_BAND_SWEEP_MS
    return { idx, y: g.y, h: g.h, minC: g.minC, maxC: g.maxC, startP: startMs / total, endP: endMs / total }
  })
}

import type { CSSProperties } from 'react'

// The voice: five tokens on the one surface. Each has a range that is an
// invariant, so a brand can color the arrival and cannot change when text
// becomes available, whether it moves, or what the status words say.

export type MarkShape = 'tick' | 'dot' | 'dash' | 'square'

export type SettleVoice = {
  /** the glyph of a field cell and of the margin mark */
  mark: MarkShape
  /** how much a cell flares when it commits, 0 to 1; gone within 600 ms */
  bloom: number
  /** the opacity ramp of a passage arriving on the page, in ms; never a transform, never a blur */
  onset: number
  /** breath period multiplier of the margin mark while receiving, 0.7 to 1.4 on a 2400 ms base */
  tempo: number
  /** the contrast between open and committed cells, and how dim forming text rests, 0 to 1 */
  grain: number
}

export const MARK_SHAPES: readonly MarkShape[] = ['tick', 'dot', 'dash', 'square']

export const SETTLE_RANGES: Record<Exclude<keyof SettleVoice, 'mark'>, readonly [number, number]> = {
  bloom: [0, 1],
  onset: [0, 240],
  tempo: [0.7, 1.4],
  grain: [0, 1],
}

/** The breath period at tempo 1. */
export const BREATH_MS = 2400
/** The cell's flare is over within this. */
export const BLOOM_MS = 240

export const DEFAULT_SETTLE_VOICE: SettleVoice = { mark: 'tick', bloom: 0.6, onset: 160, tempo: 1, grain: 0.5 }

export function clampSettleVoice(voice: Partial<SettleVoice>): SettleVoice {
  const out: SettleVoice = { ...DEFAULT_SETTLE_VOICE }
  if (voice.mark && MARK_SHAPES.includes(voice.mark)) out.mark = voice.mark
  for (const key of Object.keys(SETTLE_RANGES) as (keyof typeof SETTLE_RANGES)[]) {
    const v = voice[key]
    if (typeof v !== 'number' || Number.isNaN(v)) continue
    const [lo, hi] = SETTLE_RANGES[key]
    out[key] = Math.min(hi, Math.max(lo, v))
  }
  return out
}

/** The CSS variables a voice sets on its wrapper; the surface's stylesheet reads them. */
export function settleVoiceStyle(voice: Partial<SettleVoice>): CSSProperties {
  const v = clampSettleVoice(voice)
  // forming text rests between 62 and 84 percent of the page's ink, so it is
  // at least 3:1 against every brand surface and never reads as the page
  const forming = 0.84 - 0.22 * v.grain
  const open = 0.34 - 0.2 * v.grain
  return {
    ['--settle-bloom' as string]: v.bloom.toFixed(2),
    ['--settle-onset' as string]: `${Math.round(v.onset)}ms`,
    ['--settle-breath' as string]: `${Math.round(BREATH_MS / v.tempo)}ms`,
    ['--settle-grain' as string]: v.grain.toFixed(2),
    ['--settle-forming-alpha' as string]: forming.toFixed(2),
    ['--settle-open-alpha' as string]: open.toFixed(2),
  } as CSSProperties
}

export const SETTLE_PRESETS = {
  'after-tokens': clampSettleVoice({ mark: 'tick', bloom: 0.6, onset: 160, tempo: 1, grain: 0.5 }),
  halcyon: clampSettleVoice({ mark: 'dot', bloom: 0.3, onset: 240, tempo: 0.85, grain: 0.65 }),
  felt: clampSettleVoice({ mark: 'square', bloom: 0.9, onset: 200, tempo: 1.05, grain: 0.45 }),
  pulse: clampSettleVoice({ mark: 'dash', bloom: 0.4, onset: 180, tempo: 0.95, grain: 0.6 }),
  voltage: clampSettleVoice({ mark: 'tick', bloom: 0, onset: 0, tempo: 1.3, grain: 0.35 }),
} as const

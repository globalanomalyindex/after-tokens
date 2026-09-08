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
  /** the settling of the page's ink through a released passage's letterforms, in ms; never a transform, never a blur */
  onset: number
  /** breath period multiplier of the margin mark while receiving, 0.7 to 1.4 on a 2400 ms base */
  tempo: number
  /** how far the available ink sits from the page's, inside the contrast floor, and the weight of the placeholders, 0 to 1 */
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

// ----- the secondary ink -----------------------------------------------------
// An available word is read, so its ink must clear WCAG's 4.5:1 against the
// ground it sits on. The secondary ink is the page's ink moved partway toward
// the ground, as far as the contrast floor allows; where the floor leaves no
// room to dim (a saturated surface with a light ink), the state is carried by
// a tint toward the brand's accent instead. The mixing here is an sRGB
// approximation of the oklab mix the stylesheet performs, with a margin.

/** The contrast the secondary ink must clear on every ground, with margin over 4.5. */
export const SECONDARY_CONTRAST_FLOOR = 4.9

function channel(hex: string, i: number): number {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return parseInt(full.slice(i * 2, i * 2 + 2), 16)
}
function linear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
export function luminance(hex: string): number {
  return 0.2126 * linear(channel(hex, 0)) + 0.7152 * linear(channel(hex, 1)) + 0.0722 * linear(channel(hex, 2))
}
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
/** a mixed toward b, keeping `keep` of a, in gamma sRGB (an approximation of oklab mixing). */
export function mixHex(a: string, b: string, keep: number): string {
  const c = [0, 1, 2].map((i) => Math.round(channel(a, i) * keep + channel(b, i) * (1 - keep)))
  return '#' + c.map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('')
}

export type InkPair = { ink: string; ground: string }
export type SecondaryInk = { keep: number; tint: number }

/** The share of the page's ink the secondary keeps, and the accent tint it carries, so that it clears the floor on every ground. */
export function secondaryInk(pairs: InkPair[], accent: string, grain: number): SecondaryInk {
  // grain asks for a dimmer secondary; the floor decides what it gets
  let keep = 0.78 - 0.14 * grain
  const passes = (k: number, t: number) => pairs.every(({ ink, ground }) => contrastRatio(mixHex(mixHex(ink, ground, k), accent, 1 - t), ground) >= SECONDARY_CONTRAST_FLOOR)
  while (keep < 1 && !passes(keep, 0)) keep = Math.min(1, Math.round((keep + 0.02) * 100) / 100)
  // little room to dim: carry the state in hue instead
  let tint = keep > 0.86 ? 0.24 : 0
  while (tint > 0 && !passes(keep, tint)) tint = Math.max(0, Math.round((tint - 0.04) * 100) / 100)
  return { keep, tint }
}

export type VoiceColors = { ink: string; surface: string; stageText: string; stage: string; accent: string }

/** The CSS variables a voice sets on its wrapper; the surface's stylesheet reads them. */
export function settleVoiceStyle(voice: Partial<SettleVoice>, colors?: VoiceColors): CSSProperties {
  const v = clampSettleVoice(voice)
  const open = 0.32 - 0.14 * v.grain
  const secondary = colors
    ? secondaryInk([{ ink: colors.ink, ground: colors.surface }, { ink: colors.stageText, ground: colors.stage }], colors.accent, v.grain)
    : { keep: 0.78 - 0.14 * v.grain, tint: 0 }
  return {
    ['--settle-bloom' as string]: v.bloom.toFixed(2),
    ['--settle-onset' as string]: `${Math.round(v.onset)}ms`,
    ['--settle-breath' as string]: `${Math.round(BREATH_MS / v.tempo)}ms`,
    ['--settle-grain' as string]: v.grain.toFixed(2),
    ['--settle-ink-2-keep' as string]: `${Math.round(secondary.keep * 100)}%`,
    ['--settle-ink-2-tint' as string]: `${Math.round(secondary.tint * 100)}%`,
    ['--settle-open-alpha' as string]: open.toFixed(2),
  } as CSSProperties
}

export const SETTLE_PRESETS = {
  'after-tokens': clampSettleVoice({ mark: 'tick', bloom: 0.6, onset: 200, tempo: 1, grain: 0.5 }),
  halcyon: clampSettleVoice({ mark: 'dot', bloom: 0.3, onset: 240, tempo: 0.85, grain: 0.65 }),
  felt: clampSettleVoice({ mark: 'square', bloom: 0.9, onset: 220, tempo: 1.05, grain: 0.45 }),
  pulse: clampSettleVoice({ mark: 'dash', bloom: 0.4, onset: 200, tempo: 0.95, grain: 0.6 }),
  voltage: clampSettleVoice({ mark: 'tick', bloom: 0, onset: 0, tempo: 1.3, grain: 0.35 }),
} as const

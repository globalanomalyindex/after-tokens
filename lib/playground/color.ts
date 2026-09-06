// Color math for the playground. One source of truth so the hue wheel, the
// stage accent, and the per-word "rainbow" text all agree on what a given hue
// looks like.
//
// We work in OKLCH and pin lightness + chroma to a tasteful, legible band.
// That lets the picker roam the entire wheel without ever landing on a garish
// neon or a muddy dark — every hue comes back luminous enough to read on the
// near-black stage and never oversaturated.

// Lightness/chroma the accent + resolved text ride at. L is high so any hue is
// readable on the dark stage; C is moderate so nothing screams.
export const ACCENT_L = 0.8
export const ACCENT_C = 0.148

export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

// A single accent color from a hue. Used for --accent (overlays, glow) and for
// the resolved-text tint in solid-color mode.
export function hueToAccent(hue: number): string {
  return `oklch(${ACCENT_L} ${ACCENT_C} ${normalizeHue(hue)})`
}

// A dimmer companion of the same hue, for chrome that should read as "this
// color" without competing with the text (track fills, faint borders).
export function hueToWash(hue: number, pct = 22): string {
  return `color-mix(in oklab, ${hueToAccent(hue)} ${pct}%, transparent)`
}

// Spectrum color for t in [0,1]. Used by the "rainbow" text option: each word
// gets a stepped hue so the answer paints itself across the wheel as it locks.
// `spread` controls how much of the wheel the line covers (1 = full 360).
export function spectrumColor(t: number, spread = 1, originHue = 0): string {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t
  return hueToAccent(originHue + clamped * 360 * spread)
}

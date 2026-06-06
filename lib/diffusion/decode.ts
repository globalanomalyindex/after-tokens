import type { GlyphStyle } from './glyph-styles'

// Per-character "decode" rendering for the non-word glyph styles. This is the
// behavior the static specimens above the playground use: a character does not
// randomly cycle whole-word strings — it RESOLVES through ordered stages
// (solid block -> shaded -> dotted -> letter flicker -> final) as the mode's
// choreography reaches it. The mode supplies WHEN each word resolves; the style
// supplies the stages it passes through. So "aurora + blocks" makes the blocks
// dissipate exactly as the aurora band sweeps each row, "mycelium + matrix"
// makes the katakana settle in mycelium's organic order, and so on.

export function isDecodeStyle(s: GlyphStyle): boolean {
  return s !== 'words'
}

// Fraction of the total progress a word spends decoding before its lock moment.
// Each word's window ends at its mode-assigned lock time, so the windows cascade
// in whatever order the mode resolves words.
export const DECODE_WINDOW = 0.26
// Within a word's window each char resolves over this fraction; char starts are
// staggered across the remainder so the word materializes out of noise at once
// rather than left to right.
export const CHAR_RESOLVE_SPAN = 0.55
// How often a still-noisy char picks a fresh glyph, and how often we allow a
// DOM rewrite. Phase math is cheap; visible churn is throttled.
export const NOISE_FRAME_MS = 64
export const DRAW_FRAME_MS = 1000 / 30

const FULL_BLOCK = '█'
const SHADES = ['▓', '▒', '░']
const BRAILLE_BASE = 0x2840
const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
// Half-width katakana: one cell wide in a monospace font, so matrix decode
// stays width-stable like every other glyph.
const KATAKANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'
const BINARY = '01'

function frac(x: number): number {
  return x - Math.floor(x)
}
function hash(n: number): number {
  return frac(Math.sin(n * 12.9898 + 78.233) * 43758.5453)
}
function pickFrom(pool: string, i: number, tick: number): string {
  const idx = Math.floor(hash(i * 7.31 + tick * 1.137) * pool.length)
  return pool.charAt(idx) || pool.charAt(0)
}
function shade(n: number): string {
  const idx = ((n % SHADES.length) + SHADES.length) % SHADES.length
  return SHADES[idx] as string
}
function braille(i: number, tick: number): string {
  // Bias toward the denser part of the braille block so noise reads as texture.
  return String.fromCharCode(BRAILLE_BASE + Math.floor(hash(i * 3.77 + tick * 2.131) * 0xc0))
}

// Stable seed in [0,1) for a character's start offset within its word window.
export function charSeed(wordIndex: number, charIndex: number): number {
  return hash(wordIndex * 31.7 + charIndex * 5.13 + 11.13)
}

// The glyph a character shows at local progress p in [0,1]: 0 = full noise,
// 1 = the final character. `tick` advances the noise churn.
export function decodeGlyph(
  style: GlyphStyle,
  finalChar: string,
  p: number,
  i: number,
  tick: number,
): string {
  if (p >= 1) return finalChar
  if (style === 'matrix') {
    if (p < 0.45) return pickFrom(KATAKANA, i, tick)
    if (p < 0.78) return braille(i, tick) // rain dissolves into dots
    if (p < 0.93) return pickFrom(LATIN, i, tick)
    return finalChar
  }
  if (style === 'binary') {
    if (p < 0.5) return pickFrom(BINARY, i, tick)
    if (p < 0.8) return braille(i, tick)
    if (p < 0.93) return pickFrom(BINARY, i, tick + 2)
    return finalChar
  }
  // blocks (default decode): solid -> shaded -> dotted -> letters -> final
  if (p < 0.18) return FULL_BLOCK
  if (p < 0.55) return shade(tick + i)
  if (p < 0.78) return braille(i, tick)
  if (p < 0.93) return pickFrom(LATIN, i, tick)
  return finalChar
}

// The glyph shown at p = 0, used for the first paint so the word starts as a
// noise field (never a flash of the final text) while keeping monospace width.
export function noiseInit(style: GlyphStyle): string {
  if (style === 'matrix') return 'ｱ'
  if (style === 'binary') return '0'
  return FULL_BLOCK
}

// Dim noise -> bright resolved color. Uses color-mix so it tracks any oklch
// accent or per-word spectrum hue. Early noise sits at a muted, still-visible
// version of the text color; it warms to the full target as the char resolves.
const NOISE_DIM = 'color-mix(in oklab, var(--stage-text) 26%, var(--stage))'
export function decodeColor(target: string, p: number): string {
  if (p >= 0.94) return target
  const pct = p <= 0 ? 0 : Math.min(100, Math.round(p * 100))
  return `color-mix(in oklab, ${target} ${pct}%, ${NOISE_DIM})`
}

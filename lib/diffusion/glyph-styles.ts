import type { WordAtom } from './tokenize'
import { buildCandidatesPerAtom } from './candidate-pool'

// A "glyph style" controls the VOCABULARY a word cycles through while it is
// still pending — the visual noise the diffusion resolves out of. 'words' is
// the default (topical near-words, the case study's voice). The others swap in
// a different alphabet so the same choreography can read as a terminal decode,
// a matrix-rain console, or a binary stream — composable with any motion mode.
//
// The candidate builders return the SAME shape as candidate-pool's builder
// (string[][], one ordered ring per atom) so DiffusionText can swap freely.

export type GlyphStyle = 'words' | 'blocks' | 'matrix' | 'binary'

export const GLYPH_STYLE_ITEMS: { id: GlyphStyle; label: string }[] = [
  { id: 'words', label: 'Words' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'matrix', label: 'Matrix' },
  { id: 'binary', label: 'Binary' },
]

const RING = 9

// Each non-word style is a glyph alphabet plus an approximate width factor
// versus an average latin glyph. Full-width blocks and katakana need FEWER
// cells to fill the same slot, so the cycling noise stays about the width of
// the final word and the layout doesn't jitter as it resolves.
type Pool = { glyphs: string[]; widthFactor: number }

const POOLS: Record<Exclude<GlyphStyle, 'words'>, Pool> = {
  blocks: {
    glyphs: ['█', '▓', '▒', '░', '▙', '▚', '▟', '▜', '▖', '▗', '⣿', '⣷', '⡿', '⢿', '⠿', '⣟'],
    widthFactor: 0.62,
  },
  matrix: {
    glyphs: [
      ...'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
    ],
    widthFactor: 0.6,
  },
  binary: {
    glyphs: ['0', '1'],
    widthFactor: 0.92,
  },
}

function splitPunct(text: string): { lead: string; trail: string; core: string } {
  const lead = text.match(/^[^\p{L}\p{N}]+/u)?.[0] ?? ''
  const trail = text.match(/[^\p{L}\p{N}]+$/u)?.[0] ?? ''
  const core = text.replace(/^[^\p{L}\p{N}]+/u, '').replace(/[^\p{L}\p{N}]+$/u, '')
  return { lead, trail, core }
}

// Deterministic xorshift32 hash -> [0,1). Fixed run-to-run so the noise field
// looks authored rather than re-randomized every cycle.
function hash(n: number): number {
  let x = n >>> 0
  x ^= x << 13
  x >>>= 0
  x ^= x >>> 17
  x ^= x << 5
  x >>>= 0
  return x / 4294967296
}

function glyphCandidates(atoms: WordAtom[], style: Exclude<GlyphStyle, 'words'>): string[][] {
  const pool = POOLS[style]
  return atoms.map((atom) => {
    const { lead, trail, core } = splitPunct(atom.text)
    // Pure-punctuation tokens have no core to scramble — leave them as-is.
    if (core.length === 0) return [atom.text]
    const count = Math.max(1, Math.round(core.length * pool.widthFactor))
    const ring: string[] = []
    for (let r = 0; r < RING; r++) {
      let s = ''
      for (let c = 0; c < count; c++) {
        const h = hash(atom.index * 92821 + r * 6151 + c * 769)
        s += pool.glyphs[Math.floor(h * pool.glyphs.length)] ?? '█'
      }
      ring.push(`${lead}${s}${trail}`)
    }
    return ring
  })
}

export function buildCandidates(atoms: WordAtom[], style: GlyphStyle = 'words'): string[][] {
  if (style === 'words') return buildCandidatesPerAtom(atoms)
  return glyphCandidates(atoms, style)
}

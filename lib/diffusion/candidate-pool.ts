import type { WordAtom } from './tokenize'

// Generic word pool, organized by character length. Used for "noise" tokens
// during the pending phase. Keeps visual width roughly stable per slot.
const GENERIC_POOL_BY_LENGTH: Record<number, string[]> = {
  1: ['a', 'I'],
  2: ['is', 'to', 'or', 'so', 'no', 'by', 'we', 'up', 'do', 'go', 'on', 'at'],
  3: ['the', 'and', 'for', 'try', 'see', 'how', 'now', 'yet', 'one', 'two', 'few'],
  4: ['this', 'word', 'with', 'when', 'each', 'them', 'will', 'noise', 'next', 'over'],
  5: ['model', 'maybe', 'guess', 'noise', 'value', 'shape', 'while', 'where', 'until'],
  6: ['random', 'choose', 'almost', 'either', 'unsure', 'becomes', 'thinks', 'sample'],
  7: ['perhaps', 'unknown', 'thinking', 'unclear', 'partial', 'between'],
  8: ['possibly', 'somewhere', 'iterating', 'estimate', 'sampling'],
  9: ['returning', 'computing', 'uncertain', 'gradients'],
  10: ['converging', 'estimating', 'predicting'],
  11: ['considering', 'discovering'],
  12: ['interpolating', 'crystallizing'],
}

function stripWord(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, '')
}

function nearestLengthPool(target: number): string[] {
  // Find candidates at length, then ±1, ±2 from the target.
  const ranges = [target, target - 1, target + 1, target - 2, target + 2]
  const merged: string[] = []
  for (const r of ranges) {
    if (r in GENERIC_POOL_BY_LENGTH) {
      const arr = GENERIC_POOL_BY_LENGTH[r]
      if (arr) merged.push(...arr)
    }
  }
  if (merged.length === 0) return ['noise', 'token', 'guess']
  return merged
}

/**
 * For each atom, build an ordered ring of candidate strings the same approximate
 * visual length as the final word. The final atom's own letters are preserved
 * in punctuation (so commas, periods stick around).
 */
export function buildCandidatesPerAtom(atoms: WordAtom[]): string[][] {
  // Also pull alphabetic-only versions of OTHER response words as candidates,
  // so the noise feels topical.
  const ownPool = atoms
    .map((a) => stripWord(a.text))
    .filter((w) => w.length >= 2)

  return atoms.map((atom, idx) => {
    const core = stripWord(atom.text)
    const leadingPunct = atom.text.match(/^[^\p{L}\p{N}]+/u)?.[0] ?? ''
    const trailingPunct = atom.text.match(/[^\p{L}\p{N}]+$/u)?.[0] ?? ''
    const targetLen = Math.max(1, core.length)
    const generic = nearestLengthPool(targetLen)
    // Take words from own pool of similar length, excluding this exact word
    const own = ownPool.filter((w) => w !== core && Math.abs(w.length - targetLen) <= 2)
    const merged = [...own, ...generic]
    // Deterministic shuffle seeded by index
    const seed = idx * 9301 + 49297
    const rotated = merged
      .map((w, i) => ({ w, k: (i * 7919 + seed) >>> 0 }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.w)
    const ring = rotated.slice(0, 9)
    // Restore punctuation by wrapping each candidate
    return ring.map((w) => `${leadingPunct}${w}${trailingPunct}`)
  })
}

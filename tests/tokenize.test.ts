import { describe, expect, it } from 'vitest'
import { tokenize } from '@/lib/diffusion/tokenize'

describe('tokenize', () => {
  it('splits a single sentence into word atoms preserving punctuation', () => {
    const atoms = tokenize('Speed. Diffusion resolves a response in parallel.')
    expect(atoms).toHaveLength(7)
    expect(atoms[0]?.text).toBe('Speed.')
    expect(atoms[1]?.text).toBe('Diffusion')
    expect(atoms[6]?.text).toBe('parallel.')
  })

  it('assigns line index based on newlines in input', () => {
    const atoms = tokenize('Line one.\nLine two here.')
    const onLine1 = atoms.filter((a) => a.lineIndex === 1)
    expect(onLine1).toHaveLength(3)
  })

  it('assigns a monotonic index across all atoms', () => {
    const atoms = tokenize('a b c d')
    expect(atoms.map((a) => a.index)).toEqual([0, 1, 2, 3])
  })

  it('returns empty array for empty input', () => {
    expect(tokenize('')).toEqual([])
    expect(tokenize('   ')).toEqual([])
  })
})

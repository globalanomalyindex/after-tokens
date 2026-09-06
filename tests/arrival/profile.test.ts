import { describe, expect, it } from 'vitest'
import { arrivalProfile, kendallTau, locksFromEvents, profileSummary } from '@/lib/arrival/profile'
import type { PhraseAtom } from '@/lib/arrival/phrases'

// Two phrases of four words, salience flat except one gist word per phrase.
function atoms(): PhraseAtom[] {
  const words = ['a', 'crew', 'of', 'thieves.', 'the', 'vault', 'is', 'empty.']
  return words.map((text, index) => ({ text, index, lineIndex: 0, salience: text === 'thieves.' || text === 'vault' ? 1 : 0.2 }))
}

describe('arrival profile', () => {
  it('is empty for an empty arrival', () => {
    const p = arrivalProfile({ atoms: [], locks: [], total: 0 })
    expect(p.words).toBe(0)
    expect(p.tension.max).toBe(0)
  })

  it('scores a typewriter: one open loop, closures at every phrase, no inversions, tau of one', () => {
    const a = atoms()
    const locks = a.map((_, i) => 100 + i * 100)
    const p = arrivalProfile({ atoms: a, locks, total: 1000 })
    expect(p.phrases).toBe(2)
    expect(p.tension.max).toBe(1)
    expect(p.fluency.inversions).toBe(0)
    // a typewriter slower than the reader leaves every preview invalid; this one is faster than a fixation
    expect(p.fluency.previewCost).toBe(0)
    const slow = arrivalProfile({ atoms: a, locks: a.map((_, i) => 100 + i * 400), total: 3500 })
    expect(slow.fluency.previewCost).toBeGreaterThan(0.5)
    expect(p.fluency.tau).toBe(1)
    expect(p.closure.count).toBe(2)
    expect(p.closure.steps).toBe(8)
    // two of eight steps close a phrase
    expect(p.closure.alignment).toBeCloseTo(0.25, 6)
    // the gist (top fifth by salience: 2 words) lands when 'vault' locks, word 5
    expect(p.peak.gistAt).toBeCloseTo(600 / 1000, 6)
  })

  it('scores a fade: no loop ever opens, one step, everything at the end', () => {
    const a = atoms()
    const locks = a.map(() => 900)
    const p = arrivalProfile({ atoms: a, locks, total: 1000 })
    expect(p.tension.max).toBe(0)
    expect(p.closure.steps).toBe(1)
    expect(p.closure.alignment).toBe(1)
    expect(p.peak.at).toBeGreaterThan(0.85)
    expect(p.peak.gistAt).toBeCloseTo(0.9, 6)
    expect(p.fluency.tau).toBe(0)
    expect(p.peak.endWeight).toBeGreaterThan(1)
  })

  it('counts both phrases open when their words interleave, and a within-phrase inversion', () => {
    const a = atoms()
    // 'crew' then 'vault' then the rest; 'thieves.' before 'of' inside phrase one
    const locks = [100, 500, 400, 300, 700, 200, 800, 900]
    const p = arrivalProfile({ atoms: a, locks, total: 1000 })
    expect(p.tension.max).toBe(2)
    expect(p.fluency.inversions).toBeGreaterThan(0)
    expect(p.fluency.previewCost).toBeGreaterThan(0)
    expect(p.fluency.tau).toBeLessThan(1)
  })

  it('reads locks from a timeline and reports the latest resolved event per word', () => {
    const locks = locksFromEvents(
      [
        { wordIndex: 0, state: 'resolving', t: 10 },
        { wordIndex: 0, state: 'resolved', t: 50 },
        { wordIndex: 1, state: 'resolved', t: 80 },
      ],
      2,
    )
    expect(locks).toEqual([50, 80])
    expect(kendallTau([1, 2, 3])).toBe(1)
    expect(kendallTau([3, 2, 1])).toBe(-1)
    expect(kendallTau([1, 1, 1])).toBe(0)
  })

  it('summarizes with rounded scalars and no series', () => {
    const a = atoms()
    const s = profileSummary(arrivalProfile({ atoms: a, locks: a.map((_, i) => 100 + i * 100), total: 1000 }))
    expect(s).not.toHaveProperty('series')
    expect(s.tensionMax).toBe(1)
    expect(s.totalMs).toBe(1000)
  })
})

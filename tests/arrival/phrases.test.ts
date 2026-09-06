import { describe, expect, it } from 'vitest'
import { PHRASE_MAX_WORDS, phraseOfWord, segmentPhrases, type PhraseAtom } from '@/lib/arrival/phrases'
import { tokenize } from '@/lib/diffusion/tokenize'
import { wordSalience } from '@/lib/diffusion/salience'

function atoms(text: string, topic?: string): PhraseAtom[] {
  const raw = tokenize(text)
  const sal = wordSalience(raw, topic)
  return raw.map((a, i) => ({ ...a, salience: sal[i] }))
}

describe('phrase segmentation', () => {
  it('returns nothing for nothing', () => {
    expect(segmentPhrases([])).toEqual([])
  })

  it('ends a phrase at terminal punctuation and covers every word exactly once', () => {
    const a = atoms('Mild. A little fog this morning but the sun should break through by noon. Hold off on the umbrella.')
    const ph = segmentPhrases(a)
    expect(ph[0]).toMatchObject({ start: 0, end: 0 })
    const covered = phraseOfWord(ph, a.length)
    expect(covered.every((id) => id >= 0)).toBe(true)
    for (let i = 1; i < ph.length; i++) expect(ph[i]!.start).toBe(ph[i - 1]!.end + 1)
    expect(ph[ph.length - 1]!.end).toBe(a.length - 1)
  })

  it('starts a phrase at a line break and at a list marker', () => {
    const a = atoms('Five to start with:\n1. Drift Cobalt\n2. Folded Mango\n3. Wet Slate at Dusk')
    const ph = segmentPhrases(a)
    const starts = ph.map((p) => a[p.start]!.text)
    expect(starts).toEqual(['Five', '1.', '2.', '3.'])
  })

  it('splits a long run into even chunks no longer than the cap', () => {
    const a = atoms(Array.from({ length: 19 }, (_, i) => `word${i}`).join(' '))
    const ph = segmentPhrases(a)
    expect(ph).toHaveLength(3)
    for (const p of ph) expect(p.end - p.start + 1).toBeLessThanOrEqual(PHRASE_MAX_WORDS)
    expect(ph.map((p) => p.end - p.start + 1)).toEqual([6, 6, 7])
  })

  it('ends a phrase at a comma only once it holds three words', () => {
    const a = atoms('Yes, and then, after that, we left.')
    const ph = segmentPhrases(a)
    // "Yes," alone does not close; "Yes, and then," does (three words)
    expect(ph[0]).toMatchObject({ start: 0, end: 2 })
  })

  it('picks the most salient word as the nucleus and scores the phrase by it', () => {
    const a = atoms('The crew empties the vault beneath the city.', 'a heist on a vault')
    const ph = segmentPhrases(a)
    expect(ph).toHaveLength(1)
    expect(a[ph[0]!.nucleus]!.text).toBe('vault')
    expect(ph[0]!.salience).toBeCloseTo(a[ph[0]!.nucleus]!.salience!, 6)
  })
})

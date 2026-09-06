import { isListMarker } from '@/lib/diffusion/salience'

// The phrase: the perceptual unit of closure. A reader does not close a
// figure one word at a time; the whole that the mind completes is a clause,
// a line, a list item. Every metric in the arrival profile that speaks of an
// open loop or a closure speaks of a phrase, so the segmentation is stated
// here once, deterministically, and named as a limit: it is a punctuation
// and line-break rule for English and Latin script, and a product would
// replace it with a parser.
//
// Rules, in order:
//   a line break starts a phrase
//   a list marker ("1.", "a)", a bullet) starts a phrase
//   a word ending in . ! ? ; : ends a phrase
//   a word ending in , ends a phrase when the phrase already holds three words
//   a phrase longer than PHRASE_MAX_WORDS splits into even chunks

export type PhraseAtom = {
  text: string
  index: number
  lineIndex: number
  /** gist hint in [0, 1], see lib/diffusion/salience.ts */
  salience?: number
}

export type Phrase = {
  id: number
  /** first atom position, inclusive */
  start: number
  /** last atom position, inclusive */
  end: number
  /** the most salient word in the phrase: the reason it opens, and the word that ghosts first */
  nucleus: number
  /** the phrase's salience: its most salient word */
  salience: number
}

export const PHRASE_MAX_WORDS = 8
const HARD_END = /[.!?;:]["”')\]]*$/
const SOFT_END = /,["”')\]]*$/

const DEFAULT_SALIENCE = 0.3

function sal(atom: PhraseAtom): number {
  return atom.salience ?? DEFAULT_SALIENCE
}

function finish(atoms: PhraseAtom[], start: number, end: number, out: Phrase[]): void {
  const len = end - start + 1
  if (len <= 0) return
  const chunks = Math.ceil(len / PHRASE_MAX_WORDS)
  for (let c = 0; c < chunks; c++) {
    const s = start + Math.floor((c * len) / chunks)
    const e = start + Math.floor(((c + 1) * len) / chunks) - 1
    let nucleus = s
    let best = -Infinity
    for (let p = s; p <= e; p++) {
      const v = sal(atoms[p]!)
      if (v > best) {
        best = v
        nucleus = p
      }
    }
    out.push({ id: out.length, start: s, end: e, nucleus, salience: best })
  }
}

export function segmentPhrases(atoms: PhraseAtom[]): Phrase[] {
  const out: Phrase[] = []
  const n = atoms.length
  if (n === 0) return out
  let start = 0
  for (let p = 0; p < n; p++) {
    const atom = atoms[p]!
    const prev = atoms[p - 1]
    const lineBreak = prev != null && prev.lineIndex !== atom.lineIndex
    if (p > start && (lineBreak || isListMarker(atom.text))) {
      finish(atoms, start, p - 1, out)
      start = p
    }
    const len = p - start + 1
    // a list marker begins its phrase; its period does not end one
    const hardEnd = !isListMarker(atom.text) && HARD_END.test(atom.text)
    const softEnd = !hardEnd && SOFT_END.test(atom.text) && len >= 3
    if (hardEnd || softEnd) {
      finish(atoms, start, p, out)
      start = p + 1
    }
  }
  if (start < n) finish(atoms, start, n - 1, out)
  return out
}

/** For each atom position, the id of the phrase it belongs to. */
export function phraseOfWord(phrases: Phrase[], n: number): number[] {
  const out = new Array<number>(n).fill(-1)
  for (const ph of phrases) for (let p = ph.start; p <= ph.end; p++) out[p] = ph.id
  return out
}

// The neuroscience the thesis leans on, as a small glossary. Each term renders
// inline as a solid bright "chip" that opens a dictionary-style definition
// window (headword, phonetic respelling + part of speech, a one-line gloss).
//
// The colors are flat, high-chroma graphic solids — a punchy technical palette
// that pops on the bone surface with dark ink text sitting legibly on top. The
// green is a clean emerald (hue ~165), never a vivid electric lime.

export type GlossaryTerm = {
  /** phonetic respelling, dictionary-style */
  pron: string
  /** part of speech tag, e.g. "noun" */
  pos: string
  /** one-line gloss, lowercase to match the editorial voice */
  def: string
  /** flat bright accent for the chip + window framing */
  color: string
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  'predictive coding': {
    pron: 'prə-ˈdik-tiv ˈkō-diŋ',
    pos: 'noun',
    def: 'the brain runs on forecasts, constantly guessing its next input and only flagging where reality disagrees.',
    color: 'oklch(0.78 0.14 232)', // azure
  },
  'prediction error': {
    pron: 'prə-ˈdik-shən ˈer-ər',
    pos: 'noun',
    def: 'the gap between what the brain expected and what actually arrived. the surprise it learns from.',
    color: 'oklch(0.71 0.19 33)', // coral
  },
  dopamine: {
    pron: 'ˈdō-pə-ˌmēn',
    pos: 'noun',
    def: 'the neurotransmitter that fires when an expected reward resolves, tagging the moment as worth chasing again.',
    color: 'oklch(0.72 0.2 352)', // magenta
  },
  'zeigarnik effect': {
    pron: 'zī-ˈgär-nik i-ˈfekt',
    pos: 'noun',
    def: 'the mind holds onto unfinished tasks far more tightly than ones already complete.',
    color: 'oklch(0.84 0.16 90)', // amber
  },
  'gestalt closure': {
    pron: 'gə-ˈshtält ˈklō-zhər',
    pos: 'noun',
    def: 'shown a broken figure, the mind supplies the missing pieces and perceives a whole.',
    color: 'oklch(0.72 0.17 300)', // violet
  },
  'peak-end rule': {
    pron: 'ˈpēk-ˌend ˈrül',
    pos: 'noun',
    def: 'we judge an experience by its most intense moment and its ending, not its average.',
    color: 'oklch(0.77 0.15 165)', // emerald
  },
}

// The neuroscience the thesis leans on, as a small glossary. Each term renders
// inline as a solid bright "chip" that opens a dictionary-style definition
// window (headword, phonetic respelling + part of speech, a one-line gloss,
// then a citation line naming the finding's primary source).
//
// The colors are flat, high-chroma graphic solids: a punchy technical palette
// that pops on the bone surface with dark ink text sitting legibly on top. The
// green is a clean emerald (hue ~165), never a vivid electric lime.
//
// One entry, von restorff effect, is deliberately the only dark chip in this
// bright field: the effect it names says the item differing from its
// neighbors is the one that registers, so the chip performs its own
// definition. Its `tone: 'dark'` flag inverts the window's ink colors so the
// dark fill stays legible.

export type GlossaryTerm = {
  /** phonetic respelling, dictionary-style */
  pron: string
  /** part of speech tag, e.g. "noun" */
  pos: string
  /** one-line gloss, lowercase to match the editorial voice */
  def: string
  /** the finding's primary source, lowercase, e.g. "zeigarnik, 1927" */
  src: string
  /** flat bright accent for the chip + window framing */
  color: string
  /** 'dark' inverts the window inks for the one deliberately dark chip */
  tone?: 'dark'
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  'predictive coding': {
    pron: 'prə-ˈdik-tiv ˈkō-diŋ',
    pos: 'noun',
    def: 'the brain runs on forecasts, constantly guessing its next input and only flagging where reality disagrees.',
    src: 'rao & ballard, 1999',
    color: 'oklch(0.78 0.14 232)', // azure
  },
  'prediction error': {
    pron: 'prə-ˈdik-shən ˈer-ər',
    pos: 'noun',
    def: 'the gap between what the brain expected and what actually arrived. the surprise it learns from.',
    src: 'friston, 2010',
    color: 'oklch(0.71 0.19 33)', // coral
  },
  dopamine: {
    pron: 'ˈdō-pə-ˌmēn',
    pos: 'noun',
    def: 'the neurotransmitter that fires when an expected reward resolves, tagging the moment as worth chasing again.',
    src: 'schultz, 1997',
    color: 'oklch(0.72 0.2 352)', // magenta
  },
  'zeigarnik effect': {
    pron: 'zī-ˈgär-nik i-ˈfekt',
    pos: 'noun',
    def: 'the mind holds onto unfinished tasks far more tightly than ones already complete.',
    src: 'zeigarnik, 1927',
    color: 'oklch(0.84 0.16 90)', // amber
  },
  'gestalt closure': {
    pron: 'gə-ˈshtält ˈklō-zhər',
    pos: 'noun',
    def: 'shown a broken figure, the mind supplies the missing pieces and perceives a whole.',
    src: 'wertheimer, 1923',
    color: 'oklch(0.72 0.17 300)', // violet
  },
  'peak-end rule': {
    pron: 'ˈpēk-ˌend ˈrül',
    pos: 'noun',
    def: 'we judge an experience by its most intense moment and its ending, not its average.',
    src: 'kahneman et al., 1993',
    color: 'oklch(0.77 0.15 165)', // emerald
  },
  'trust calibration': {
    pron: 'trəst ˌka-lə-ˈbrā-shən',
    pos: 'noun',
    def: 'confidence in a system should track how reliable it actually is. too little and a person ignores it, too much and they stop checking it.',
    src: 'lee & see, 2004',
    color: 'oklch(0.80 0.13 195)', // teal
  },
  'change blindness': {
    pron: 'chānj ˈblīnd-nəs',
    pos: 'noun',
    def: 'a change you are not attending to can pass unnoticed, even a large one in plain view.',
    src: 'simons & levin, 1997',
    color: 'oklch(0.74 0.16 265)', // indigo
  },
  'parafoveal preview': {
    pron: 'ˌpa-rə-ˈfō-vē-əl ˈprē-ˌvyü',
    pos: 'noun',
    def: 'while you read one word the eye is already sampling the next one over. text that changes there costs the reader time.',
    src: 'rayner, 1998',
    color: 'oklch(0.80 0.15 62)', // tangerine
  },
  'doherty threshold': {
    pron: 'ˈdä-ər-tē ˈthresh-ˌhōld',
    pos: 'noun',
    def: 'below roughly four hundred milliseconds of system response, attention holds and the work still feels continuous.',
    src: 'doherty & thadhani, 1982',
    color: 'oklch(0.80 0.14 143)', // mint
  },
  // The one deliberately dark chip: the effect states that the item differing
  // from its neighbors is the one that registers, so the chip performs its
  // own definition by being the only dark fill in a field of bright ones.
  'von restorff effect': {
    pron: 'fȯn ˈre-stȯrf i-ˈfekt',
    pos: 'noun',
    def: 'the item that differs from its neighbors is the one that gets remembered.',
    src: 'von restorff, 1933',
    color: 'oklch(0.34 0.06 265)', // graphite: the one chip that differs from the rest
    tone: 'dark',
  },
}

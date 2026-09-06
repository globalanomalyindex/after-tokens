// Gist first. A reader takes the meaning of a line from its content words;
// the function words around them are predictable and carry almost none of
// it (Potter 1976 on gist from a glance; Levy 2008 on surprisal, the
// information a word carries being how unexpected it is). So an authored
// reveal that wants the answer to read as sculpted rather than typed puts the
// structure and the topic words on screen first, and lets the connective
// tissue fill in last. This scores each word for that order: list markers and
// line openings (the skeleton), words that echo the prompt (the topic), proper
// nouns, numbers, and long or repeated content words high; function words and
// bare punctuation low. The score is a hint the growth process reads, never a
// claim about the model: a real sampler commits its surest tokens first, and
// a product would pick this order with a small saliency model of its own.

export type SalienceAtom = { text: string; index: number; lineIndex: number }

const STOPWORDS = new Set(
  (
    'a an the and or but nor so yet for of to in on at by with from as into onto than then that this these those ' +
    'it its is are was were be been being am do does did done have has had having will would shall should can could ' +
    'may might must not no yes if else when while where which who whom whose what how why because although though ' +
    'until unless since about above below over under between among through during before after up down out off ' +
    'again further once here there very just only also too even still already both each few more most other some ' +
    'such any all much many own same their theirs them they we our ours us you your yours he him his she her hers ' +
    'i me my mine one ones per via etc s t'
  ).split(' '),
)

export const LIST_MARKER = /^(\d{1,3}[.)]|[a-z][.)]|[-•*–])$/i
/** A list marker begins a phrase and a line's skeleton: "1.", "a)", a bullet. */
export function isListMarker(text: string): boolean {
  return LIST_MARKER.test(text)
}
const PUNCT_ONLY = /^[^\p{L}\p{N}]+$/u

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

/** A crude stem: enough to match "sailors" to "sail" and "heists" to "heist". */
function stem(word: string): string {
  let w = word
  for (const suffix of ['ing', 'edly', 'ed', 'es', 's', 'ly']) {
    if (w.length > suffix.length + 3 && w.endsWith(suffix)) {
      w = w.slice(0, -suffix.length)
      break
    }
  }
  return w.slice(0, 6)
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/** Topic stems from a prompt: its content words, stemmed. */
export function topicStems(topic: string | undefined): Set<string> {
  const out = new Set<string>()
  if (!topic) return out
  for (const raw of topic.split(/\s+/)) {
    const w = normalize(raw)
    if (w.length < 3 || STOPWORDS.has(w)) continue
    out.add(stem(w))
  }
  return out
}

/** One score in [0, 1] per atom. */
export function wordSalience(atoms: SalienceAtom[], topic?: string): number[] {
  const stems = topicStems(topic)
  const lines = new Set(atoms.map((a) => a.lineIndex)).size
  const counts = new Map<string, number>()
  for (const a of atoms) {
    const w = normalize(a.text)
    if (w && !STOPWORDS.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1)
  }
  return atoms.map((a, i) => {
    const raw = a.text
    const w = normalize(raw)
    if (LIST_MARKER.test(raw)) return 1
    if (!w || PUNCT_ONLY.test(raw)) return 0
    const prev = atoms[i - 1]
    const lineStart = i === 0 || (prev != null && prev.lineIndex !== a.lineIndex)
    const sentenceStart = i === 0 || (prev != null && /[.!?:]$/.test(prev.text))
    let s = STOPWORDS.has(w) ? 0.06 : 0.3
    if (lines > 1 && lineStart) s += 0.35
    if (!STOPWORDS.has(w) && stems.has(stem(w))) s += 0.5
    if (!STOPWORDS.has(w) && (counts.get(w) ?? 0) >= 2) s += 0.2
    if (!sentenceStart && /^\p{Lu}/u.test(raw) && !STOPWORDS.has(w)) s += 0.25
    if (/\p{N}/u.test(raw)) s += 0.25
    if (!STOPWORDS.has(w)) s += w.length >= 7 ? 0.2 : w.length >= 5 ? 0.1 : 0
    return clamp01(s)
  })
}

import type { Commit, Policy } from './types'

// Boundaries are evidence in text the source has already committed. None of
// them is a claim about meaning or truth; each is a rule about when text is
// safe to draw, and every rule fails closed: when the evidence is missing the
// text is held, never guessed.

/**
 * A token boundary is a word boundary when the token ends in whitespace, when
 * the next committed token begins with whitespace, or, at finality, when the
 * token is the last one. A token whose successor is uncommitted is held: it
 * could be the first piece of a longer word, which is exactly the exposure the
 * old first-token reveal had on 18 percent of this corpus's words.
 * Returns the character length of the prefix that is word-complete.
 */
export function wordSafeLength(tokens: readonly Commit[], final: boolean): number {
  let length = 0
  let safe = 0
  for (let i = 0; i < tokens.length; i += 1) {
    const text = tokens[i]!.text
    length += text.length
    const next = tokens[i + 1]
    const boundary = /\s$/.test(text) || (next ? /^\s/.test(next.text) : final)
    if (boundary) safe = length
  }
  return safe
}

const ABBREVIATION = /(?:\b(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|fig|no|approx|dept|inc|ltd)|\b[a-z]|\b(?:[a-z]\.)+[a-z])\.$/i

/**
 * A conservative, English-oriented boundary over available text only (the
 * Margin rule, kept). A sentence ends at terminal punctuation followed by
 * whitespace, except inside inline code, fenced code, a list, or after a
 * common abbreviation. A paragraph ends at a blank line outside code. There
 * is no timeout and no length escape. Returns the length of the first
 * complete unit, or 0 when none is complete.
 */
export function passageBoundary(text: string, policy: Policy): number {
  if (policy === 'word') return text.length
  let fence: { marker: string; count: number } | null = null
  let inlineTicks = 0
  let list = false
  for (let i = 0; i < text.length; i += 1) {
    if (i === 0 || text[i - 1] === '\n') {
      const remaining = text.slice(i)
      const line = remaining.split('\n', 1)[0] ?? ''
      const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1]
      if (marker && !inlineTicks) {
        if (!fence) fence = { marker: marker[0]!, count: marker.length }
        else if (marker[0] === fence.marker && marker.length >= fence.count && /^ {0,3}(?:`{3,}|~{3,})\s*$/.test(line)) fence = null
        i += line.length - 1
        continue
      }
      if (!fence && /^\s*(?:[-+*]|\d+[.)])\s/.test(line)) list = true
    }
    if (fence) continue
    if (text[i] === '`') {
      const ticks = /^`+/.exec(text.slice(i))![0].length
      if (inlineTicks === 0) inlineTicks = ticks
      else if (inlineTicks === ticks) inlineTicks = 0
      i += ticks - 1
      continue
    }
    if (inlineTicks) continue
    const paragraph = /^(?:\r?\n)[\t ]*(?:\r?\n)/.exec(text.slice(i))
    if (paragraph) return i + paragraph[0].length
    if (policy === 'paragraph' || list || !/[.!?]/.test(text[i]!)) continue
    if (text[i] === '.' && (text[i - 1] === '.' || text[i + 1] === '.' || ABBREVIATION.test(text.slice(0, i + 1)))) continue
    const after = /^["'”’\])}]*\s+/.exec(text.slice(i + 1))
    if (after) return i + 1 + after[0].length
  }
  return 0
}

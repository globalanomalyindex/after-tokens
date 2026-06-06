import type { MeasuredAtom, ResolutionEvent } from './types'

const TOTAL_REDUCED_MS = 200
const FADE_MS = 80

export function standardReducedFallback(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const stagger = Math.max(8, Math.min(20, (TOTAL_REDUCED_MS - FADE_MS) / words.length))
  const events: ResolutionEvent[] = []
  words.forEach((w, i) => {
    const start = i * stagger
    events.push({ wordIndex: w.index, state: 'resolving', t: start })
    events.push({ wordIndex: w.index, state: 'resolved', t: start + FADE_MS })
  })
  return events
}

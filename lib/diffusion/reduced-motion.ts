import type { MeasuredAtom, ResolutionEvent } from './types'

export function standardReducedFallback(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const events: ResolutionEvent[] = []
  words.forEach((w) => {
    // Preserve the same semantic state path without spatial motion or stagger.
    // Both events land in one frame; the final visible state is resolved.
    events.push({ wordIndex: w.index, state: 'resolving', t: 0 })
    events.push({ wordIndex: w.index, state: 'resolved', t: 0 })
  })
  return events
}

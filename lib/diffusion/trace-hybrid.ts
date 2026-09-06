import type { TraceCompact, TraceWord } from './traces'

/**
 * A recorded run, re-read over pre-written words. The product demos need
 * answers a person would want to read, and a 0.6B model's own prose is not
 * that; what the recording contributes is the sampler's order, timing, and
 * confidence, none of which depend on the words being its own. So the view
 * keeps every step, every commit time, every confidence, and the timing of
 * every belief the model held above the floor, and puts the authored word in
 * each slot. Authored word i takes the recorded word at the same relative
 * position, so a region that locked early in the recording locks early here.
 * The stage labels it: recorded order and timing, authored words.
 */
export function hybridView(trace: TraceCompact, wordTexts: string[]): TraceCompact {
  const m = trace.words.length
  const n = wordTexts.length
  if (m === 0 || n === 0) return { ...trace, words: [], answer: wordTexts.join(' ') }
  const words: TraceWord[] = wordTexts.map((text, i) => {
    const src = trace.words[Math.min(m - 1, Math.floor((i * m) / n))]!
    return {
      ...src,
      index: i,
      text,
      // Belief timing is real; the belief text is the authored word, so a
      // slot shows "something is forming here" exactly when the model held
      // a real guess there, without putting the model's words on screen.
      changes: src.changes.map(([step, , p]) => [step, text, p] as [number, string, number]),
    }
  })
  return { ...trace, id: `${trace.id}#hybrid`, answer: wordTexts.join(' '), words }
}

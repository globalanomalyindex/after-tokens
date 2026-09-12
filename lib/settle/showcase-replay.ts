import type { Replay, SettleEvent } from './types'

// A small illustrative source, not measured model output. Positions are
// assigned in reading order; event times deliberately deliver some later
// positions before a gap closes. The renderer receives only elapsed events.
const parts: Array<[atMs: number, text: string]> = [
  [700, 'Start with a little room to bre'],
  [2050, 'athe. '],
  [1250, 'Let a complete thought arrive when it is '],
  [2900, 'rea'],
  [4600, 'dy. '],
  [3900, 'Keep what is already readable still, '],
  [5600, 'while the next thought takes '],
  [6700, 'sha'],
  [7800, 'pe.'],
]
let position = 0
const events: SettleEvent[] = parts.map(([atMs, text]) => ({
  type: 'commit', atMs,
  tokens: (text.match(/\s+|\S+/g) ?? []).map((piece) => ({ position: position++, text: piece })),
}))
events.sort((a, b) => a.atMs - b.atMs)
events.push({ type: 'finish', atMs: 8500, tokenCount: position })

export const SHOWCASE_ANSWER = parts.map(([, text]) => text).join('')
export const SHOWCASE_REPLAY: Replay = {
  id: 'showcase-shared-arrival-v1',
  label: 'A quieter way to begin?',
  provenance: 'illustrative reply · authored event timing; not a model recording',
  events,
  durationMs: 8500,
}

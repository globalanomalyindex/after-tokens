import type { ModeStrategy, MeasuredAtom, ResolutionEvent } from '../types'
import { standardReducedFallback } from '../reduced-motion'
import { FogOverlay } from '@/components/diffusion/fog-overlay'

const PRE_ROLL_MS = 1600
const SWEEP_DURATION_MS = 1000
const PER_WORD_FOCUS_MS = 280

function spatialProgress(word: MeasuredAtom, all: MeasuredAtom[]): number {
  const xs = all.map((w) => w.bbox.x + w.bbox.w / 2)
  const ys = all.map((w) => w.bbox.y + w.bbox.h / 2)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const wx = word.bbox.x + word.bbox.w / 2
  const wy = word.bbox.y + word.bbox.h / 2
  const nx = maxX === minX ? 0 : (wx - minX) / (maxX - minX)
  const ny = maxY === minY ? 0 : (wy - minY) / (maxY - minY)
  return (nx + ny) / 2
}

function totalDuration(words: MeasuredAtom[]): number {
  if (words.length === 0) return 0
  return PRE_ROLL_MS + SWEEP_DURATION_MS + PER_WORD_FOCUS_MS + 100
}

function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
  if (words.length === 0) return []
  const events: ResolutionEvent[] = []
  for (const w of words) {
    const p = spatialProgress(w, words)
    const start = PRE_ROLL_MS + p * SWEEP_DURATION_MS
    events.push({ wordIndex: w.index, state: 'resolving', t: start })
    events.push({ wordIndex: w.index, state: 'resolved', t: start + PER_WORD_FOCUS_MS })
  }
  events.sort((a, b) => a.t - b.t)
  return events
}

export const fog: ModeStrategy = {
  name: 'fog',
  totalDuration,
  computeTimeline,
  renderOverlay: (props) => FogOverlay(props),
  reducedMotionFallback: standardReducedFallback,
}

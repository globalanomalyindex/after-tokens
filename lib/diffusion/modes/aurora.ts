import type { ModeStrategy, MeasuredAtom, ResolutionEvent } from '../types'
import { standardReducedFallback } from '../reduced-motion'
import { AuroraOverlay } from '@/components/diffusion/aurora-overlay'
import {
  groupByVisualLine,
  auroraTotalMs,
  AURORA_PRE_ROLL_MS,
  AURORA_BAND_SWEEP_MS,
  AURORA_BAND_STAGGER_MS,
  AURORA_WORD_ACTIVATE_MS,
} from './aurora-lines'

function totalDuration(words: MeasuredAtom[]): number {
  return auroraTotalMs(groupByVisualLine(words).length)
}

// Each visual row gets a band that sweeps left to right over BAND_SWEEP_MS,
// staggered down the rows. A word locks the instant the band's center reaches
// its center, so the glow visibly reveals and locks each token in turn.
function computeTimeline(words: MeasuredAtom[]): ResolutionEvent[] {
  const groups = groupByVisualLine(words)
  const events: ResolutionEvent[] = []
  groups.forEach((g, idx) => {
    const lineStart = AURORA_PRE_ROLL_MS + idx * AURORA_BAND_STAGGER_MS
    const span = g.maxC - g.minC
    for (const w of g.words) {
      const wc = w.bbox.x + w.bbox.w / 2
      const ratio = span <= 0 ? 0 : (wc - g.minC) / span
      const t = lineStart + ratio * AURORA_BAND_SWEEP_MS
      events.push({ wordIndex: w.index, state: 'resolving', t })
      events.push({ wordIndex: w.index, state: 'resolved', t: t + AURORA_WORD_ACTIVATE_MS })
    }
  })
  events.sort((a, b) => a.t - b.t)
  return events
}

export const aurora: ModeStrategy = {
  name: 'aurora',
  totalDuration,
  computeTimeline,
  renderOverlay: (props) => AuroraOverlay(props),
  reducedMotionFallback: standardReducedFallback,
}

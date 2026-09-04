import type { ReactNode } from 'react'
import type { MotionValue } from 'motion/react'
import type { WordAtom } from './tokenize'

export type WordState = 'pending' | 'resolving' | 'resolved'

export type ResolutionEvent = {
  wordIndex: number
  state: WordState
  t: number
}

export type MeasuredAtom = WordAtom & {
  bbox: { x: number; y: number; w: number; h: number }
}

export type OverlayProps = {
  words: MeasuredAtom[]
  progress: MotionValue<number>
  totalDuration: number
  reduced: boolean
}

export type ModeName = 'mycelium' | 'fog' | 'aurora' | 'mitosis' | 'trace'

export type ModeStrategy = {
  name: ModeName
  totalDuration: (words: MeasuredAtom[]) => number
  computeTimeline: (words: MeasuredAtom[]) => ResolutionEvent[]
  renderOverlay: (props: OverlayProps) => ReactNode
  reducedMotionFallback: (words: MeasuredAtom[]) => ResolutionEvent[]
}

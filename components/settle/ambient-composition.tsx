'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AMBIENT_SCORE_TICK_MS, ambientScoreAt, createAmbientScore } from '@/lib/settle/ambient-score'
import { SkeletonDivision } from './skeleton-division'

export type AmbientCondition = 'static' | 'breathe' | 'reshape'

type Props = {
  active: boolean
  motion: boolean
  condition?: AmbientCondition
  complete: boolean
  runId: string | number
  seed?: string | number
  /** Historical compatibility only. Waiting geometry never reads this. */
  profile?: readonly number[]
  tempo?: number
  rowCount?: number
  lineHeightPx?: number
  barHeightPx?: number
}

/** Nonlexical activity with its own score. The waiting material receives no
 * candidate, token positions, confidence, progress or source-clock input. */
export function AmbientComposition(props: Props) {
  if (props.complete) return null
  return <AmbientField key={props.runId} {...props} />
}

function AmbientField({ active, motion, condition = 'reshape', runId, seed, tempo = 1, rowCount = 5, lineHeightPx, barHeightPx }: Props) {
  const rate = Number.isFinite(tempo) ? Math.max(.7, Math.min(1.4, tempo)) : 1
  const rows = useMemo(() => createAmbientScore(seed ?? runId), [seed, runId])
  const [clock, setClock] = useState({ elapsed: 0, score: 0 })
  const root = useRef<HTMLDivElement>(null)
  const pausedTransitions = useRef<Animation[]>([])
  const running = active && motion && condition === 'reshape'

  useEffect(() => {
    if (!running) return
    // A local activity clock, not source time or percent complete. Stopping
    // the interval preserves phase across pause/offscreen/hidden states.
    // A tempo change affects future score time, not the history already
    // performed. Re-scaling the full elapsed time would skip or rewind cues.
    const interval = setInterval(() => setClock((value) => ({ elapsed: value.elapsed + AMBIENT_SCORE_TICK_MS, score: value.score + AMBIENT_SCORE_TICK_MS * rate })), AMBIENT_SCORE_TICK_MS)
    return () => clearInterval(interval)
  }, [running, rate])

  useEffect(() => {
    const element = root.current
    if (!element?.getAnimations) return
    if (active && motion) {
      for (const transition of pausedTransitions.current) {
        if (transition.playState === 'paused') transition.play()
      }
      pausedTransitions.current = []
    } else if (motion) {
      // CSS animations pause through their stylesheet. In-flight geometry
      // transitions need their own pause; removing transitions would jump.
      pausedTransitions.current = element.getAnimations({ subtree: true }).filter((animation) => 'transitionProperty' in animation)
      for (const transition of pausedTransitions.current) transition.pause()
    } else {
      for (const transition of pausedTransitions.current) transition.cancel()
      pausedTransitions.current = []
    }
    // Revisit after interruption so an in-flight gesture resumes in place.
  })

  const geometry = ambientScoreAt(rows, clock.score)
  return (
    <div ref={root} className="ambient-composition" aria-hidden="true"
      data-ambient-composition data-material="ambient-cell-skeleton-v7" data-condition={condition} data-active={active} data-motion={motion ? 'on' : 'off'} data-activity-ms={clock.elapsed} data-score-ms={clock.score} data-geometry-source="decorative-score"
      style={{ ['--ambient-period' as string]: `${4800 / rate}ms`, ['--glimmer-period' as string]: `${8000 / rate}ms`,
        ['--ambient-line-height' as string]: lineHeightPx ? `${lineHeightPx}px` : '1.625em',
        ['--ambient-bar-height' as string]: barHeightPx ? `${barHeightPx}px` : '.9em',
      } as CSSProperties}>
      {condition === 'reshape' && <SkeletonDivision widths={geometry.slice(0, 5).map((row) => row.width)} lineHeightPx={lineHeightPx} barHeightPx={barHeightPx} />}
      <div className="ambient-composition__field">
        {rows.map((row, index) => {
          const shape = geometry[index]!
          return <span key={index} className="ambient-composition__bar" data-row={index} data-shown={index < rowCount} data-kind={shape.stable ? 'line' : 'cluster'} data-score-episode={shape.episode} data-score-cue={shape.cueAtMs} data-score-gesture={shape.gesture} style={{
            ['--ambient-width' as string]: `${shape.width * 100}%`,
            ['--ambient-top' as string]: `calc(${index} * var(--ambient-line-height) + (var(--ambient-line-height) - var(--ambient-bar-height)) / 2)`,
            ['--row-period' as string]: `${row.breathPeriodMs / rate}ms`,
            ['--row-delay' as string]: `${-row.breathPhaseMs / rate}ms`,
            ['--shape-duration' as string]: `${shape.transitionMs / rate}ms`,
          } as CSSProperties}>
            <span className="ambient-composition__row-content">
              {shape.pills.map((pill, index) => <span key={index} className="ambient-composition__presence" data-pill={index} data-new={pill.opacity < 1 || undefined} data-moving={!shape.stable || undefined} style={{
                left: `${pill.x * 100}%`, width: `${pill.width * 100}%`, opacity: pill.opacity,
                ['--pill-float' as string]: `${pill.float}em`,
              } as CSSProperties}>
                <span className="ambient-composition__ink" />
              </span>)}
            </span>
          </span>
        })}
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'
import type { Policy, Replay, SettleEvent, SettleState } from '@/lib/settle/types'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'

// A presentation clock over a recording. The state at any elapsed time is a
// pure function of the events at or before it; the clock only chooses which
// events have happened yet. Pausing pauses this presentation of a recording;
// it does not claim to stop a model. Reduced motion changes nothing here:
// release timing is the contract's, whatever the decoration does.

export type ReplayControls = {
  state: SettleState
  elapsedMs: number
  running: boolean
  finished: boolean
  paused: boolean
  play: () => void
  pause: () => void
  restart: () => void
  seekToEnd: () => void
  applyRevision: () => void
  reducedMotion: boolean
}

type Options = {
  policy?: Policy
  /** start the clock on mount (default true) */
  autoplay?: boolean
  /** a change restarts the clock from zero */
  runKey?: string | number
}

export function useReplay(replay: Replay | null, { policy = 'sentence', autoplay = true, runKey }: Options = {}): ReplayControls {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [running, setRunning] = useState(autoplay)
  const [actions, setActions] = useState<SettleEvent[]>([])
  const elapsedRef = useRef(0)
  const reducedMotion = usePrefersReducedMotion()
  const durationMs = replay?.durationMs ?? 0

  // an explicit apply is inserted into the same event history, at the time
  // it happened; sorting keeps source order for equal timestamps
  const events = useMemo(() => {
    if (!replay) return []
    return actions.length ? [...replay.events, ...actions].sort((a, b) => a.atMs - b.atMs) : replay.events
  }, [replay, actions])
  // the state depends only on how many events have happened, so it is
  // recomputed when that count changes, never per frame
  const happened = useMemo(() => {
    let n = 0
    while (n < events.length && events[n]!.atMs <= elapsedMs) n += 1
    return n
  }, [events, elapsedMs])
  const state = useMemo(() => {
    let s = createSettleState(policy, replay?.bound ?? null)
    for (let i = 0; i < happened; i += 1) s = reduceSettle(s, events[i]!)
    return s
  }, [events, happened, policy, replay])

  useEffect(() => {
    elapsedRef.current = 0
    setElapsedMs(0)
    setActions([])
    setRunning(autoplay)
  }, [replay, runKey, autoplay])

  useEffect(() => {
    if (!running || !replay) return
    let frame = 0
    const startedAt = performance.now() - elapsedRef.current
    const tick = (now: number) => {
      const next = Math.min(durationMs, Math.max(elapsedRef.current, now - startedAt))
      elapsedRef.current = next
      setElapsedMs(next)
      if (next >= durationMs) setRunning(false)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [replay, running, durationMs])

  const finished = elapsedMs >= durationMs && durationMs > 0
  const play = useCallback(() => setRunning(true), [])
  const pause = useCallback(() => setRunning(false), [])
  const restart = useCallback(() => {
    elapsedRef.current = 0
    setElapsedMs(0)
    setActions([])
    setRunning(true)
  }, [])
  const seekToEnd = useCallback(() => {
    elapsedRef.current = durationMs
    setElapsedMs(durationMs)
    setRunning(false)
  }, [durationMs])
  const applyRevision = useCallback(() => {
    setActions((previous) => [...previous, { type: 'apply-revision', atMs: Math.max(elapsedRef.current, durationMs) }])
    elapsedRef.current = Math.max(elapsedRef.current, durationMs)
    setElapsedMs(elapsedRef.current)
  }, [durationMs])

  return { state, elapsedMs, running, finished, paused: !running && !finished, play, pause, restart, seekToEnd, applyRevision, reducedMotion }
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMotionValue, type MotionValue } from 'motion/react'
import type { MeasuredAtom, ModeStrategy, ResolutionEvent, WordState } from './types'

type Trigger = 'inView' | 'immediate' | 'manual'

type UseChoreography = {
  words: MeasuredAtom[]
  strategy: ModeStrategy
  trigger?: Trigger
  reduced?: boolean
  onResolved?: () => void
}

type ChoreographyAPI = {
  wordStates: Map<number, WordState>
  progress: MotionValue<number>
  isComplete: boolean
  play: () => void
  replay: () => void
}

export function useDiffusionChoreography({
  words,
  strategy,
  trigger = 'inView',
  reduced = false,
  onResolved,
}: UseChoreography): ChoreographyAPI {
  const events = useMemo<ResolutionEvent[]>(() => {
    if (words.length === 0) return []
    const raw = reduced ? strategy.reducedMotionFallback(words) : strategy.computeTimeline(words)
    // Sort ascending by t so tick() can walk forward with a cursor instead of
    // rescanning every event each frame. Copy before sorting: never mutate a
    // strategy's returned array. Array.prototype.sort is spec-guaranteed stable,
    // so events sharing a `t` keep their original relative order.
    return [...raw].sort((a, b) => a.t - b.t)
  }, [words, strategy, reduced])

  // Reduced-motion timelines are intentionally short. Completion and dependent
  // sequences must follow that active timeline, not the multi-second visual
  // strategy duration, or the UI appears finished while callbacks keep waiting.
  const totalDuration = useMemo(() => {
    if (!reduced) return strategy.totalDuration(words)
    return events.reduce((latest, event) => Math.max(latest, event.t), 0)
  }, [words, strategy, events, reduced])

  const [wordStates, setWordStates] = useState<Map<number, WordState>>(() => {
    const m = new Map<number, WordState>()
    for (const w of words) m.set(w.index, 'pending')
    return m
  })
  const progress = useMotionValue(0)
  const [isComplete, setIsComplete] = useState(false)

  const startedAtRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const pausedAtRef = useRef<number | null>(null)
  const pauseOffsetRef = useRef<number>(0)
  const onResolvedRef = useRef(onResolved)
  const reducedRef = useRef(reduced)
  onResolvedRef.current = onResolved

  // Sorted-cursor bookkeeping. `events` is sorted ascending by t, so tick() can
  // walk forward from where it left off instead of rescanning every event on
  // every frame (was O(events) work plus an unconditional setState at 60fps,
  // even on frames where nothing changed). `eventsRef` detects when `events`
  // gets a new identity mid-run (a re-measure) so the cursor can be rewound to
  // 0 rather than pointing past the end of a fresh array.
  const cursorRef = useRef(0)
  const eventsRef = useRef(events)

  const tick = useCallback(() => {
    if (startedAtRef.current == null) return
    if (eventsRef.current !== events) {
      eventsRef.current = events
      cursorRef.current = 0
    }
    const now = performance.now()
    const elapsed = now - startedAtRef.current - pauseOffsetRef.current

    const due: ResolutionEvent[] = []
    while (cursorRef.current < events.length) {
      const ev = events[cursorRef.current]
      if (!ev || ev.t > elapsed) break
      due.push(ev)
      cursorRef.current += 1
    }
    if (due.length > 0) {
      setWordStates((prev) => {
        const next = new Map(prev)
        for (const ev of due) next.set(ev.wordIndex, ev.state)
        return next
      })
    }

    const p = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 1
    progress.set(p)

    if (elapsed >= totalDuration) {
      setIsComplete(true)
      onResolvedRef.current?.()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [events, totalDuration, progress])

  // Idempotent play: once startedAtRef is set, play() is a no-op. Without
  // this guard, any useEffect that depends on the returned `play` identity
  // would re-fire play() each time isComplete flips (because that flip
  // changes the callback identity), causing an infinite play → complete →
  // replay loop. Explicit replay() resets startedAtRef and re-enters play.
  const play = useCallback(() => {
    if (startedAtRef.current != null) return
    startedAtRef.current = performance.now()
    pauseOffsetRef.current = 0
    cursorRef.current = 0
    setIsComplete(false)
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const pause = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (startedAtRef.current != null && pausedAtRef.current == null) {
      pausedAtRef.current = performance.now()
    }
  }, [])

  const replay = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    setWordStates(() => {
      const m = new Map<number, WordState>()
      for (const w of words) m.set(w.index, 'pending')
      return m
    })
    progress.set(0)
    setIsComplete(false)
    startedAtRef.current = null
    pausedAtRef.current = null
    pauseOffsetRef.current = 0
    cursorRef.current = 0
    queueMicrotask(play)
  }, [words, play, progress])

  useEffect(() => {
    if (trigger === 'immediate') play()
  }, [trigger, play])

  // If the preference changes during a run, restart against the newly selected
  // timeline. This avoids leaving an old rAF closure driving the wrong event set.
  useEffect(() => {
    if (reducedRef.current === reduced) return
    reducedRef.current = reduced
    if (startedAtRef.current == null || isComplete) return
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    setWordStates(() => {
      const next = new Map<number, WordState>()
      for (const word of words) next.set(word.index, 'pending')
      return next
    })
    progress.set(0)
    setIsComplete(false)
    startedAtRef.current = null
    pausedAtRef.current = null
    pauseOffsetRef.current = 0
    cursorRef.current = 0
    queueMicrotask(play)
  }, [reduced, isComplete, words, progress, play])

  // rAF cancellation lives in its own unmount-only effect. The previous setup
  // tied it to the trigger='immediate' effect, which meant every `play`
  // identity change (caused by `measured` updating mid-animation) would
  // cancel the in-flight rAF — and the idempotent play() can't restart it.
  // Result: the diffusion froze mid-flight, leaving half the words cycling.
  //
  // The cleanup ALSO resets the start marker. React StrictMode (dev) runs
  // mount effects as mount → cleanup → mount. For a consumer whose `words`
  // are non-empty on first mount (e.g. the weather widget's virtual atoms),
  // play() fires during the first invoke, the cleanup cancels its rAF, and
  // the idempotent play() on the second invoke is a no-op — so the loop never
  // restarts and progress freezes at 0. Clearing startedAtRef here lets the
  // re-invoked play() start cleanly. On a real unmount this is harmless.
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      startedAtRef.current = null
      pausedAtRef.current = null
      pauseOffsetRef.current = 0
    }
  }, [])

  useEffect(() => {
    function onVisibility() {
      if (document.hidden) pause()
      else if (startedAtRef.current != null && !isComplete) {
        const offset = pausedAtRef.current ? performance.now() - pausedAtRef.current : 0
        pauseOffsetRef.current += offset
        pausedAtRef.current = null
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [pause, tick, isComplete])

  return { wordStates, progress, isComplete, play, replay }
}

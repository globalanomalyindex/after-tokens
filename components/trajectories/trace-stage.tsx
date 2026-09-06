'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { ChatExchange } from '@/components/chat/chat-exchange'
import {
  SHAPED_CONTENT_STEP_MS,
  SHAPED_TAIL_STEP_MS,
  traceAnswerText,
  traceProvisionalText,
  traceRealTotalMs,
  traceSpeedupFor,
  traceStepAtElapsed,
  traceStepEndsFor,
  traceStrategy,
  traceTotalMsFor,
  type TraceCompact,
  type TracePace,
} from '@/lib/diffusion/traces'

type Props = {
  trace: TraceCompact
  // Replay pace: 'shaped' spends the time where the words are, a number is
  // milliseconds per step, 'recorded' is the wall clock of the capture.
  pace?: TracePace
  // External replay nonce, same contract as CodaStage: bumping it from the
  // parent re-runs the exchange from the top independent of the local button.
  replayKey?: number
  // The current denoising step, on every change, for a live map beside the
  // stage. Read through a ref so a fresh closure never restarts playback.
  onStep?: (step: number) => void
  // The two-channel reveal: commits ghost when they land, legibility arrives
  // in reading order inside each phrase (lib/arrival/reading-order.ts).
  readingOrder?: boolean
}

// The replay stage for one recorded trajectory: same dark-instrument family as
// CodaStage and ModeDemo, but every readout here is read off the sampler
// itself rather than authored. Step count, confidence, and the provisional
// text all come from the trace.
export function TraceStage({ trace, pace = 'shaped', replayKey = 0, onStep, readingOrder = false }: Props) {
  const [localReplay, setLocalReplay] = useState(0)
  const replay = () => setLocalReplay((k) => k + 1)

  const answer = useMemo(() => traceAnswerText(trace), [trace])
  const stepCount = useMemo(() => trace.step_ms.length, [trace.step_ms.length])
  const strategy = useMemo(
    () => traceStrategy(trace, { pace }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trace.id, pace],
  )
  // The clock under this pace, so every step-indexed readout (the counter, the
  // beliefs, the map, the strip) follows the real step and never a share of
  // the run, which would only be right for a uniform pace.
  const ends = useMemo(() => traceStepEndsFor(trace, pace), [trace, pace])
  const totalMs = useMemo(() => traceTotalMsFor(trace, pace), [trace, pace])
  const stepAt = useCallback((p: number) => traceStepAtElapsed(ends, p * totalMs), [ends, totalMs])

  const guessesShownRef = useRef<HTMLSpanElement>(null)
  const seenGuessesRef = useRef<Set<string>>(new Set())

  // Wraps traceProvisionalText to also count how many distinct (word, guess)
  // pairs the pending state has actually shown, i.e. how many times the
  // floor in traceProvisionalText let a real model guess through the pending
  // state instead of falling back to authored noise. Written straight to the
  // DOM through the same ref path as the step counter below, so counting
  // costs no re-render.
  const provisionalAt = useCallback(
    (index: number, step: number) => {
      const text = traceProvisionalText(trace, index, step)
      const w = trace.words[index]
      if (text !== undefined && w && step < w.lock_step) {
        const key = `${index}:${text}`
        if (!seenGuessesRef.current.has(key)) {
          seenGuessesRef.current.add(key)
          if (guessesShownRef.current) {
            guessesShownRef.current.textContent = `guesses shown ${String(seenGuessesRef.current.size).padStart(2, '0')}`
          }
        }
      }
      return text
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trace.id],
  )

  // The design contract made literal: a lock may carry sampler state only
  // when a real signal drives it, so a word whose weakest token committed
  // under thirty percent settles visibly dimmer than its confident neighbors.
  const wordColor = useCallback(
    (index: number) => {
      const c = trace.words[index]?.conf ?? 1
      return c < 0.3 ? 'color-mix(in oklab, var(--stage-text) 76%, transparent)' : undefined
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trace.id],
  )

  const wordConf = useCallback(
    (index: number) => trace.words[index]?.conf,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trace.id],
  )

  const stepReadoutRef = useRef<HTMLSpanElement>(null)
  const lengthReadoutRef = useRef<HTMLSpanElement>(null)
  const onStepRef = useRef<typeof onStep>(onStep)
  useEffect(() => {
    onStepRef.current = onStep
  }, [onStep])

  // The length strip: one cell per position in the field, lit as its token
  // commits. Tail cells (end of sequence) light muted, content cells light in
  // the accent, so the answer's extent settling is visible as a shape while
  // the words themselves stay in the bubble. Under the schedule-free sampler
  // this is most of the run: the field contracting to the answer's true
  // length before the words land in it.
  const stripRefs = useRef<(HTMLSpanElement | null)[]>([])
  const tokensByStep = useMemo(() => {
    const byStep = new Map<number, { pos: number; tail: boolean }[]>()
    for (const t of trace.tokens) {
      if (t.step < 0) continue
      const arr = byStep.get(t.step) ?? []
      arr.push({ pos: t.pos, tail: t.tail })
      byStep.set(t.step, arr)
    }
    return byStep
  }, [trace.tokens])
  const litStepRef = useRef(-1)
  const paintStrip = useCallback(
    (step: number) => {
      const from = litStepRef.current + 1
      if (step < litStepRef.current) {
        // a replay: clear everything
        for (const el of stripRefs.current) el?.removeAttribute('data-lit')
        litStepRef.current = -1
        return paintStrip(step)
      }
      for (let s = from; s <= step; s++) {
        for (const t of tokensByStep.get(s) ?? []) {
          stripRefs.current[t.pos]?.setAttribute('data-lit', t.tail ? 'tail' : 'content')
        }
      }
      litStepRef.current = step
    },
    [tokensByStep],
  )

  // Reset the guess count and the strip whenever a new run starts: a new
  // trace, a new pace, or either replay path.
  useEffect(() => {
    seenGuessesRef.current = new Set()
    if (guessesShownRef.current) {
      guessesShownRef.current.textContent = 'guesses shown 00'
    }
    for (const el of stripRefs.current) el?.removeAttribute('data-lit')
    litStepRef.current = -1
    onStepRef.current?.(0)
  }, [trace.id, pace, replayKey, localReplay, readingOrder])

  const handleProgress = useCallback(
    (p: number) => {
      const step = stepAt(p)
      const shown = Math.min(stepCount, p >= 1 ? stepCount : step)
      onStepRef.current?.(step)
      paintStrip(step)
      const total = String(stepCount).padStart(3, '0')
      if (stepReadoutRef.current) {
        stepReadoutRef.current.textContent = `step ${String(shown).padStart(3, '0')} / ${total}`
      }
      const tailDone = trace.tail_done_step
      if (lengthReadoutRef.current) {
        lengthReadoutRef.current.textContent =
          tailDone != null && step >= tailDone
            ? `length fixed · step ${String(tailDone).padStart(3, '0')}`
            : 'length open'
      }
    },
    [stepAt, stepCount, trace.tail_done_step, paintStrip],
  )

  const realTotalMs = useMemo(() => traceRealTotalMs(trace), [trace])
  const speedup = useMemo(() => traceSpeedupFor(trace, pace), [trace, pace])
  const paceLabel =
    pace === 'shaped'
      ? `shaped · tail steps ${SHAPED_TAIL_STEP_MS} ms · word steps ${SHAPED_CONTENT_STEP_MS} ms`
      : pace === 'recorded'
        ? 'recorded pace'
        : `${pace} ms per step · ${speedup.toFixed(1)}x`
  const cols = trace.sampler.max_new_tokens

  return (
    <div
      className="trace-stage relative mx-auto rounded-2xl overflow-hidden flex flex-col"
      data-demo
      style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
    >
      <div
        className="flex justify-between items-center px-6 pt-5 text-[10px] uppercase tracking-[0.16em]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span style={{ color: 'color-mix(in oklab, var(--stage-text) 85%, transparent)' }}>
          sampler · {trace.sampler.id}
          {readingOrder ? ' · reading order inside phrases' : ' · as committed'}
        </span>
        <span style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}>
          qwen3 0.6b · mdlm
        </span>
      </div>
      <div className="px-5 py-7 flex-1 flex items-center">
        <ChatExchange
          className="w-full"
          prompt={trace.prompt}
          thinkingMs={600}
          runKey={`${trace.id}-${String(pace)}-${replayKey}-${localReplay}-${readingOrder ? 'ro' : 'raw'}`}
        >
          <DiffusionText
            mode="trace"
            strategy={strategy}
            trigger="immediate"
            announce="on-complete"
            showStatus
            onProgress={handleProgress}
            provisionalAt={provisionalAt}
            stepCount={stepCount}
            stepAt={stepAt}
            wordColor={wordColor}
            wordConf={wordConf}
            readingOrder={readingOrder}
            className="text-base md:text-lg leading-relaxed"
          >
            {answer}
          </DiffusionText>
        </ChatExchange>
      </div>
      <div className="px-6 pb-3" aria-hidden="true">
        <div
          className="flex items-baseline justify-between text-[9px] uppercase tracking-[0.16em] mb-1.5"
          style={{ fontFamily: 'var(--font-mono)', color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}
        >
          <span>the field · {cols} positions</span>
          <span>accent: a word · muted: end of sequence</span>
        </div>
        <div className="trace-strip" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }, (_, i) => (
            <span
              key={i}
              ref={(el) => {
                stripRefs.current[i] = el
              }}
              className="trace-cell"
            />
          ))}
        </div>
      </div>
      <div
        className="trace-readout flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-4 px-6 pb-5 text-[10px] uppercase tracking-[0.16em]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <div className="flex flex-col gap-1 whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span ref={stepReadoutRef} style={{ color: 'color-mix(in oklab, var(--stage-text) 85%, transparent)' }}>
            {`step 000 / ${String(stepCount).padStart(3, '0')}`}
          </span>
          <span ref={lengthReadoutRef} style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}>
            length open
          </span>
          <span ref={guessesShownRef} style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}>
            guesses shown 00
          </span>
        </div>
        <div className="flex flex-col sm:items-end gap-1.5">
          <span style={{ color: 'color-mix(in oklab, var(--stage-text) 80%, transparent)' }}>
            recorded {(realTotalMs / 1000).toFixed(1)}s on an m3 · {paceLabel}
          </span>
          <button
            type="button"
            onClick={replay}
            aria-label="Replay trajectory"
            className="replay-btn cursor-pointer inline-flex items-center gap-1.5"
            style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}
          >
            <span aria-hidden="true" className="replay-glyph">
              ↻
            </span>
            Replay
          </button>
        </div>
      </div>
    </div>
  )
}

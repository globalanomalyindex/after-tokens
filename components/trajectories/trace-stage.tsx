'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { ChatExchange } from '@/components/chat/chat-exchange'
import {
  traceAnswerText,
  traceProvisionalText,
  traceRealTotalMs,
  traceSpeedup,
  traceStrategy,
  type TraceCompact,
} from '@/lib/diffusion/traces'

type Props = {
  trace: TraceCompact
  // Replay pace in ms per denoising step. Omit for the recorded wall-clock
  // pace (traceStrategy's own default when no msPerStep is given).
  msPerStep?: number
  // External replay nonce, same contract as CodaStage: bumping it from the
  // parent re-runs the exchange from the top independent of the local button.
  replayKey?: number
}

// The replay stage for one recorded trajectory: same dark-instrument family as
// CodaStage and ModeDemo, but every readout here is read off the sampler
// itself rather than authored. Step count, confidence, and the provisional
// text all come from the trace.
export function TraceStage({ trace, msPerStep, replayKey = 0 }: Props) {
  const [localReplay, setLocalReplay] = useState(0)
  const replay = () => setLocalReplay((k) => k + 1)

  const answer = useMemo(() => traceAnswerText(trace), [trace])
  const stepCount = useMemo(() => trace.step_ms.length, [trace.step_ms.length])
  const strategy = useMemo(
    () => traceStrategy(trace, msPerStep != null ? { msPerStep } : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trace.id, msPerStep],
  )

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
      // Only a word still pending counts as a "guess": once step reaches
      // lock_step, traceProvisionalText returns the committed word itself,
      // its settled answer instead of a live prediction.
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
      return c < 0.3 ? 'color-mix(in oklab, var(--stage-text) 58%, transparent)' : undefined
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trace.id],
  )

  // The commit confidence itself, fed straight to DiffusionText: it scales
  // the settle overshoot and, in trace mode, the resolved word's opacity, so
  // certainty at commit reads as certainty on screen.
  const wordConf = useCallback(
    (index: number) => trace.words[index]?.conf,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trace.id],
  )

  const stepReadoutRef = useRef<HTMLSpanElement>(null)
  const lengthReadoutRef = useRef<HTMLSpanElement>(null)

  // Reset the guess count whenever a new run starts: a new trace, a new
  // pace, or either replay path (the local button or the section's shortcut).
  useEffect(() => {
    seenGuessesRef.current = new Set()
    if (guessesShownRef.current) {
      guessesShownRef.current.textContent = 'guesses shown 00'
    }
  }, [trace.id, msPerStep, replayKey, localReplay])

  const handleProgress = useCallback(
    (p: number) => {
      const step = Math.max(0, Math.min(stepCount, Math.round(p * stepCount)))
      const total = String(stepCount).padStart(3, '0')
      if (stepReadoutRef.current) {
        stepReadoutRef.current.textContent = `step ${String(step).padStart(3, '0')} / ${total}`
      }
      const tailDone = trace.tail_done_step
      if (lengthReadoutRef.current) {
        lengthReadoutRef.current.textContent =
          tailDone != null && step >= tailDone
            ? `length fixed · step ${String(tailDone).padStart(3, '0')}`
            : 'length open'
      }
    },
    [stepCount, trace.tail_done_step],
  )

  const realTotalMs = useMemo(() => traceRealTotalMs(trace), [trace])
  const speedup = useMemo(
    () => (msPerStep != null ? traceSpeedup(trace, msPerStep) : 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trace.id, msPerStep],
  )

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
        </span>
        <span style={{ color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)' }}>
          qwen3 0.6b · mdlm
        </span>
      </div>
      <div className="px-5 py-7 flex-1 flex items-center">
        <ChatExchange
          className="w-full"
          prompt={trace.prompt}
          thinkingMs={600}
          runKey={`${trace.id}-${msPerStep ?? 'recorded'}-${replayKey}-${localReplay}`}
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
            wordColor={wordColor}
            wordConf={wordConf}
            className="text-base md:text-lg leading-relaxed"
          >
            {answer}
          </DiffusionText>
        </ChatExchange>
      </div>
      <div
        className="trace-readout flex justify-between items-end gap-4 px-6 pb-5 text-[10px] uppercase tracking-[0.16em]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <div className="flex flex-col gap-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span ref={stepReadoutRef} style={{ color: 'color-mix(in oklab, var(--stage-text) 85%, transparent)' }}>
            {`step 000 / ${String(stepCount).padStart(3, '0')}`}
          </span>
          <span ref={lengthReadoutRef} style={{ color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)' }}>
            length open
          </span>
          <span ref={guessesShownRef} style={{ color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)' }}>
            guesses shown 00
          </span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span style={{ color: 'color-mix(in oklab, var(--stage-text) 70%, transparent)' }}>
            recorded {(realTotalMs / 1000).toFixed(1)}s on an m3 · replayed {speedup.toFixed(1)}x
          </span>
          <button
            type="button"
            onClick={replay}
            aria-label="Replay trajectory"
            className="replay-btn cursor-pointer inline-flex items-center gap-1.5"
            style={{ color: 'color-mix(in oklab, var(--stage-text) 60%, transparent)' }}
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

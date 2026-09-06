'use client'

import { useMemo, useState } from 'react'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { ChatExchange } from '@/components/chat/chat-exchange'
import {
  traceProvisionalText,
  traceSpeedup,
  traceStepAtElapsed,
  traceStepEndsFor,
  traceStrategy,
  traceTotalMsFor,
  type TraceCompact,
} from '@/lib/diffusion/traces'
import { hybridView } from '@/lib/diffusion/trace-hybrid'
import { tokenize } from '@/lib/diffusion/tokenize'
import type { CodaPrompt } from '@/lib/coda/fixtures'
import type { ModeStrategy } from '@/lib/diffusion/types'
import type { BrandTokens } from '@/lib/brand/types'

const TRACE_MS_PER_STEP = 40

type Props = {
  prompt: CodaPrompt
  mode: ModeStrategy['name']
  brand: BrandTokens
  isAutoMode: boolean
  // Optional scale on the authored reveal duration. It does not represent
  // inference time or model effort.
  durationScale?: number
  // External replay nonce. Bumping this from the parent (e.g. the Space-to-
  // replay shortcut on the section) re-runs the choreography from the top,
  // independent of the internal replay button. Folded into the exchange's
  // runKey so the answer re-mounts and the diffusion restarts.
  replayKey?: number
  // The recorded trajectory for this prompt (lowconf-b32), when mode ===
  // 'trace'. Undefined while it is still loading. Its order, timing, and
  // confidence drive the pre-written answer (see hybridView).
  trace?: TraceCompact
}

export function CodaStage({
  prompt,
  mode,
  brand,
  isAutoMode,
  durationScale,
  replayKey = 0,
  trace,
}: Props) {
  const [localReplay, setLocalReplay] = useState(0)
  const replay = () => setLocalReplay((k) => k + 1)
  const isTrace = mode === 'trace'
  const traceReady = isTrace && trace != null

  // The recorded run re-read over the fixture's words: the sampler's order,
  // timing, confidence, and belief timing, with the pre-written answer in
  // the slots. Memoized on trace.id and the prompt.
  const view = useMemo(
    () => (trace ? hybridView(trace, tokenize(prompt.response).map((a) => a.text)) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trace?.id, prompt.response],
  )
  const traceStrat = useMemo(
    () => (view ? traceStrategy(view, { msPerStep: TRACE_MS_PER_STEP }) : undefined),
    [view],
  )
  const stepAt = useMemo(() => {
    if (!view) return undefined
    const ends = traceStepEndsFor(view, TRACE_MS_PER_STEP)
    const total = traceTotalMsFor(view, TRACE_MS_PER_STEP)
    return (p: number) => traceStepAtElapsed(ends, p * total)
  }, [view])
  const provisionalAt = useMemo(() => {
    if (!view) return undefined
    return (i: number, step: number) => traceProvisionalText(view, i, step)
  }, [view])
  // A word whose weakest token committed under thirty percent settles dimmer,
  // so a low-confidence lock reads visually as less certain than a confident one.
  const traceWordColor = useMemo(() => {
    if (!view) return undefined
    return (i: number) => {
      const c = view.words[i]?.conf ?? 1
      return c < 0.3 ? 'color-mix(in oklab, var(--stage-text) 58%, transparent)' : undefined
    }
  }, [view])
  // The commit confidence itself, fed straight to DiffusionText: it scales
  // the settle overshoot and, in trace mode, the resolved word's opacity.
  const traceWordConf = useMemo(() => {
    if (!view) return undefined
    return (i: number) => view.words[i]?.conf
  }, [view])

  return (
    <div
      className="relative rounded-2xl overflow-hidden min-h-[520px] flex flex-col"
      style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
    >
      <div
        className="flex justify-between items-center px-6 pt-5 text-[10px] uppercase tracking-[0.16em]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span style={{ color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)' }}>
          Stage
        </span>
        <span style={{ color: 'color-mix(in oklab, var(--stage-text) 85%, transparent)' }}>
          {isTrace ? `+ sampler · ${trace ? trace.sampler.id : 'recorded'} · recorded order, authored words` : `+ ${mode}${isAutoMode ? ' (fixture)' : ''}`}
        </span>
      </div>
      <div className="px-5 py-7 flex-1 flex items-center">
        <ChatExchange
          className="w-full"
          prompt={prompt.prompt}
          thinkingMs={600}
          runKey={`${prompt.id}-${mode}-${brand.id}-${durationScale ?? 1}-${replayKey}-${localReplay}-${trace?.id ?? 'none'}`}
        >
          {isTrace && !traceReady ? (
            <div
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)',
              }}
            >
              loading trajectory
            </div>
          ) : isTrace && view && traceStrat ? (
            <DiffusionText
              mode={mode}
              trigger="immediate"
              durationScale={durationScale}
              announce="on-complete"
              showStatus
              className="text-base md:text-lg leading-relaxed"
              strategy={traceStrat}
              provisionalAt={provisionalAt}
              stepCount={view.step_ms.length}
              stepAt={stepAt}
              wordColor={traceWordColor}
              wordConf={traceWordConf}
            >
              {prompt.response}
            </DiffusionText>
          ) : (
            <DiffusionText
              mode={mode}
              trigger="immediate"
              durationScale={durationScale}
              announce="on-complete"
              showStatus
              topic={prompt.prompt}
              className="text-base md:text-lg leading-relaxed"
            >
              {prompt.response}
            </DiffusionText>
          )}
        </ChatExchange>
      </div>
      <div
        className="flex justify-between items-center px-6 pb-5 text-[10px] uppercase tracking-[0.16em]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span style={{ color: 'color-mix(in oklab, var(--stage-text) 70%, transparent)' }}>
          Brand · {brand.name}
          {isTrace && trace ? ` · replayed ${traceSpeedup(trace, TRACE_MS_PER_STEP).toFixed(1)}x` : ''}
        </span>
        <button
          type="button"
          onClick={replay}
          aria-label="Replay animation"
          className="replay-btn cursor-pointer inline-flex items-center gap-1.5"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'color-mix(in oklab, var(--stage-text) 60%, transparent)',
          }}
        >
          <span aria-hidden="true" className="replay-glyph">
            ↻
          </span>
          Replay
        </button>
      </div>
    </div>
  )
}

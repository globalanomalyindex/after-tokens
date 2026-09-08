'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { PromptPicker } from '@/components/coda/prompt-picker'
import { useInView } from '@/components/motion/reveal'
import { BrandProvider } from '@/lib/brand/provider'
import { brands } from '@/lib/brand/brands'
import type { BrandId } from '@/lib/brand/types'
import type { TraceCompact } from '@/lib/diffusion/traces'
import { DEMO_REPLAYS } from '@/lib/settle/fixtures'
import { formingText } from '@/lib/settle/reader'
import { paceLabel, replayTrace, type Pace } from '@/lib/settle/replay'
import type { Policy, Replay } from '@/lib/settle/types'
import type { SettleVoice } from '@/lib/settle/voice'
import { TRACE_META, loadTrace, type TraceId } from '@/lib/traces/index'
import { CONFIG_IDS, CONFIG_LABELS, PROMPT_IDS, PROMPT_LABELS, isCurated, traceIdFor, type SamplerConfig } from '@/lib/traces/prompts'
import type { CodaPrompt } from '@/lib/coda/fixtures'
import { SettleAnswer } from './settle-answer'
import { useReplay } from './use-replay'

// A demo stage: a recording, replayed through the reducer, on the dark stage,
// with whichever controls a section needs. Every stage says what it is
// playing and on what clock. Nothing in it is a picture.

export type StageControl = 'prompt' | 'config' | 'policy' | 'preview' | 'voice' | 'pace' | 'comparison'

type Props = {
  /** `trace:<id>` or an authored fixture id */
  source?: string
  /** which recordings the prompt picker offers */
  sources?: 'curated' | 'all'
  controls?: StageControl[]
  policy?: Policy
  preview?: boolean
  pace?: Pace
  brand?: BrandId
  /** a voice on top of the brand's, clamped to the ranges */
  voice?: Partial<SettleVoice>
  /** show the raw available prefix beside the surface, partial words marked */
  comparison?: boolean
  autoplay?: 'inView' | 'immediate'
  compact?: boolean
  /** a change restarts the replay */
  runKey?: string | number
  /** a live readout beside the stage, given the current state */
  readout?: (info: { policy: Policy; preview: boolean; pace: Pace; brand: BrandId }) => ReactNode
  className?: string
}

const cache = new Map<TraceId, Promise<TraceCompact>>()
function useTrace(id: TraceId | null): TraceCompact | null {
  const [trace, setTrace] = useState<TraceCompact | null>(null)
  useEffect(() => {
    if (!id) { setTrace(null); return }
    let cancelled = false
    const p = cache.get(id) ?? loadTrace(id)
    cache.set(id, p)
    p.then((t) => { if (!cancelled) setTrace(t) }).catch(() => { if (!cancelled) setTrace(null) })
    return () => { cancelled = true }
  }, [id])
  return trace
}

const PACES: { id: string; label: string; pace: Pace }[] = [
  { id: 'recorded', label: 'recorded', pace: 'recorded' },
  { id: 'quarter', label: '1/4 of recorded', pace: { scale: 4 } },
  { id: 'fast', label: '40 ms a step', pace: 40 },
]
const POLICIES: { id: Policy; label: string }[] = [
  { id: 'word', label: 'each word' },
  { id: 'sentence', label: 'each sentence' },
  { id: 'paragraph', label: 'each paragraph' },
]
const BRAND_IDS = Object.keys(brands) as BrandId[]

export function SettleStage({
  source = 'trace:heron-poem__lowconf-b32',
  sources = 'curated',
  controls = [],
  policy: policyProp = 'sentence',
  preview: previewProp = true,
  pace: paceProp = { scale: 4 },
  brand: brandProp = 'after-tokens',
  voice,
  comparison: comparisonProp = false,
  autoplay = 'inView',
  compact = false,
  runKey,
  readout,
  className = '',
}: Props) {
  const [sourceId, setSourceId] = useState(source)
  const [policy, setPolicy] = useState<Policy>(policyProp)
  const [preview, setPreview] = useState(previewProp)
  const [paceId, setPaceId] = useState<string>(() => PACES.find((p) => JSON.stringify(p.pace) === JSON.stringify(paceProp))?.id ?? 'quarter')
  const [brand, setBrand] = useState<BrandId>(brandProp)
  const [comparison, setComparison] = useState(comparisonProp)
  const pace = PACES.find((p) => p.id === paceId)?.pace ?? paceProp

  const traceId = sourceId.startsWith('trace:') ? (sourceId.slice(6) as TraceId) : null
  const trace = useTrace(traceId && TRACE_META[traceId] ? traceId : null)
  const authored = traceId ? null : DEMO_REPLAYS.find((r) => r.id === sourceId) ?? null
  const replay: Replay | null = useMemo(() => (trace ? replayTrace(trace, pace) : authored), [trace, authored, pace])

  const { ref, inView } = useInView<HTMLDivElement>(0.25)
  const clock = useReplay(replay, { policy, autoplay: autoplay === 'immediate' || inView, runKey })
  const has = (c: StageControl) => controls.includes(c)

  // the prompt picker: one pill per prompt whose run under this sampler is offered
  const config = (traceId ? TRACE_META[traceId]?.config : 'lowconf-b32') as SamplerConfig
  const promptId = traceId ? TRACE_META[traceId]?.promptId ?? PROMPT_IDS[0]! : PROMPT_IDS[0]!
  const promptItems = useMemo<CodaPrompt[]>(
    () => PROMPT_IDS.filter((id) => sources === 'all' || isCurated(traceIdFor(id, config))).map((id) => ({
      id, prompt: PROMPT_LABELS[id] ?? id, short: id.replace(/-/g, ' '), defaultMode: 'trace', response: '',
      ...(sources === 'all' && !isCurated(traceIdFor(id, config)) ? { badge: TRACE_META[traceIdFor(id, config)]?.audit.verdict ?? '' } : {}),
    })),
    [config, sources],
  )
  const selectPrompt = useCallback((id: string) => setSourceId(`trace:${traceIdFor(id, config)}`), [config])
  const selectConfig = useCallback((id: string) => {
    const next = id as SamplerConfig
    const keep = sources === 'all' || isCurated(traceIdFor(promptId, next))
    const first = PROMPT_IDS.find((p) => sources === 'all' || isCurated(traceIdFor(p, next))) ?? promptId
    setSourceId(`trace:${traceIdFor(keep ? promptId : first, next)}`)
  }, [promptId, sources])

  const state = clock.state
  const paused = clock.paused
  const stageText = brands[brand].stageText
  const provenance = replay?.provenance ?? ''
  const label = traceId ? (trace?.prompt ?? PROMPT_LABELS[promptId] ?? '') : (authored?.label ?? '')
  const note = traceId && TRACE_META[traceId] ? TRACE_META[traceId].audit.note : null

  return (
    <div className={className}>
      {controls.length > 0 && (
        <div className="grid gap-4 mb-6">
          {has('prompt') && <PromptPicker prompts={promptItems} activeId={promptId} onSelect={selectPrompt} layout="compact" />}
          {has('config') && <ToggleRail label="sampler" items={CONFIG_IDS.map((id) => ({ id, label: CONFIG_LABELS[id] }))} activeId={config} onSelect={selectConfig} />}
          {has('policy') && <ToggleRail label="the page takes" items={POLICIES} activeId={policy} onSelect={(id) => setPolicy(id as Policy)} />}
          {has('preview') && <ToggleRail label="forming text" items={[{ id: 'shown', label: 'shown' }, { id: 'held', label: 'held, as margin did' }]} activeId={preview ? 'shown' : 'held'} onSelect={(id) => setPreview(id === 'shown')} />}
          {has('voice') && <ToggleRail label="voice" items={BRAND_IDS.map((id) => ({ id, label: brands[id].name.toLowerCase() }))} activeId={brand} onSelect={(id) => setBrand(id as BrandId)} />}
          {has('pace') && traceId && <ToggleRail label="clock" items={PACES.map((p) => ({ id: p.id, label: p.label }))} activeId={paceId} onSelect={setPaceId} />}
          {has('comparison') && <ToggleRail label="beside it" items={[{ id: 'none', label: 'nothing' }, { id: 'prefix', label: 'the raw prefix' }]} activeId={comparison ? 'prefix' : 'none'} onSelect={(id) => setComparison(id === 'prefix')} />}
        </div>
      )}
      <div ref={ref} className={`grid gap-6 ${readout ? 'lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] items-start' : ''}`}>
        <BrandProvider brand={brand} className={`stage ${compact ? 'p-5' : 'p-5 md:p-7'} flex flex-col min-w-0`} style={{ color: stageText }} data-demo>
          <div className="settle-stage-bar readout">
            <span>{traceId ? 'model recording, unedited' : 'authored recording'}</span>
            <span>{traceId ? CONFIG_LABELS[config] : 'synthetic clock'}</span>
          </div>
          {label && <p className={`settle-prompt mt-4 ${compact ? 'text-[13px]' : 'text-[14px]'} leading-snug`}>{label}</p>}
          <div className={`settle-compare mt-5 ${compact ? '' : 'md:mt-6'}`} data-two={comparison && !compact}>
            {comparison && !compact && (
              <div className="min-w-0">
                <p className="readout mb-3" style={{ color: 'color-mix(in oklab, currentColor 72%, transparent)' }}>the available prefix, as committed · partial words marked</p>
                <p className={`settle-baseline-text m-0 ${compact ? 'text-[14px]' : 'text-[15px] md:text-base'} leading-relaxed`}>
                  {state.prefix.slice(0, state.wordSafeLength)}
                  {state.prefix.length > state.wordSafeLength && <mark>{state.prefix.slice(state.wordSafeLength)}</mark>}
                </p>
              </div>
            )}
            <div className="min-w-0">
              {comparison && !compact && <p className="readout mb-3" style={{ color: 'color-mix(in oklab, currentColor 72%, transparent)' }}>settle · the page takes each {policy}</p>}
              <SettleAnswer
                state={state}
                voice={voice}
                preview={preview}
                paused={paused}
                onApplyRevision={clock.applyRevision}
                className={`${compact ? 'text-[14px]' : 'text-[15px] md:text-base'} leading-relaxed`}
                style={{ minHeight: compact ? '7.5rem' : '9rem' }}
              />
            </div>
          </div>
          <div className="mt-auto pt-5 flex items-center justify-between gap-4 flex-wrap readout" style={{ color: 'color-mix(in oklab, currentColor 72%, transparent)' }}>
            <span className="min-w-0 truncate" title={provenance}>{traceId ? paceLabel(pace) : 'synthetic clock'} · <span className="settle-clock">{(clock.elapsedMs / 1000).toFixed(1)} s</span></span>
            <span className="flex items-center gap-4">
              {!compact && <button type="button" className="replay-btn cursor-pointer" onClick={clock.seekToEnd} disabled={clock.finished} aria-label="seek the recording to its end">to the end</button>}
              <button type="button" className="replay-btn cursor-pointer" onClick={clock.running ? clock.pause : clock.play} disabled={clock.finished} aria-label={clock.running ? 'pause the replay' : 'resume the replay'}>{clock.running ? 'pause' : 'resume'}</button>
              <button type="button" className="replay-btn cursor-pointer inline-flex items-center gap-1.5" onClick={clock.restart} aria-label="replay the recording"><span aria-hidden="true" className="replay-glyph">↻</span> replay</button>
            </span>
          </div>
        </BrandProvider>
        {readout && <div className="min-w-0">{readout({ policy, preview, pace, brand })}</div>}
      </div>
      {!compact && (
        <p className="readout mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
          {provenance}{note ? ` · archive note: ${note}` : ''}{formingText(state) && preview ? ' · the dim text is committed and in order; it brightens when its passage completes' : ''}
        </p>
      )}
    </div>
  )
}

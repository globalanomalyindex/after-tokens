'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { ChatExchange } from '@/components/chat/chat-exchange'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { ProfileReadout } from '@/components/arrival/profile-readout'
import { HueWheel } from './hue-wheel'
import { codaPrompts } from '@/lib/coda/fixtures'
import { GLYPH_STYLE_ITEMS, type GlyphStyle } from '@/lib/diffusion/glyph-styles'
import { hueToAccent, spectrumColor } from '@/lib/playground/color'
import { tokenize } from '@/lib/diffusion/tokenize'
import { wordSalience } from '@/lib/diffusion/salience'
import { hybridView } from '@/lib/diffusion/trace-hybrid'
import {
  traceProvisionalText,
  traceStepAtElapsed,
  traceStepEndsFor,
  traceStrategy,
  traceTotalMsFor,
  type TraceCompact,
} from '@/lib/diffusion/traces'
import { loadTrace } from '@/lib/traces'
import { codaTraceIdFor } from '@/lib/traces/select'
import { CRYSTAL_TENSION_BUDGET } from '@/lib/diffusion/modes/crystal'
import type { ModeName, WordState } from '@/lib/diffusion/types'

// The playground: every axis the piece demonstrated, freed to combine.
// Arrival × tension budget × glyph vocabulary × reveal time × color, all
// composable, all live, with the profile read off the words as they settle.
// Color applies in place (a CSS variable and a per-word color), so dragging
// the wheel recolors the answer without restarting it; anything that changes
// the choreography or the content re-runs the exchange.

type DurationId = 'instant' | 'quick' | 'deep' | 'max'
type BudgetId = '1' | '2' | '3' | 'unbounded'

const ARRIVAL_ITEMS: { id: ModeName; label: string; badge?: string }[] = [
  { id: 'crystal', label: 'Crystallize', badge: 'the grammar' },
  { id: 'typewriter', label: 'Typewriter' },
  { id: 'fade', label: 'Fade' },
  { id: 'scatter', label: 'Scatter' },
  { id: 'mycelium', label: 'Mycelium' },
  { id: 'fog', label: 'Fog' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'mitosis', label: 'Mitosis' },
  // The recorded run for the prompt, re-read over its pre-written answer:
  // real order, timing, and confidence, authored words (see hybridView).
  { id: 'trace', label: 'Sampler', badge: 'recorded' },
]

const BUDGET_ITEMS: { id: BudgetId; label: string }[] = [
  { id: '1', label: 'one loop' },
  { id: '2', label: 'two loops' },
  { id: '3', label: 'three loops' },
  { id: 'unbounded', label: 'no budget' },
]

const TRACE_MS_PER_STEP = 40

const DURATION_ITEMS: { id: DurationId; label: string }[] = [
  { id: 'instant', label: 'Fast' },
  { id: 'quick', label: 'Native' },
  { id: 'deep', label: 'Long' },
  { id: 'max', label: 'Extended' },
]

// Multiplier on the arrival's own duration. Presentation timing only.
const DURATION_SCALE: Record<DurationId, number> = {
  instant: 0.5,
  quick: 1,
  deep: 2,
  max: 3.2,
}

const PROMPT_ITEMS: { id: string; label: string }[] = [
  { id: 'heist-plot', label: 'Heist plot' },
  { id: 'brainstorm', label: 'Name a color' },
  { id: 'diffusion-explain', label: 'How diffusion works' },
  { id: 'travel', label: 'Train or fly' },
  { id: 'compiler-error', label: 'Compiler error' },
  { id: 'heron-poem', label: 'Heron at dawn' },
]

type Preset = {
  id: string
  label: string
  mode: ModeName
  budget: BudgetId
  style: GlyphStyle
  duration: DurationId
  spectrum: boolean
  hue: number
}

// Quick-start recipes. Click one, then move any dial from there: the whole
// language is one contract, expressed through shared dials.
const PRESETS: Preset[] = [
  { id: 'crystal', label: 'Crystal', mode: 'crystal', budget: '2', style: 'words', duration: 'quick', spectrum: false, hue: 262 },
  { id: 'spectra', label: 'Spectra', mode: 'crystal', budget: '3', style: 'words', duration: 'deep', spectrum: true, hue: 268 },
  { id: 'console', label: 'Console', mode: 'crystal', budget: '2', style: 'blocks', duration: 'deep', spectrum: false, hue: 150 },
  { id: 'matrix', label: 'Matrix', mode: 'mycelium', budget: '2', style: 'matrix', duration: 'quick', spectrum: false, hue: 138 },
  { id: 'borealis', label: 'Borealis', mode: 'aurora', budget: '2', style: 'words', duration: 'deep', spectrum: false, hue: 228 },
]

function getPrompt(id: string) {
  return codaPrompts.find((p) => p.id === id) ?? codaPrompts[0]!
}

export function Playground() {
  const [promptId, setPromptId] = useState<string>('heist-plot')
  const [mode, setMode] = useState<ModeName>('crystal')
  const [budgetId, setBudgetId] = useState<BudgetId>(String(CRYSTAL_TENSION_BUDGET) as BudgetId)
  const [style, setStyle] = useState<GlyphStyle>('words')
  const [duration, setDuration] = useState<DurationId>('quick')
  const [hue, setHue] = useState(262)
  const [tinted, setTinted] = useState(false)
  const [spectrum, setSpectrum] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [states, setStates] = useState<Map<number, WordState>>(() => new Map())

  const prompt = useMemo(() => getPrompt(promptId), [promptId])
  const durationScale = DURATION_SCALE[duration]
  const budget = budgetId === 'unbounded' ? 'unbounded' : Number(budgetId)
  const atoms = useMemo(() => {
    const raw = tokenize(prompt.response)
    const sal = wordSalience(raw, prompt.prompt)
    return raw.map((a, i) => ({ ...a, salience: sal[i] }))
  }, [prompt])
  const onWordStates = useCallback((m: Map<number, WordState>) => setStates(m), [])

  // The recorded run behind the Sampler arrival, loaded on first use and
  // cached per prompt.
  const [trace, setTrace] = useState<TraceCompact | undefined>(undefined)
  const traceCache = useRef(new Map<string, TraceCompact>())
  useEffect(() => {
    if (mode !== 'trace') return
    const id = codaTraceIdFor(promptId)
    const cached = traceCache.current.get(id)
    if (cached) {
      setTrace(cached)
      return
    }
    setTrace(undefined)
    let cancelled = false
    loadTrace(id).then((t) => {
      if (cancelled) return
      traceCache.current.set(id, t)
      setTrace(t)
    })
    return () => {
      cancelled = true
    }
  }, [mode, promptId])
  const view = useMemo(
    () => (mode === 'trace' && trace ? hybridView(trace, tokenize(prompt.response).map((a) => a.text)) : undefined),
    [mode, trace, prompt.response],
  )
  const traceStrat = useMemo(() => (view ? traceStrategy(view, { msPerStep: TRACE_MS_PER_STEP }) : undefined), [view])
  const stepAt = useMemo(() => {
    if (!view) return undefined
    const ends = traceStepEndsFor(view, TRACE_MS_PER_STEP)
    const total = traceTotalMsFor(view, TRACE_MS_PER_STEP)
    return (p: number) => traceStepAtElapsed(ends, p * total)
  }, [view])
  const provisionalAt = useMemo(() => (view ? (i: number, step: number) => traceProvisionalText(view, i, step) : undefined), [view])
  const traceConf = useMemo(() => (view ? (i: number) => view.words[i]?.conf : undefined), [view])
  const traceWaiting = mode === 'trace' && !view
  const durationLabel = DURATION_ITEMS.find((item) => item.id === duration)?.label.toLowerCase() ?? duration

  // Color is absent from the run key on purpose, see the file header.
  const runKey = `${promptId}-${mode}-${budgetId}-${style}-${duration}-${replayKey}-${view?.id ?? 'none'}`

  const accent = tinted || spectrum ? (spectrum ? hueToAccent(hue + 36) : hueToAccent(hue)) : undefined
  const wordColor = useMemo(() => {
    if (spectrum) {
      return (i: number, total: number) => spectrumColor(total <= 1 ? 0 : i / (total - 1), 0.9, hue)
    }
    if (tinted) {
      const solid = hueToAccent(hue)
      return () => solid
    }
    return undefined
  }, [spectrum, tinted, hue])

  const applyPreset = useCallback((p: Preset) => {
    setMode(p.mode)
    setBudgetId(p.budget)
    setStyle(p.style)
    setDuration(p.duration)
    setSpectrum(p.spectrum)
    setTinted(!p.spectrum && p.id !== 'crystal')
    setHue(p.hue)
    setReplayKey((k) => k + 1)
  }, [])

  const replay = useCallback(() => setReplayKey((k) => k + 1), [])

  const randomize = useCallback(() => {
    const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!
    setPromptId(pick(PROMPT_ITEMS).id)
    setMode(pick(ARRIVAL_ITEMS.filter((m) => m.id !== 'trace')).id)
    setBudgetId(pick(BUDGET_ITEMS).id)
    setStyle(pick(GLYPH_STYLE_ITEMS).id)
    setDuration(pick(DURATION_ITEMS).id)
    setHue(Math.floor(Math.random() * 360))
    const roll = Math.random()
    setSpectrum(roll < 0.25)
    setTinted(roll >= 0.25 && roll < 0.6)
    setReplayKey((k) => k + 1)
  }, [])

  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] items-start">
      <div
        className="stage relative overflow-hidden min-h-[560px] flex flex-col"
        style={accent ? ({ ['--accent' as string]: accent } as React.CSSProperties) : undefined}
      >
        <div className="flex justify-between items-center px-6 pt-5 readout" style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}>
          <span>playground</span>
          <span>live</span>
        </div>

        <div className="px-5 md:px-7 py-7 flex-1 flex items-center">
          <ChatExchange
            className="w-full"
            prompt={prompt.prompt}
            thinkingMs={620}
            // Decode styles render full-size at once so the bubble never
            // resizes mid-decode; 'words' keeps the height-grow entrance.
            answerGrowMs={style === 'words' ? undefined : 0}
            runKey={runKey}
          >
            {traceWaiting ? (
              <div className="trace-loading">loading trajectory</div>
            ) : (
              <DiffusionText
                mode={mode}
                glyphStyle={style}
                wordColor={wordColor}
                durationScale={durationScale}
                budget={budget}
                trigger="immediate"
                announce="on-complete"
                showStatus
                className="text-base md:text-lg leading-relaxed"
                strategy={traceStrat}
                topic={prompt.prompt}
                provisionalAt={view ? provisionalAt : undefined}
                stepCount={view ? view.step_ms.length : undefined}
                stepAt={stepAt}
                wordConf={traceConf}
                onWordStates={onWordStates}
              >
                {prompt.response}
              </DiffusionText>
            )}
          </ChatExchange>
        </div>

        <div className="flex justify-between items-center gap-3 px-6 pb-5 readout" style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}>
          <span className="truncate">
            {mode === 'crystal' ? `crystallize · ${BUDGET_ITEMS.find((b) => b.id === budgetId)?.label}` : mode === 'trace' ? 'sampler · recorded' : mode} · {style} · {durationLabel} ·{' '}
            {spectrum ? 'spectrum' : tinted ? <span style={{ color: hueToAccent(hue) }}>{Math.round(hue)}°</span> : 'ink'}
          </span>
          <button type="button" onClick={replay} aria-label="Replay animation" className="replay-btn cursor-pointer inline-flex items-center gap-1.5 shrink-0">
            <span aria-hidden="true" className="replay-glyph">↻</span>
            replay
          </button>
        </div>
      </div>

      <aside
        className="w-full lg:sticky lg:top-24 rounded-2xl border p-5 md:p-6"
        style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)', background: 'var(--surface)' }}
      >
        <div className="grid grid-cols-[88px_1fr] gap-4 items-center mb-4">
          <span className="label">preset</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="playground-pill px-3 py-1.5 text-[11px] rounded-md cursor-pointer"
                style={{ border: '0.8px solid var(--ink)', background: 'transparent', color: 'var(--ink)' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <ToggleRail label="prompt" items={PROMPT_ITEMS} activeId={promptId} onSelect={setPromptId} />
          <ToggleRail label="arrival" items={ARRIVAL_ITEMS} activeId={mode} onSelect={(id) => setMode(id as ModeName)} />
          {mode === 'crystal' && (
            <ToggleRail label="budget" items={BUDGET_ITEMS} activeId={budgetId} onSelect={(id) => setBudgetId(id as BudgetId)} />
          )}
          <ToggleRail label="glyphs" items={GLYPH_STYLE_ITEMS} activeId={style} onSelect={(id) => setStyle(id as GlyphStyle)} />
          <ToggleRail label="reveal time" items={DURATION_ITEMS} activeId={duration} onSelect={(id) => setDuration(id as DurationId)} />
        </div>

        <div className="mt-5 pt-5 rule grid grid-cols-[88px_1fr] gap-4">
          <span className="label mt-1">color</span>
          <div className="flex flex-col items-start gap-3">
            <HueWheel hue={hue} onChange={(h) => { setHue(h); if (!spectrum) setTinted(true) }} size={150} />
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => { setTinted(false); setSpectrum(false) }}
                aria-pressed={!tinted && !spectrum}
                className="playground-pill px-3 py-1.5 text-[11px] rounded-md cursor-pointer"
                style={{ border: '0.8px solid var(--ink)', background: !tinted && !spectrum ? 'var(--ink)' : 'transparent', color: !tinted && !spectrum ? 'var(--surface)' : 'var(--ink)' }}
              >
                ink
              </button>
              <button
                type="button"
                onClick={() => { setTinted(true); setSpectrum(false) }}
                aria-pressed={tinted && !spectrum}
                className="playground-pill px-3 py-1.5 text-[11px] rounded-md cursor-pointer inline-flex items-center gap-2"
                style={{ border: '0.8px solid var(--ink)', background: tinted && !spectrum ? 'var(--ink)' : 'transparent', color: tinted && !spectrum ? 'var(--surface)' : 'var(--ink)' }}
              >
                <span aria-hidden className="w-3 h-3 rounded-full shrink-0" style={{ background: hueToAccent(hue) }} />
                solid
              </button>
              <button
                type="button"
                onClick={() => { setSpectrum(true); setTinted(false) }}
                aria-pressed={spectrum}
                className="playground-pill px-3 py-1.5 text-[11px] rounded-md cursor-pointer inline-flex items-center gap-2"
                style={{ border: '0.8px solid var(--ink)', background: spectrum ? 'var(--ink)' : 'transparent', color: spectrum ? 'var(--surface)' : 'var(--ink)' }}
              >
                <span
                  aria-hidden
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: 'conic-gradient(from 0deg, oklch(0.8 0.15 0), oklch(0.8 0.15 90), oklch(0.8 0.15 180), oklch(0.8 0.15 270), oklch(0.8 0.15 360))' }}
                />
                spectrum
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 rule">
          <div className="label mb-3">the profile, live</div>
          <ProfileReadout atoms={atoms} states={states} budget={mode === 'crystal' ? budget : 'unbounded'} />
        </div>

        <div className="mt-5 pt-5 rule flex items-center gap-2">
          <button
            type="button"
            onClick={randomize}
            className="playground-pill flex-1 px-3.5 py-2 text-[11px] rounded-md cursor-pointer inline-flex items-center justify-center gap-1.5"
            style={{ border: '0.8px solid var(--ink)', background: 'var(--ink)', color: 'var(--surface)' }}
          >
            surprise me
          </button>
          <button
            type="button"
            onClick={replay}
            className="playground-pill px-3.5 py-2 text-[11px] rounded-md cursor-pointer inline-flex items-center justify-center gap-1.5"
            style={{ border: '0.8px solid var(--ink)', background: 'transparent', color: 'var(--ink)' }}
          >
            <span aria-hidden className="replay-glyph">↻</span>
            replay
          </button>
        </div>
      </aside>
    </div>
  )
}

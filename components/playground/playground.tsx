'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { ChatExchange } from '@/components/chat/chat-exchange'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { HueWheel } from './hue-wheel'
import { codaPrompts } from '@/lib/coda/fixtures'
import { GLYPH_STYLE_ITEMS, type GlyphStyle } from '@/lib/diffusion/glyph-styles'
import { hueToAccent, spectrumColor } from '@/lib/playground/color'
import { tokenize } from '@/lib/diffusion/tokenize'
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
import type { ModeName } from '@/lib/diffusion/types'

// The playground is the case study's finale: every axis the piece demonstrated,
// freed to combine. Motion mode × glyph style × reveal duration × color, all
// composable, all live. Color changes apply in place (CSS var + per-word
// color), so dragging the wheel recolors the answer without restarting it;
// anything that changes the choreography or content re-runs the exchange.

type DurationId = 'instant' | 'quick' | 'deep' | 'max'

const MODE_ITEMS: { id: ModeName; label: string; badge?: string }[] = [
  { id: 'mycelium', label: 'Mycelium' },
  { id: 'fog', label: 'Fog' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'mitosis', label: 'Mitosis' },
  // The recorded run for the prompt, re-read over its pre-written answer:
  // real order, timing, and confidence, authored words (see hybridView).
  { id: 'trace', label: 'Sampler', badge: 'recorded' },
]

const TRACE_MS_PER_STEP = 40

const DURATION_ITEMS: { id: DurationId; label: string }[] = [
  { id: 'instant', label: 'Fast' },
  { id: 'quick', label: 'Short' },
  { id: 'deep', label: 'Long' },
  { id: 'max', label: 'Extended' },
]

// Multiplier on the strategy's authored duration. This is presentation timing,
// not a proxy for model deliberation.
const DURATION_SCALE: Record<DurationId, number> = {
  instant: 0.35,
  quick: 1.5,
  deep: 3.0,
  max: 4.6,
}

// A curated handful of the case study's prompts with short pill labels. Each
// still carries its full response text from the shared fixtures.
const PROMPT_ITEMS: { id: string; label: string }[] = [
  { id: 'heron-poem', label: 'Heron at dawn' },
  { id: 'diffusion-explain', label: 'How diffusion works' },
  { id: 'research-summary', label: 'Model research' },
  { id: 'brainstorm', label: 'Name a color' },
]

type Preset = {
  id: string
  label: string
  mode: ModeName
  style: GlyphStyle
  duration: DurationId
  spectrum: boolean
  hue: number
}

// Quick-start recipes that echo the brand specimens from the gallery. Click
// one, then tweak any dial from there: proof the whole language is one
// contract, expressed through shared dials.
const PRESETS: Preset[] = [
  { id: 'spectra', label: 'Spectra', mode: 'fog', style: 'words', duration: 'quick', spectrum: true, hue: 268 },
  { id: 'borealis', label: 'Borealis', mode: 'aurora', style: 'words', duration: 'deep', spectrum: false, hue: 228 },
  { id: 'console', label: 'Console', mode: 'mitosis', style: 'blocks', duration: 'deep', spectrum: false, hue: 150 },
  { id: 'matrix', label: 'Matrix', mode: 'mycelium', style: 'matrix', duration: 'quick', spectrum: false, hue: 138 },
]

function getPrompt(id: string) {
  return codaPrompts.find((p) => p.id === id) ?? codaPrompts[0]!
}

export function Playground() {
  const [promptId, setPromptId] = useState<string>('heron-poem')
  const [mode, setMode] = useState<ModeName>('fog')
  const [style, setStyle] = useState<GlyphStyle>('words')
  const [duration, setDuration] = useState<DurationId>('quick')
  const [hue, setHue] = useState(150)
  const [spectrum, setSpectrum] = useState(false)
  const [replayKey, setReplayKey] = useState(0)

  const prompt = useMemo(() => getPrompt(promptId), [promptId])
  const durationScale = DURATION_SCALE[duration]

  // The recorded run behind the Sampler motion, loaded on first use and
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

  // Color is intentionally absent from the run key, see file header.
  const runKey = `${promptId}-${mode}-${style}-${duration}-${replayKey}-${view?.id ?? 'none'}`

  // Solid: the chosen hue. Spectrum: the overlay rides a hue offset from the
  // rainbow's origin so the band reads as part of the wash.
  const accent = spectrum ? hueToAccent(hue + 36) : hueToAccent(hue)

  const wordColor = useMemo(() => {
    if (spectrum) {
      // Each word steps along ~90% of the wheel from the chosen origin, so the
      // answer paints itself across a rainbow as it locks word by word.
      return (i: number, total: number) =>
        spectrumColor(total <= 1 ? 0 : i / (total - 1), 0.9, hue)
    }
    const solid = hueToAccent(hue)
    return () => solid
  }, [spectrum, hue])

  const applyPreset = useCallback((p: Preset) => {
    setMode(p.mode)
    setStyle(p.style)
    setDuration(p.duration)
    setSpectrum(p.spectrum)
    setHue(p.hue)
    setReplayKey((k) => k + 1)
  }, [])

  const replay = useCallback(() => setReplayKey((k) => k + 1), [])

  const randomize = useCallback(() => {
    const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!
    setPromptId(pick(PROMPT_ITEMS).id)
    setMode(pick(MODE_ITEMS.filter((m) => m.id !== 'trace')).id)
    setStyle(pick(GLYPH_STYLE_ITEMS).id)
    setDuration(pick(DURATION_ITEMS).id)
    setHue(Math.floor(Math.random() * 360))
    setSpectrum(Math.random() < 0.28)
    setReplayKey((k) => k + 1)
  }, [])

  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_396px] items-start">
      {/* Stage, the dark surface, lifted by a faint glow in the live accent. */}
      <div
        className="relative rounded-2xl overflow-hidden min-h-[520px] flex flex-col"
        style={{
          background: 'var(--stage)',
          color: 'var(--stage-text)',
          ['--accent' as string]: accent,
          boxShadow: '0 40px 90px -54px color-mix(in oklab, var(--accent) 60%, transparent)',
        }}
      >
        <div
          className="flex justify-between items-center px-6 pt-5 text-[10px] uppercase tracking-[0.16em]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span style={{ color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)' }}>
            playground
          </span>
          <span style={{ color: 'color-mix(in oklab, var(--stage-text) 80%, transparent)' }}>
            + live
          </span>
        </div>

        <div className="px-5 md:px-7 py-7 flex-1 flex items-center">
          <ChatExchange
            className="w-full"
            prompt={prompt.prompt}
            thinkingMs={620}
            // Decode styles render full-size immediately so the bubble never
            // resizes mid-decode (a resize would re-measure and rewind the
            // glyph stages); 'words' keeps the height-grow entrance.
            answerGrowMs={style === 'words' ? undefined : 0}
            runKey={runKey}
          >
            {traceWaiting ? (
              <div
                className="text-[11px] uppercase tracking-[0.16em]"
                style={{ fontFamily: 'var(--font-mono)', color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)' }}
              >
                loading trajectory
              </div>
            ) : (
              <DiffusionText
                mode={mode}
                glyphStyle={style}
                wordColor={wordColor}
                durationScale={durationScale}
                trigger="immediate"
                announce="on-complete"
                showStatus
                className="text-base md:text-lg leading-relaxed"
                strategy={traceStrat}
                provisionalAt={view ? provisionalAt : undefined}
                stepCount={view ? view.step_ms.length : undefined}
                stepAt={stepAt}
                wordConf={traceConf}
              >
                {prompt.response}
              </DiffusionText>
            )}
          </ChatExchange>
        </div>

        <div
          className="flex justify-between items-center gap-3 px-6 pb-5 text-[10px] uppercase tracking-[0.16em]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span
            className="truncate"
            style={{ color: 'color-mix(in oklab, var(--stage-text) 58%, transparent)' }}
          >
            {mode} · {style} · {durationLabel} ·{' '}
            {spectrum ? (
              'spectrum'
            ) : (
              // Only the degree value tracks the wheel; the rest stays muted.
              <span style={{ color: hueToAccent(hue) }}>{Math.round(hue)}°</span>
            )}
          </span>
          <button
            type="button"
            onClick={replay}
            aria-label="Replay animation"
            className="replay-btn cursor-pointer inline-flex items-center gap-1.5 shrink-0"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'color-mix(in oklab, var(--stage-text) 64%, transparent)',
            }}
          >
            <span aria-hidden="true" className="replay-glyph">
              ↻
            </span>
            Replay
          </button>
        </div>
      </div>

      {/* Console, controls echo the live accent (active dots, focus rings). */}
      <aside
        className="w-full lg:sticky lg:top-24 rounded-2xl border p-5 md:p-6"
        style={{
          borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)',
          background: 'var(--surface)',
          ['--accent' as string]: accent,
        }}
      >
        <div
          className="text-[9.5px] uppercase tracking-[0.18em] mb-4"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          + Console
        </div>

        {/* Preset quick-starts */}
        <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[88px_1fr] gap-4 items-center mb-4">
          <span
            className="text-[9.5px] uppercase tracking-[0.16em]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            Preset
          </span>
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
          <ToggleRail label="Prompt" items={PROMPT_ITEMS} activeId={promptId} onSelect={setPromptId} />
          <ToggleRail label="Motion" items={MODE_ITEMS} activeId={mode} onSelect={(id) => setMode(id as ModeName)} />
          <ToggleRail label="Style" items={GLYPH_STYLE_ITEMS} activeId={style} onSelect={(id) => setStyle(id as GlyphStyle)} />
          <ToggleRail
            label="Reveal time"
            items={DURATION_ITEMS}
            activeId={duration}
            onSelect={(id) => setDuration(id as DurationId)}
          />
        </div>

        {/* Color */}
        <div
          className="mt-5 pt-5 border-t grid grid-cols-[64px_1fr] sm:grid-cols-[88px_1fr] gap-4"
          style={{ borderColor: 'color-mix(in oklab, var(--ink) 12%, transparent)' }}
        >
          <span
            className="text-[9.5px] uppercase tracking-[0.16em] mt-1"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            Color
          </span>
          <div className="flex flex-col items-start gap-3">
            <HueWheel hue={hue} onChange={setHue} size={150} />
            <button
              type="button"
              onClick={() => setSpectrum((s) => !s)}
              aria-pressed={spectrum}
              className="playground-pill px-3.5 py-1.5 text-[11px] rounded-md cursor-pointer inline-flex items-center gap-2"
              style={{
                border: '0.8px solid var(--ink)',
                background: spectrum ? 'var(--ink)' : 'transparent',
                color: spectrum ? 'var(--surface)' : 'var(--ink)',
              }}
            >
              <span
                aria-hidden
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{
                  background:
                    'conic-gradient(from 0deg, oklch(0.8 0.15 0), oklch(0.8 0.15 90), oklch(0.8 0.15 180), oklch(0.8 0.15 270), oklch(0.8 0.15 360))',
                }}
              />
              {spectrum ? 'Spectrum on' : 'Spectrum'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div
          className="mt-5 pt-5 border-t flex items-center gap-2"
          style={{ borderColor: 'color-mix(in oklab, var(--ink) 12%, transparent)' }}
        >
          <button
            type="button"
            onClick={randomize}
            className="playground-pill flex-1 px-3.5 py-2 text-[11px] rounded-md cursor-pointer inline-flex items-center justify-center gap-1.5"
            style={{ border: '0.8px solid var(--ink)', background: 'var(--ink)', color: 'var(--surface)' }}
          >
            <span aria-hidden>✦</span> Surprise me
          </button>
          <button
            type="button"
            onClick={replay}
            className="playground-pill px-3.5 py-2 text-[11px] rounded-md cursor-pointer inline-flex items-center justify-center gap-1.5"
            style={{ border: '0.8px solid var(--ink)', background: 'transparent', color: 'var(--ink)' }}
          >
            <span aria-hidden className="replay-glyph">
              ↻
            </span>
            Replay
          </button>
        </div>
      </aside>
    </div>
  )
}

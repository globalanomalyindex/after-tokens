'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Section } from '@/components/section'
import { BrandProvider } from '@/lib/brand/provider'
import { useBrand } from '@/lib/brand/provider'
import { getBrand } from '@/lib/brand/brands'
import { codaPrompts, type CodaPrompt } from '@/lib/coda/fixtures'
import { CodaStage } from '@/components/coda/coda-stage'
import { PromptPicker } from '@/components/coda/prompt-picker'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { Highlight } from '@/components/chrome/highlight'
import { DefinitionTerm } from '@/components/chrome/definition-term'
import { tokenize } from '@/lib/diffusion/tokenize'
import { mycelium } from '@/lib/diffusion/modes/mycelium'
import { fog } from '@/lib/diffusion/modes/fog'
import { aurora } from '@/lib/diffusion/modes/aurora'
import { mitosis } from '@/lib/diffusion/modes/mitosis'
import { traceStrategy } from '@/lib/diffusion/traces'
import { loadTrace, type TraceId } from '@/lib/traces'
import type { TraceCompact } from '@/lib/diffusion/traces'
import type { BrandId } from '@/lib/brand/types'
import type { MeasuredAtom, ModeStrategy } from '@/lib/diffusion/types'

const modes: ModeStrategy['name'][] = ['mycelium', 'fog', 'aurora', 'mitosis', 'trace']
const brandIds: BrandId[] = ['after-tokens', 'halcyon', 'felt', 'pulse', 'voltage']

const strategies: Record<Exclude<ModeStrategy['name'], 'trace'>, ModeStrategy> = {
  mycelium,
  fog,
  aurora,
  mitosis,
}

type RevealPace = 'instant' | 'low' | 'med' | 'high'

// Presentation-only duration controls. They change the authored reveal window;
// inference time and model effort stay fixed.
const revealScale: Record<RevealPace, number> = {
  instant: 0.35,
  low: 1.5,
  med: 3.0,
  high: 4.6,
}

const revealName: Record<RevealPace, string> = {
  instant: 'Fast',
  low: 'Short',
  med: 'Medium',
  high: 'Long',
}

// Derive the real settle time for a (response, mode, scale) combination so the
// rail labels track what actually runs instead of hardcoded guesses. The exact
// total needs DOM geometry, but every mode's totalDuration is dominated by token
// count, so we run the real strategy over zero-bbox atoms (one per token). That
// keeps the label honest per prompt and per multiplier; it shifts in lockstep
// with the choreography.
function syntheticAtoms(text: string): MeasuredAtom[] {
  return tokenize(text).map((a) => ({ ...a, bbox: { x: 0, y: 0, w: 0, h: 0 } }))
}

function formatSettleSeconds(ms: number): string {
  const seconds = ms / 1000
  // Sub-second reads as "instant" rather than "~0s"; otherwise round to a
  // friendly resolution that still moves as the budget changes.
  if (seconds < 0.8) return '~0.5s'
  return `~${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`
}

function settleLabel(
  response: string,
  mode: ModeStrategy['name'],
  scale: number,
  trace: TraceCompact | undefined,
): string {
  if (mode === 'trace') {
    // A recorded trajectory's duration comes from the trace itself, so there
    // is nothing to report until it has loaded.
    if (!trace) return '...'
    const baseMs = traceStrategy(trace, { msPerStep: 40 }).totalDuration(syntheticAtoms(response))
    return formatSettleSeconds(baseMs * scale)
  }
  const baseMs = strategies[mode].totalDuration(syntheticAtoms(response))
  return formatSettleSeconds(baseMs * scale)
}

export function SectionCoda() {
  const [activePromptId, setActivePromptId] = useState(codaPrompts[1]!.id)
  const activePrompt = useMemo(() => codaPrompts.find((p) => p.id === activePromptId)!, [activePromptId])
  const [mode, setMode] = useState<ModeStrategy['name']>(activePrompt.defaultMode)
  const [brandId, setBrandId] = useState<BrandId>('after-tokens')
  const [revealPace, setRevealPace] = useState<RevealPace>('low')
  const [replayKey, setReplayKey] = useState(0)
  const [trace, setTrace] = useState<TraceCompact | undefined>(undefined)
  const traceCacheRef = useRef(new Map<string, TraceCompact>())

  useEffect(() => {
    setMode(activePrompt.defaultMode)
  }, [activePrompt])

  // Load the recorded trajectory for the active prompt. All seven coda fixtures
  // were captured under lowconf-b32; cache by trace id so switching back to a
  // prompt already visited does not re-fetch.
  useEffect(() => {
    const traceId = `${activePrompt.id}__lowconf-b32` as TraceId
    const cached = traceCacheRef.current.get(traceId)
    if (cached) {
      setTrace(cached)
      return
    }
    setTrace(undefined)
    let cancelled = false
    loadTrace(traceId).then((t) => {
      if (cancelled) return
      traceCacheRef.current.set(traceId, t)
      setTrace(t)
    })
    return () => {
      cancelled = true
    }
  }, [activePrompt.id])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        // Don't hijack Space while the visitor is typing in a field.
        const el = e.target as HTMLElement | null
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
          return
        }
        const rect = document.querySelector('#coda')?.getBoundingClientRect()
        if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
          e.preventDefault()
          // A real replay: bump the nonce threaded into CodaStage, which folds
          // it into the exchange runKey and re-runs the whole choreography.
          setReplayKey((k) => k + 1)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const durationScale = revealScale[revealPace]

  // Derive each presentation duration from the active response and mode.
  const revealLabels = useMemo(() => {
    const out = {} as Record<RevealPace, string>
    ;(['instant', 'low', 'med', 'high'] as const).forEach((t) => {
      out[t] = `${revealName[t]} · ${settleLabel(activePrompt.response, mode, revealScale[t], trace)}`
    })
    return out
  }, [activePrompt.response, mode, trace])

  return (
    <Section id="coda" n={6} act="III" title="Intent mapping" eyebrow={['Application', 'Fixture-authored mapping']}>
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter lowercase leading-tight mb-4 max-w-3xl">
        <span className="title-index">vi.</span>map response intent to a reveal
      </h2>
      <p className="mb-10 text-base max-w-prose">
        <Highlight>
          Pick a response fixture. I tagged each one with a reveal hypothesis: structured answers
          lock in clusters; open-ended answers drift in. The mapping is authored by hand.
          Override it to compare how presentation changes the read without pretending the model chose it.
          The fifth option replays what a real sampler did for this exact prompt, at 40 milliseconds
          per step; the answer belongs to the model.
        </Highlight>
      </p>

      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        <BrandProvider brand={brandId} className="rounded-2xl p-6 md:p-10 border w-full">
          <CodaScaffold
            prompt={activePrompt}
            mode={mode}
            durationScale={durationScale}
            replayKey={replayKey}
            trace={trace}
          />
        </BrandProvider>

        <aside className="w-full lg:sticky lg:top-24">
          <div
            className="text-[9.5px] uppercase tracking-[0.16em] mb-3"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            + Pick a prompt
          </div>
          <PromptPicker
            prompts={codaPrompts}
            activeId={activePromptId}
            onSelect={setActivePromptId}
            layout="list"
          />
          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            The label above shows the mode the prompt is tagged with. Press Space to replay the read.
          </p>
        </aside>
      </div>

      <p className="mt-10 text-base max-w-prose">
        <Highlight>
          Pace is a measured variable here. The <DefinitionTerm term="doherty threshold" /> marks
          roughly where a system stops feeling responsive, so a reveal that outlasts the answer it is describing
          is a cost. The rail exists so that trade is visible instead of assumed.
        </Highlight>
      </p>

      <div
        className="mt-6 grid gap-4 pt-6 border-t"
        style={{ borderColor: 'color-mix(in oklab, var(--ink) 25%, transparent)' }}
      >
        <ToggleRail
          label="Mode"
          items={modes.map((m) =>
            m === 'trace'
              ? { id: m, label: 'Sampler', badge: 'recorded' }
              : {
                  id: m,
                  label: cap(m),
                  badge: m === activePrompt.defaultMode && m === mode ? 'fixture' : undefined,
                },
          )}
          activeId={mode}
          onSelect={(id) => setMode(id as ModeStrategy['name'])}
        />
        <ToggleRail
          label="Reveal time"
          items={(['instant', 'low', 'med', 'high'] as const).map((t) => ({
            id: t,
            label: revealLabels[t],
          }))}
          activeId={revealPace}
          onSelect={(id) => setRevealPace(id as RevealPace)}
        />
        <ToggleRail
          label="Brand"
          items={brandIds.map((b) => ({ id: b, label: getBrand(b).name }))}
          activeId={brandId}
          onSelect={(id) => setBrandId(id as BrandId)}
        />
      </div>
    </Section>
  )
}

function CodaScaffold({
  prompt,
  mode,
  durationScale,
  replayKey,
  trace,
}: {
  prompt: CodaPrompt
  mode: ModeStrategy['name']
  durationScale: number
  replayKey: number
  trace: TraceCompact | undefined
}) {
  const brand = useBrand()
  return (
    <div
      style={{ background: 'var(--surface)', borderRadius: 'var(--brand-radius)', padding: '24px' }}
    >
      <CodaStage
        prompt={prompt}
        mode={mode}
        brand={brand}
        isAutoMode={prompt.defaultMode === mode}
        durationScale={durationScale}
        replayKey={replayKey}
        trace={trace}
      />
    </div>
  )
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

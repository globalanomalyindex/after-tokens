'use client'

import { useEffect, useMemo, useState } from 'react'
import { Section } from '@/components/section'
import { BrandProvider } from '@/lib/brand/provider'
import { useBrand } from '@/lib/brand/provider'
import { getBrand } from '@/lib/brand/brands'
import { codaPrompts, type CodaPrompt } from '@/lib/coda/fixtures'
import { CodaStage } from '@/components/coda/coda-stage'
import { PromptPicker } from '@/components/coda/prompt-picker'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { Highlight } from '@/components/chrome/highlight'
import { tokenize } from '@/lib/diffusion/tokenize'
import { mycelium } from '@/lib/diffusion/modes/mycelium'
import { fog } from '@/lib/diffusion/modes/fog'
import { aurora } from '@/lib/diffusion/modes/aurora'
import { mitosis } from '@/lib/diffusion/modes/mitosis'
import type { BrandId } from '@/lib/brand/types'
import type { MeasuredAtom, ModeStrategy } from '@/lib/diffusion/types'

const modes: ModeStrategy['name'][] = ['mycelium', 'fog', 'aurora', 'mitosis']
const brandIds: BrandId[] = ['after-tokens', 'halcyon', 'felt', 'pulse', 'voltage']

const strategies: Record<ModeStrategy['name'], ModeStrategy> = { mycelium, fog, aurora, mitosis }

type ThinkingLevel = 'instant' | 'low' | 'med' | 'high'

// Map thinking-level to a duration multiplier on the strategy's native
// total duration. Instant is for non-thinking diffusion (the answer arrives
// in a split second, almost no pre-roll); low/med/high stretch the window
// so the visible refinement reads as deliberation.
const thinkingScale: Record<ThinkingLevel, number> = {
  instant: 0.35,
  low: 1.5,
  med: 3.0,
  high: 4.6,
}

const thinkingName: Record<ThinkingLevel, string> = {
  instant: 'Instant',
  low: 'Low',
  med: 'Med',
  high: 'High',
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

function settleLabel(response: string, mode: ModeStrategy['name'], scale: number): string {
  const baseMs = strategies[mode].totalDuration(syntheticAtoms(response))
  const seconds = (baseMs * scale) / 1000
  // Sub-second reads as "instant" rather than "~0s"; otherwise round to a
  // friendly resolution that still moves as the budget changes.
  if (seconds < 0.8) return '~0.5s'
  return `~${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`
}

export function SectionCoda() {
  const [activePromptId, setActivePromptId] = useState(codaPrompts[1]!.id)
  const activePrompt = useMemo(() => codaPrompts.find((p) => p.id === activePromptId)!, [activePromptId])
  const [mode, setMode] = useState<ModeStrategy['name']>(activePrompt.defaultMode)
  const [brandId, setBrandId] = useState<BrandId>('after-tokens')
  const [thinking, setThinking] = useState<ThinkingLevel>('low')
  const [replayKey, setReplayKey] = useState(0)

  useEffect(() => {
    setMode(activePrompt.defaultMode)
  }, [activePrompt])

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

  const durationScale = thinkingScale[thinking]

  // Rail labels: the response is what diffuses, so derive each thinking level's
  // settle time from the active prompt's response under the current mode.
  const thinkingLabels = useMemo(() => {
    const out = {} as Record<ThinkingLevel, string>
    ;(['instant', 'low', 'med', 'high'] as const).forEach((t) => {
      out[t] = `${thinkingName[t]} · ${settleLabel(activePrompt.response, mode, thinkingScale[t])}`
    })
    return out
  }, [activePrompt.response, mode])

  return (
    <Section id="coda" n={6} act="III" title="Read your intent" eyebrow={['Coda', 'The system reads you']}>
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter lowercase leading-tight mb-4 max-w-3xl">
        <span className="title-index">vi.</span>the system reads your intent
      </h2>
      <p className="mb-10 text-base max-w-prose">
        <Highlight>
          Pick a prompt. The system classifies what you are asking for and answers in the
          treatment that fits it: an analytic question settles in order, a creative one drifts
          in. The mode is the system telling you how it read you. Override it and watch the
          read change.
        </Highlight>
      </p>

      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        <BrandProvider brand={brandId} className="rounded-2xl p-6 md:p-10 border w-full">
          <CodaScaffold
            prompt={activePrompt}
            mode={mode}
            durationScale={durationScale}
            replayKey={replayKey}
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
            The tag is the mode the system chose for that intent. Press Space to replay the read.
          </p>
        </aside>
      </div>

      <div
        className="mt-10 grid gap-4 pt-6 border-t"
        style={{ borderColor: 'color-mix(in oklab, var(--ink) 25%, transparent)' }}
      >
        <ToggleRail
          label="Mode"
          items={modes.map((m) => ({ id: m, label: cap(m), isAuto: m === activePrompt.defaultMode && m === mode }))}
          activeId={mode}
          onSelect={(id) => setMode(id as ModeStrategy['name'])}
        />
        <ToggleRail
          label="Thinking"
          items={(['instant', 'low', 'med', 'high'] as const).map((t) => ({
            id: t,
            label: thinkingLabels[t],
          }))}
          activeId={thinking}
          onSelect={(id) => setThinking(id as ThinkingLevel)}
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
}: {
  prompt: CodaPrompt
  mode: ModeStrategy['name']
  durationScale: number
  replayKey: number
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
      />
    </div>
  )
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

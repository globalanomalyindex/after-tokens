'use client'

import { useMemo, useState } from 'react'
import { BrandProvider, useBrand } from '@/lib/brand/provider'
import { getBrand, VOICE_RANGES } from '@/lib/brand/brands'
import { ChatExchange } from '@/components/chat/chat-exchange'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { PromptPicker } from '@/components/coda/prompt-picker'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { codaPrompts } from '@/lib/coda/fixtures'
import type { BrandId, BrandVoice } from '@/lib/brand/types'

// One grammar, five voices. Pick a prompt and a brand, then move the six
// tokens inside their ranges; the reveal keeps every property of its
// profile whatever the sliders say, because the ranges are the invariants.

const BRAND_IDS: BrandId[] = ['after-tokens', 'halcyon', 'felt', 'pulse', 'voltage']

const TOKENS: { key: keyof BrandVoice; label: string; step: number; format: (v: number) => string; note: string }[] = [
  { key: 'tempo', label: 'tempo', step: 0.05, format: (v) => `${v.toFixed(2)}×`, note: 'the cadence, inside the attention window' },
  { key: 'attack', label: 'attack', step: 10, format: (v) => `${Math.round(v)} ms`, note: 'the snap to crisp, never gradual enough to lose the aha' },
  { key: 'weight', label: 'weight', step: 0.05, format: (v) => `${Math.round(400 + 300 * v)}`, note: 'how heavy a settled word gets' },
  { key: 'glow', label: 'glow', step: 0.05, format: (v) => `${Math.round(v * 100)}%`, note: 'the halo at lock, gone within a second' },
  { key: 'hush', label: 'hush', step: 0.05, format: (v) => `${Math.round(v * 100)}%`, note: 'how dim the open field rests, still illegible' },
  { key: 'swing', label: 'swing', step: 0.01, format: (v) => `${Math.round(v * 100)}%`, note: 'long-short syncopation, linear on average' },
]

export function VoiceStage() {
  const [promptId, setPromptId] = useState(codaPrompts[0]!.id)
  const [brandId, setBrandId] = useState<BrandId>('after-tokens')
  const [override, setOverride] = useState<Partial<BrandVoice>>({})
  const [replay, setReplay] = useState(0)
  const prompt = useMemo(() => codaPrompts.find((p) => p.id === promptId)!, [promptId])
  const base = getBrand(brandId)
  const voice: BrandVoice = { ...base.voice, ...override }
  const touched = Object.keys(override).length > 0

  const set = (key: keyof BrandVoice, value: number) => setOverride((o) => ({ ...o, [key]: value }))

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
      <BrandProvider brand={brandId} voice={override} className="w-full">
        <VoiceFrame prompt={prompt.prompt} answer={prompt.response} runKey={`${prompt.id}-${brandId}-${replay}`} onReplay={() => setReplay((k) => k + 1)} />
      </BrandProvider>
      <aside className="grid gap-7">
        <div>
          <div className="label mb-3">prompt</div>
          <PromptPicker prompts={codaPrompts} activeId={promptId} onSelect={setPromptId} layout="compact" />
        </div>
        <div>
          <div className="label mb-3">brand</div>
          <ToggleRail label="" items={BRAND_IDS.map((b) => ({ id: b, label: getBrand(b).name }))} activeId={brandId} onSelect={(id) => { setBrandId(id as BrandId); setOverride({}) }} />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="label">voice</span>
            {touched && (
              <button type="button" className="readout cursor-pointer" style={{ color: 'var(--cobalt)' }} onClick={() => setOverride({})}>
                back to {base.name.toLowerCase()}&rsquo;s voice
              </button>
            )}
          </div>
          <div className="grid gap-3">
            {TOKENS.map((t) => {
              const [lo, hi] = VOICE_RANGES[t.key]
              const id = `voice-${t.key}`
              return (
                <div key={t.key} className="grid grid-cols-[4.5rem_1fr_4rem] items-center gap-3">
                  <label htmlFor={id} className="readout" style={{ color: 'var(--ink)' }}>
                    {t.label}
                  </label>
                  <input
                    id={id}
                    type="range"
                    className="voice-range"
                    min={lo}
                    max={hi}
                    step={t.step}
                    value={voice[t.key]}
                    onChange={(e) => set(t.key, Number(e.target.value))}
                    aria-describedby={`${id}-note`}
                  />
                  <span className="readout text-right" style={{ color: 'var(--muted)' }}>
                    {t.format(voice[t.key])}
                  </span>
                  <span id={`${id}-note`} className="sr-only">
                    {t.note}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-3 readout leading-relaxed" style={{ color: 'var(--muted)' }}>
            each range is an invariant: tempo stays inside the attention window, attack never softens past the aha,
            hush never makes a pending word legible. the budget, the phrases, the forming lead, and the exhale are
            grammar, outside the voice.
          </p>
        </div>
      </aside>
    </div>
  )
}

function VoiceFrame({ prompt, answer, runKey, onReplay }: { prompt: string; answer: string; runKey: string; onReplay: () => void }) {
  const brand = useBrand()
  return (
    <div
      className="p-4 md:p-6 border"
      style={{
        background: 'var(--surface-tint)',
        borderRadius: 'var(--brand-radius)',
        borderColor: 'color-mix(in oklab, var(--ink) 12%, transparent)',
        fontFamily: 'var(--font-brand-body)',
      }}
    >
      <div className="stage relative min-h-[480px] flex flex-col" style={{ borderRadius: 'var(--brand-radius)' }}>
        <div className="flex justify-between items-center px-6 pt-5 readout" style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}>
          <span>{brand.name}</span>
          <span>crystallize · {brand.voice.tempo.toFixed(2)}× · {Math.round(brand.voice.attack)}{' '}ms</span>
        </div>
        <div className="px-5 py-7 flex-1 flex items-center">
          <ChatExchange className="w-full" prompt={prompt} thinkingMs={600} runKey={`${runKey}-${brand.voice.tempo}-${brand.voice.swing}`}>
            <DiffusionText mode="crystal" trigger="immediate" topic={prompt} announce="on-complete" showStatus className="text-base md:text-lg leading-relaxed">
              {answer}
            </DiffusionText>
          </ChatExchange>
        </div>
        <div className="flex justify-end px-6 pb-5">
          <button
            type="button"
            onClick={onReplay}
            aria-label="Replay the answer"
            className="replay-btn cursor-pointer inline-flex items-center gap-1.5"
            style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}
          >
            <span aria-hidden="true" className="replay-glyph">↻</span>
            replay
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SettleStage } from '@/components/settle/settle-stage'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { brands } from '@/lib/brand/brands'
import type { BrandId } from '@/lib/brand/types'
import { MARK_SHAPES, SETTLE_RANGES, type MarkShape, type SettleVoice } from '@/lib/settle/voice'

// The voice: five tokens on the one surface, each inside a range that is an
// invariant. The sliders move a live stage; the numbers say what each keeps.

const TOKENS: { key: keyof SettleVoice; range: string; changes: string; keeps: string }[] = [
  { key: 'mark', range: 'tick, dot, dash, square', changes: 'the glyph of a field cell and of the margin mark', keeps: 'every cell state legible at every size' },
  { key: 'bloom', range: '0 to 1', changes: 'how much a cell flares when it commits', keeps: 'gone within 240 ms; no flare on released text' },
  { key: 'onset', range: '0 to 240 ms', changes: 'the opacity ramp of a passage arriving on the page', keeps: 'never a transform, never a blur, zero under reduced motion' },
  { key: 'tempo', range: '0.7 to 1.4', changes: 'the breath of the margin mark while receiving', keeps: 'rest at every terminal state' },
  { key: 'grain', range: '0 to 1', changes: 'how faint open cells rest, how dim the forming text rests', keeps: 'forming text at least 3:1 against its surface' },
]

const SLIDERS: { key: Exclude<keyof SettleVoice, 'mark'>; step: number; unit?: string }[] = [
  { key: 'bloom', step: 0.05 },
  { key: 'onset', step: 10, unit: 'ms' },
  { key: 'tempo', step: 0.05 },
  { key: 'grain', step: 0.05 },
]

export function SectionVoice() {
  const [brand, setBrand] = useState<BrandId>('after-tokens')
  const [override, setOverride] = useState<Partial<SettleVoice>>({})
  const base = brands[brand].settle
  const voice: SettleVoice = { ...base, ...override }
  const set = (key: keyof SettleVoice, value: number | MarkShape) => setOverride((o) => ({ ...o, [key]: value }))
  return (
    <Section id="voice" title="A voice in the margin">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">a voice in the margin</h2>
      <p className="standfirst max-w-3xl">
        a brand does not get a new reveal. it gets five tokens on the one surface, each inside a range that is an
        invariant, so a brand can color the arrival and cannot change when text becomes available, whether it moves,
        or what the margin says.
      </p>
      <div className="mt-12 md:mt-16 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="rule">
              <th scope="col" className="py-3 pr-4 font-medium text-sm">token</th>
              <th scope="col" className="py-3 pr-4 font-medium text-sm">range</th>
              <th scope="col" className="py-3 pr-4 font-medium text-sm">changes</th>
              <th scope="col" className="py-3 font-medium text-sm">keeps</th>
            </tr>
          </thead>
          <tbody>
            {TOKENS.map((t) => (
              <tr key={t.key} className="rule">
                <th scope="row" className="py-3 pr-4 font-semibold text-sm align-top">{t.key}</th>
                <td className="py-3 pr-4 readout align-top whitespace-nowrap">{t.range}</td>
                <td className="py-3 pr-4 text-sm align-top" style={{ color: 'var(--ink-2)' }}>{t.changes}</td>
                <td className="py-3 text-sm align-top" style={{ color: 'var(--ink-2)' }}>{t.keeps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 md:mt-16">
        <div className="grid gap-4 mb-6">
          <ToggleRail label="brand" items={(Object.keys(brands) as BrandId[]).map((id) => ({ id, label: brands[id].name.toLowerCase() }))} activeId={brand} onSelect={(id) => { setBrand(id as BrandId); setOverride({}) }} />
          <ToggleRail label="mark" items={MARK_SHAPES.map((m) => ({ id: m, label: m }))} activeId={voice.mark} onSelect={(id) => set('mark', id as MarkShape)} />
        </div>
        <SettleStage
          key={brand}
          source="trace:golden-sunflower__lowconf-b32"
          pace={{ scale: 4 }}
          brand={brand}
          voice={voice}
          readout={() => (
            <div className="grid gap-5 pt-1">
              {SLIDERS.map((s) => {
                const [lo, hi] = SETTLE_RANGES[s.key]
                const id = `voice-${s.key}`
                return (
                  <div key={s.key}>
                    <div className="flex justify-between items-baseline mb-1">
                      <label htmlFor={id} className="label">{s.key}</label>
                      <span className="readout" style={{ color: 'var(--ink)' }}>{s.key === 'onset' ? Math.round(voice.onset) : voice[s.key].toFixed(2)}{s.unit ? ` ${s.unit}` : ''}</span>
                    </div>
                    <input id={id} type="range" className="voice-range" min={lo} max={hi} step={s.step} value={voice[s.key]} onChange={(e) => set(s.key, Number(e.target.value))} />
                    <div className="flex justify-between readout" style={{ color: 'var(--muted)' }}><span>{lo}</span><span>{hi}</span></div>
                  </div>
                )
              })}
              <p className="readout leading-relaxed" style={{ color: 'var(--muted)' }}>the sliders stop at the ranges. release timing is the reducer&rsquo;s and does not move.</p>
            </div>
          )}
        />
      </div>

      <div className="mt-12 md:mt-16 grid gap-6 md:grid-cols-5 rule pt-8">
        {(Object.keys(brands) as BrandId[]).map((id, i) => {
          const b = brands[id]
          return (
            <Reveal key={id} delay={i * 50}>
              <p className="text-base font-semibold">{b.name.toLowerCase()}</p>
              <p className="readout mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                {b.settle.mark} · bloom {b.settle.bloom} · onset {b.settle.onset} ms · tempo {b.settle.tempo} · grain {b.settle.grain}
              </p>
            </Reveal>
          )
        })}
      </div>
    </Section>
  )
}

'use client'

import { useState } from 'react'
import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SettleStage } from '@/components/settle/settle-stage'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { brands } from '@/lib/brand/brands'
import type { BrandId } from '@/lib/brand/types'
import { SETTLE_RANGES, type SettleVoice } from '@/lib/settle/voice'

// Palette and tempo change the material; source eligibility stays fixed.

const TOKENS = [
  { key: 'palette', range: 'five brand palettes', changes: 'the page, reading ink and cell material', keeps: 'the exact answer and its release policy' },
  { key: 'tempo', range: '0.7 to 1.4', changes: 'the local breathing, reshaping and occasional glimmer', keeps: 'source eligibility and the 280 ms text handover' },
]
const SLIDERS = [{ key: 'tempo', step: .05 }] as const

export function SectionVoice() {
  const [brand, setBrand] = useState<BrandId>('after-tokens')
  const [override, setOverride] = useState<Partial<SettleVoice>>({})
  // the stage replays from the start when a voice setting is committed: a
  // pill at once, a slider when it is let go
  const [run, setRun] = useState(0)
  const replay = () => setRun((k) => k + 1)
  const base = brands[brand].settle
  const voice: SettleVoice = { ...base, ...override }
  const set = (key: keyof SettleVoice, value: number) => setOverride((o) => ({ ...o, [key]: value }))
  return (
    <Section id="voice" title="A voice in the material">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">a voice in the material</h2>
      <p className="standfirst max-w-3xl">
        a palette gives the page and its cells a character; tempo changes how the waiting material moves. the same bubble-to-word handover carries each brand into readable text. these two controls keep source eligibility, finality and the exact answer fixed. the motion is a design choice, not evidence of greater confidence or better reasoning.
      </p>
      <div className="mt-12 md:mt-16 overflow-x-auto" tabIndex={0} role="region" aria-label="Brand voice tokens, scroll horizontally">
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
                <td className="py-3 pr-4 text-sm align-top" style={{ color: 'var(--ink-2)' }} dangerouslySetInnerHTML={{ __html: t.changes }} />
                <td className="py-3 text-sm align-top" style={{ color: 'var(--ink-2)' }} dangerouslySetInnerHTML={{ __html: t.keeps }} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 md:mt-16">
        <div className="grid gap-4 mb-6">
          <ToggleRail label="brand" items={(Object.keys(brands) as BrandId[]).map((id) => ({ id, label: brands[id].name.toLowerCase() }))} activeId={brand} onSelect={(id) => { setBrand(id as BrandId); setOverride({}) }} />
        </div>
        <SettleStage
          key={brand}
          source="trace:golden-sunflower__lowconf-b32"
          policy="answer"
          brand={brand}
          voice={voice}
          runKey={run}
          readout={() => (
            <div className="grid gap-5 pt-1">
              {SLIDERS.map((s) => {
                const [lo, hi] = SETTLE_RANGES[s.key]
                const id = `voice-${s.key}`
                return (
                  <div key={s.key}>
                    <div className="flex justify-between items-baseline mb-1">
                      <label htmlFor={id} className="label">{s.key}</label>
                      <span className="readout" style={{ color: 'var(--ink)' }}>{voice[s.key].toFixed(2)}</span>
                    </div>
                    <input id={id} type="range" className="voice-range" min={lo} max={hi} step={s.step} value={voice[s.key]} onChange={(e) => set(s.key, Number(e.target.value))} onPointerUp={replay} onKeyUp={(e) => { if (/^Arrow|Home|End|Page/.test(e.key)) replay() }} />
                    <div className="flex justify-between readout" style={{ color: 'var(--muted)' }}><span>{lo}</span><span>{hi}</span></div>
                  </div>
                )
              })}
              <p className="readout leading-relaxed" style={{ color: 'var(--muted)' }}>tempo changes the waiting motion. source eligibility and the 280 ms text handover stay fixed.</p>
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
                tempo {b.settle.tempo} · shared reading rules
              </p>
            </Reveal>
          )
        })}
      </div>
    </Section>
  )
}

'use client'

import { useState, type ReactNode } from 'react'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { ChatExchange } from '@/components/chat/chat-exchange'
import type { ModeName } from '@/lib/diffusion/types'

export type ModeSpec = { label: string; value: string }

type ModeDemoProps = {
  mode: ModeName
  // Which side the dark demo stage sits on at desktop. Alternating this
  // across the mode panels breaks the "same composition twice" monotony and
  // gives the run an editorial, woven rhythm.
  stageSide?: 'left' | 'right'
  // Roman-numeral index shown in front of the headline (matches the eyebrow).
  index?: string
  headline: ReactNode
  intro: ReactNode
  prompt: string
  answer: string
  specs?: ModeSpec[]
  // Compact mode tightens the type scale and the stage so two demos can sit
  // side by side beneath the hero as supporting variations of one engine.
  compact?: boolean
}

// Shared layout for the shipping-mode demos. Text column (headline + marked
// intro + a small spec table) paired with the dark chat-frame stage. The stage
// alternates sides per mode. A replay control re-runs the diffusion on demand
// by bumping a runKey that remounts the ChatExchange + DiffusionText.
export function ModeDemo({
  mode,
  stageSide = 'right',
  index,
  headline,
  intro,
  prompt,
  answer,
  specs,
  compact = false,
}: ModeDemoProps) {
  const stageFirst = stageSide === 'left'
  const [replayKey, setReplayKey] = useState(0)
  const replay = () => setReplayKey((k) => k + 1)

  const headlineClass = compact
    ? 'text-2xl md:text-3xl font-bold tracking-tight lowercase leading-[1.06] mb-4'
    : 'text-4xl md:text-5xl font-bold tracking-tighter lowercase leading-[1.04] mb-5'
  const stageMinH = compact ? 'min-h-[300px]' : 'min-h-[420px]'
  const stagePad = compact ? 'p-5 md:p-6' : 'p-5 md:p-7'

  return (
    <div className="grid gap-8 md:gap-12 lg:gap-16 md:grid-cols-2 items-center">
      <div className={stageFirst ? 'md:order-2' : 'md:order-1'}>
        <h2 className={headlineClass}>
          {index && <span className="title-index">{index}</span>}
          {headline}
        </h2>
        <p className={`leading-relaxed max-w-prose mb-8 ${compact ? 'text-sm' : 'text-base'}`} style={{ color: 'var(--ink-2)' }}>
          {intro}
        </p>
        {specs && specs.length > 0 && (
          <dl
            className="border-t max-w-sm"
            style={{ borderColor: 'color-mix(in oklab, var(--ink) 20%, transparent)' }}
          >
            {specs.map((s) => (
              <div
                key={s.label}
                className="flex items-baseline justify-between gap-6 py-2.5 border-b"
                style={{ borderColor: 'color-mix(in oklab, var(--ink) 11%, transparent)' }}
              >
                <dt
                  className="text-[10px] uppercase tracking-[0.16em] shrink-0"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
                >
                  {s.label}
                </dt>
                <dd className="text-sm text-right">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className={stageFirst ? 'md:order-1' : 'md:order-2'}>
        <div
          className={`panel-accent rounded-2xl ${stagePad} ${stageMinH} flex flex-col justify-center`}
          style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
        >
          <ChatExchange prompt={prompt} runKey={`${mode}-${replayKey}`}>
            <DiffusionText
              mode={mode}
              trigger="immediate"
              showStatus
              topic={prompt}
              className="text-base md:text-lg leading-relaxed"
            >
              {answer}
            </DiffusionText>
          </ChatExchange>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={replay}
              aria-label="Replay this demo"
              className="replay-btn cursor-pointer inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'color-mix(in oklab, var(--stage-text) 60%, transparent)',
              }}
            >
              <span aria-hidden="true" className="replay-glyph">
                ↻
              </span>
              replay
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

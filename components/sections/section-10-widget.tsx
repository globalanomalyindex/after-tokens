'use client'

import { useState } from 'react'
import { Section } from '@/components/section'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { WeatherAnswer } from '@/components/widget/weather-answer'
import { Highlight } from '@/components/chrome/highlight'
import { weatherFixtures } from '@/lib/widget/weather-data'
import type { ModeName } from '@/lib/diffusion/types'

type ModeChoice = ModeName | 'auto'

const modeChoices: { id: ModeChoice; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'mycelium', label: 'Mycelium' },
  { id: 'fog', label: 'Fog' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'mitosis', label: 'Mitosis' },
]

export function SectionWidget() {
  const [fixtureId, setFixtureId] = useState<string>(weatherFixtures[0]!.id)
  const [mode, setMode] = useState<ModeChoice>('auto')
  const [replayKey, setReplayKey] = useState(0)
  const fixture = weatherFixtures.find((f) => f.id === fixtureId) ?? weatherFixtures[0]!
  const resolvedMode: ModeName | undefined = mode === 'auto' ? undefined : mode

  return (
    <Section
      id="widget"
      n={7}
      act="III"
      title="Beyond words"
      eyebrow={['Section 07', 'Beyond words', 'Color · graphics · widgets']}
    >
      <div className="grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] items-start">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter lowercase leading-tight mb-6">
            <span className="title-index">vii.</span>Diffusion isn&rsquo;t a text trick,{' '}
            <em className="not-italic" style={{ color: 'var(--muted)' }}>
              it&rsquo;s a way of arriving
            </em>
          </h2>
          <p className="mb-6 text-base leading-relaxed">
            <Highlight>
              Streaming says &ldquo;watch me type.&rdquo; Diffusion says &ldquo;watch me settle.&rdquo;
              The reveal modes that resolve text resolve everything else an answer is made of: color,
              shape, data, glyphs. Same contract, different material. And the same payoff: you read the
              shape of the answer before you read its words.
            </Highlight>
          </p>
          <p className="mb-10 text-base leading-relaxed">
            <Highlight>
              Look right. Ask &ldquo;what&rsquo;s the weather&rdquo; and the assistant answers in one
              bubble: a widget settles and a sentence follows underneath. The parts that lock first are
              the parts the system is sure of; the ones still resolving are the ones it is still
              weighing. Switch cities to watch a different palette commit. Switch modes to watch the
              same answer arrive a different way.
            </Highlight>
          </p>

          <ul className="space-y-3 text-sm leading-relaxed">
            <Bullet label="Color">
              <Highlight>
                The sky binds first: warm desert, slate Seattle, ice-paper Reykjav&iacute;k.
                Palette is the first commitment of any visual answer.
              </Highlight>
            </Bullet>
            <Bullet label="Graphic">
              <Highlight>
                The icon is observed, not stamped. Stained-glass treatment so the sky still
                glows through.
              </Highlight>
            </Bullet>
            <Bullet label="Data">
              <Highlight>
                The temperature cycles through plausible neighbors before it locks. Forecast bars
                wobble, then snap to true heights. The wobble is the system showing its uncertainty:
                you can see which numbers it is still weighing before it commits.
              </Highlight>
            </Bullet>
            <Bullet label="Same engine">
              <Highlight>
                The diffusion driving this widget is the same mycelium, fog, and aurora grammar from
                the mode tour, with mitosis available as a fourth treatment. The mycelium halo pulses
                behind each forecast bar; fog parts to reveal the answer; aurora bands sweep the
                temperature.
              </Highlight>
            </Bullet>
          </ul>
        </div>

        <div
          className="w-full rounded-3xl p-5 md:p-6"
          style={{
            background: 'var(--stage)',
            color: 'var(--stage-text)',
            border: '0.6px solid color-mix(in oklab, var(--stage-text) 12%, transparent)',
          }}
        >
          {/*
            Key on WeatherAnswer (no AnimatePresence wait-wrap) — settings
            changes need to instantly remount the canvas so the new diffusion
            starts immediately. The exit fade was hiding the replay behind
            a 600ms wait that read as "nothing happened."
          */}
          <WeatherAnswer
            key={`${fixture.id}-${mode}-${replayKey}`}
            fixture={fixture}
            mode={resolvedMode}
            replayKey={replayKey}
          />

          <div
            className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.18em]"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)',
            }}
          >
            <span>+ Live answer · weather</span>
            <button
              type="button"
              onClick={() => setReplayKey((k) => k + 1)}
              className="replay-btn cursor-pointer inline-flex items-center gap-1.5"
              aria-label="Replay diffusion sequence"
            >
              <span aria-hidden="true" className="replay-glyph">↻</span>
              Replay
            </button>
          </div>
        </div>
      </div>

      <div
        className="mt-10 grid gap-4 pt-6 border-t"
        style={{ borderColor: 'color-mix(in oklab, var(--ink) 25%, transparent)' }}
      >
        <ToggleRail
          label="City"
          items={weatherFixtures.map((f) => ({ id: f.id, label: f.city }))}
          activeId={fixture.id}
          onSelect={(id) => setFixtureId(id)}
        />
        <ToggleRail
          label="Mode"
          items={modeChoices.map((c) => ({
            id: c.id,
            label: c.label,
            isAuto: c.id === 'auto',
          }))}
          activeId={mode}
          onSelect={(id) => setMode(id as ModeChoice)}
        />
      </div>
    </Section>
  )
}

function Bullet({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[88px_1fr] gap-4 items-start">
      <span
        className="text-[9.5px] uppercase tracking-[0.16em] mt-[3px]"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
      >
        + {label}
      </span>
      <span>{children}</span>
    </li>
  )
}

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
  { id: 'auto', label: 'Fixture' },
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
      n={6}
      act="III"
      title="Beyond words"
      eyebrow={['Application', 'Structured answer state']}
    >
      <div className="grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] items-start">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter lowercase leading-tight mb-6">
            <span className="title-index">vi.</span>the state contract extends beyond text,{' '}
            <em className="not-italic" style={{ color: 'var(--muted)' }}>
              it&rsquo;s a way of arriving
            </em>
          </h2>
          <p className="mb-6 text-base leading-relaxed">
            <Highlight>
              An assistant answer can contain color, data, icons, and layout—not only words. This
              prototype applies the same ready → resolving → resolved contract to the whole response
              so structured content does not fall back to a generic spinner.
            </Highlight>
          </p>
          <p className="mb-10 text-base leading-relaxed">
            <Highlight>
              The weather values are static fixtures, and every intermediate value is a deterministic
              authored trace. Nothing here represents live uncertainty. Switch cities and modes to
              inspect how one content structure behaves under different presentation strategies.
            </Highlight>
          </p>

          <ul className="space-y-3 text-sm leading-relaxed">
            <Bullet label="Color">
              <Highlight>
                The fixture&rsquo;s sky palette establishes the widget surface before detailed data appears.
              </Highlight>
            </Bullet>
            <Bullet label="Graphic">
              <Highlight>
                The icon and background share one staged reveal instead of arriving as unrelated assets.
              </Highlight>
            </Bullet>
            <Bullet label="Data">
              <Highlight>
                The temperature follows a deterministic fixture-authored trace; forecast bars use the
                same progress value. This demonstrates coordination, not model uncertainty.
              </Highlight>
            </Bullet>
            <Bullet label="Same engine">
              <Highlight>
                The widget uses the same strategy contract as text: all four modes receive measured
                targets, one progress value, and the same reduced-motion completion path.
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
            <span>+ Prototype fixture · weather</span>
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
            badge: c.id === 'auto' ? 'default' : undefined,
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

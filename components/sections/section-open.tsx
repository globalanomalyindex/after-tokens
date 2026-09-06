'use client'

import { useState } from 'react'
import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { NatureWord } from '@/components/chrome/nature-word'
import { WeatherAnswer } from '@/components/widget/weather-answer'
import { weatherFixtures } from '@/lib/widget/weather-data'

const OPEN: { title: string; body: string }[] = [
  {
    title: 'a saliency model in the nucleus',
    body: 'the authored score picks the word that opens a phrase. with a live sampler the nucleus would be the phrase’s surest token, and the state channel would carry its real belief.',
  },
  {
    title: 'a live sampler on the other end',
    body: 'the recorded mode already consumes the shape a step callback emits: which positions committed, with what probability. wiring the grammar to a running model is plumbing.',
  },
  {
    title: 'structured answers',
    body: 'an answer carries color, data, icons, and layout as well as words. the widget beside this list runs the same contract over a weather card; the profile has no definition for non-text atoms yet.',
  },
  {
    title: 'other scripts, other units',
    body: 'the phrase and the word are the units here. in scripts where they differ, the segmentation and the salience need their own rules.',
  },
  {
    title: 'the body as a channel',
    body: 'a closure is a small completion; a device that can tick could tick with it, and the exhale could be felt. haptics are unbuilt on purpose until the visual grammar is tested.',
  },
]

export function SectionOpen() {
  const [replay, setReplay] = useState(0)
  const fixture = weatherFixtures[0]!
  return (
    <Section id="open" title="What is open">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">what is open</h2>
      <p className="standfirst max-w-3xl">
        a concept earns its keep by what it leaves room for. five directions, each a real extension of the same
        grammar, none of them needed to make the argument above.
      </p>
      <div className="mt-12 md:mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] items-start">
        <dl className="grid gap-7 rule pt-6">
          {OPEN.map((o, i) => (
            <Reveal key={o.title} delay={i * 60}>
              <dt className="text-base font-semibold">{o.title}</dt>
              <dd className="mt-1 text-base leading-relaxed max-w-[58ch]" style={{ color: 'var(--ink-2)' }}>
                {o.body}
              </dd>
            </Reveal>
          ))}
        </dl>
        <Reveal delay={120} className="stage p-5 md:p-6">
          <WeatherAnswer key={`${fixture.id}-${replay}`} fixture={fixture} mode="crystal" replayKey={replay} />
          <div className="mt-5 flex items-center justify-between readout" style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}>
            <span>a structured answer · fixture</span>
            <button
              type="button"
              onClick={() => setReplay((k) => k + 1)}
              className="replay-btn cursor-pointer inline-flex items-center gap-1.5"
              aria-label="Replay the widget"
            >
              <span aria-hidden="true" className="replay-glyph">↻</span>
              replay
            </button>
          </div>
        </Reveal>
      </div>
      <div className="mt-16 md:mt-24 rule pt-8 max-w-2xl">
        <p className="text-base">
          product design and engineering by <span style={{ fontWeight: 600 }}>christopher robin fiore</span>, with claude as
          design and engineering partner.
        </p>
        <p className="text-base mt-1" style={{ color: 'var(--ink-2)' }}>
          portfolio theme: looking to <NatureWord kind="nature">nature</NatureWord>{' '}for questions, then measuring the answers.
        </p>
      </div>
    </Section>
  )
}

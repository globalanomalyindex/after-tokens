'use client'

import type { ReactNode } from 'react'
import { Section } from '@/components/section'
import { DefinitionTerm } from '@/components/chrome/definition-term'
import { ProfileFigure } from '@/components/arrival/profile-figure'
import { codaPrompts } from '@/lib/coda/fixtures'
import { ARRIVAL } from '@/lib/traces/findings'
import { READ_MS } from '@/lib/arrival/profile'

const FIGURE = codaPrompts.find((p) => p.id === 'heist-plot')!
const pct = (x: number) => `${Math.round(x * 100)}%`

const PROPERTIES: { name: string; mechanism: ReactNode; measures: string; rule: string }[] = [
  {
    name: 'tension',
    mechanism: (
      <>
        the <DefinitionTerm term="zeigarnik effect" />: open loops hold attention; too many overwhelm it
      </>
    ),
    measures: 'how many phrases are partly settled at once, over the run',
    rule: 'hold one or two open loops at a time, never more than three',
  },
  {
    name: 'closure',
    mechanism: (
      <>
        <DefinitionTerm term="gestalt closure" />{' '}and the <DefinitionTerm term="aha effect" />: a whole completing is felt, and a sudden one is felt as insight
      </>
    ),
    measures: 'how often a step completes a phrase, and how many wholes complete on the way',
    rule: 'batch commits so a step tends to close a phrase; many small wholes before the whole',
  },
  {
    name: 'peak and end',
    mechanism: (
      <>
        the <DefinitionTerm term="peak-end rule" />: an experience is remembered by its most intense moment and its ending
      </>
    ),
    measures: 'where the salience-weighted intensity peaks, and how heavy the last stretch is',
    rule: 'put the peak where the gist lands, early; end on one quiet completion',
  },
  {
    name: 'fluency',
    mechanism: (
      <>
        <DefinitionTerm term="parafoveal preview" />{' '}and <DefinitionTerm term="processing fluency" />: the eye samples the next word early, and ease is felt as liking
      </>
    ),
    measures: `whether a reader at one fixation per ${READ_MS} ms would wait for the next word inside a phrase`,
    rule: 'nothing crisp before commit; crisp text never changes; inside a phrase, one crisp anchor, then reading order',
  },
]

export function SectionProfile() {
  const a = ARRIVAL.arrivals
  return (
    <Section id="profile" title="The arrival profile">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">an arrival has a shape</h2>
      <p className="standfirst max-w-3xl">
        an arrival is one number per word: the time it becomes legible. from that vector, the phrase structure, and
        each word&rsquo;s salience, four properties follow, each grounded in one mechanism from the psychology of reading
        and reward. together they are the arrival profile. any reveal can be scored on it, whether or not anyone
        designed it, which turns psychology-inspired into psychology-specified.
      </p>

      <dl className="mt-12 md:mt-16 grid gap-x-12 gap-y-10 md:grid-cols-2 rule pt-8">
        {PROPERTIES.map((p) => (
          <div key={p.name}>
            <dt className="text-2xl font-bold tracking-tight">{p.name}</dt>
            <dd className="mt-2 text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              {p.mechanism}
            </dd>
            <dd className="mt-3 readout leading-relaxed" style={{ color: 'var(--muted)' }}>
              measures · {p.measures}
            </dd>
            <dd className="mt-1 readout leading-relaxed" style={{ color: 'var(--cobalt)' }}>
              rule · {p.rule}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-16 md:mt-24">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight max-w-2xl">eight arrivals, one profile</h3>
        <p className="mt-4 mb-10 text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
          one answer, drawn eight ways as a lock map: words left to right, time top to bottom, a mark where each word
          becomes legible, the gist words darker, the dotted line where a typewriter would be. under each, the medians
          of its profile over the {ARRIVAL.stimuli.fixtures}{' '}fixtures. loops is the most phrases open at once; waits is
          the share of fixations a reader would spend waiting; order is the rank correlation between legibility and
          reading order at the phrase scale; end is the last stretch&rsquo;s intensity against the run&rsquo;s mean.
        </p>
        <ProfileFigure answer={FIGURE.response} prompt={FIGURE.prompt} />
        <p className="mt-10 text-base leading-relaxed max-w-[64ch]">
          the typewriter holds exactly one loop and never makes a reader wait, and it reads in order at every scale
          (τ +{a.typewriter.tau.toFixed(2)}). the fade holds none and lands everything at the end, {a.fade.endWeight.toFixed(1)}{' '}times
          the run&rsquo;s mean intensity in its last stretch. the scatter and the earlier growth modes open{' '}
          {a.scatter.tensionMax}{' '}or more loops at once and make a reader wait on {pct(a.scatter.previewCost)}{' '}to{' '}
          {pct(Math.max(a.mycelium.previewCost, a.mitosis.previewCost))}{' '}of fixations. the grammar holds{' '}
          {a.crystal.tensionMax}{' '}at most, makes no reader wait, arrives out of order at the phrase scale
          (τ +{a.crystal.tau.toFixed(2)}), closes a phrase on {pct(a.crystal.alignment)}{' '}of its steps against the
          typewriter&rsquo;s {pct(a.typewriter.alignment)}, peaks at {pct(a.crystal.peakAt)}{' '}of the run, and ends at{' '}
          {a.crystal.endWeight.toFixed(2)}{' '}of the mean. every number describes an arrival. none of them describes a
          reader; that is what the study in the evidence section is for.
        </p>
      </div>
    </Section>
  )
}

'use client'

import type { ReactNode } from 'react'
import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { NatureWord } from '@/components/chrome/nature-word'
import { DefinitionTerm } from '@/components/chrome/definition-term'
import { RevealComparison } from '@/components/diffusion/reveal-comparison'

// The three reasons a region-by-region, phi-spaced reveal reads as more legible
// than a generic linear blur -> unblur, from a comprehension standpoint. Reason
// 01 ties the cadence to a measured rhythm in nature (framed as a hypothesis,
// not a law); 02 and 03 carry the cognitive science as inline definition chips
// you can open.
const REASONS: { n: string; lead: string; body: ReactNode }[] = [
  {
    n: '01',
    lead: 'a cadence the eye already reads',
    body: (
      <>
        the rhythm is not arbitrary. it is the 1/φ spacing that lays out{' '}
        <NatureWord kind="nautilus">shells</NatureWord>, <NatureWord kind="sunflower">seed heads</NatureWord>, and the
        spiral of <NatureWord kind="leaves">leaves</NatureWord> up a stem. the bet is that growth the eye evolved
        alongside reads as ordered, not random, faster than a flat ramp does. that is a hypothesis you can test, not a
        law nature hands you.
      </>
    ),
  },
  {
    n: '02',
    lead: 'a process you can read, not a wait',
    body: (
      <>
        a linear blur gives the eye one job: wait, with no read on how far along the answer is. a region-by-region
        reveal exposes that progress directly, and the <DefinitionTerm term="zeigarnik effect" /> is why an open,
        resolving structure stays legible: you can see which parts are settled and which are still forming. the reveal
        reports state instead of hiding it.
      </>
    ),
  },
  {
    n: '03',
    lead: 'the brain fills the gaps',
    body: (
      <>
        the brain runs on <DefinitionTerm term="predictive coding" />, always guessing the next word. each one that
        lands collapses a <DefinitionTerm term="prediction error" />, and the <DefinitionTerm term="dopamine" /> system
        marks the resolution. the final gaps snapping shut is <DefinitionTerm term="gestalt closure" />, the moment the{' '}
        <DefinitionTerm term="peak-end rule" /> says we remember a sequence by. arrive all at once and there is no
        partial state to read, no sense of where the answer is firm yet.
      </>
    ),
  },
]

export function SectionThesis() {
  return (
    <Section id="thesis" n={3} act="II" title="Thesis" eyebrow={['Thesis', 'signal the shape']}>
      {/* the argument */}
      <div className="max-w-2xl mb-16 md:mb-24">
        <div
          className="text-xs uppercase tracking-[0.16em] mb-4"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          + The argument
        </div>
        <div
          className="panel-accent rounded-2xl p-8 md:p-12"
          style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
        >
          <DiffusionText
            mode="aurora"
            trigger="inView"
            className="text-2xl md:text-3xl font-bold tracking-tight leading-tight"
          >
            {`Animation should signal the shape of the answer. Diffusion gives the rendering moment back to the designer. Use it.`}
          </DiffusionText>
        </div>
      </div>

      {/* why it works: the region-by-region reveal vs a generic blur -> unblur */}
      <div
        className="text-xs uppercase tracking-[0.16em] mb-3"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
      >
        + Why not blur → unblur
      </div>
      <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-3 max-w-2xl">
        One reports its state, the other hides it
      </h3>
      <p className="text-base leading-relaxed max-w-2xl mb-8 md:mb-10">
        Both panels resolve the same line, on the same blur range, finishing at the same instant. The only difference is
        the cadence. Watch which one tells you how far along the answer is and which parts have settled.
      </p>

      <RevealComparison />

      {/* the mechanism: each term opens its own definition */}
      <div
        className="mt-10 md:mt-12 mb-4 text-[10px] uppercase tracking-[0.18em]"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
      >
        + the mechanism
      </div>

      <div className="grid md:grid-cols-3 gap-8 md:gap-10">
        {REASONS.map((r) => (
          <div key={r.n}>
            <div
              className="mb-3 text-[11px] tracking-[0.18em]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'color-mix(in oklab, var(--section-accent) 88%, var(--ink))',
              }}
            >
              {r.n} · {r.lead}
            </div>
            <p className="text-base leading-relaxed">{r.body}</p>
          </div>
        ))}
      </div>

      {/* the payoff: the loading screen, reframed around legibility */}
      <div className="mt-16 md:mt-24 max-w-3xl">
        <div
          className="text-xs uppercase tracking-[0.16em] mb-3"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          + The payoff
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-4 max-w-2xl">
          The loading screen becomes a read on the answer
        </h3>
        <p className="text-base leading-relaxed max-w-2xl mb-4">
          A spinner tells you nothing: the work is either done or it is not, and you look away until then. The seconds a
          model spends resolving are the one stretch where the interface could be telling you what is happening, and
          today we spend them apologizing. Animation should signal the shape of the answer. The reveal above is not
          filler; it is the system reporting its own state as it forms.
        </p>
        <p className="text-base leading-relaxed max-w-2xl">
          When the reply resolves region by region, the order and pace expose which parts are settled and which are
          still provisional, the way the structure of a <NatureWord kind="leaves">fern</NatureWord> or a{' '}
          <NatureWord kind="nautilus">shell</NatureWord> shows its growth as it forms. That is the collaboration
          payoff: the person reading builds a calibrated model of the system instead of mistaking partial output for a
          finished answer, and trusts the result as far as the reveal earns. The cadence is brandable, a signature a
          product can own the way it owns a typeface or a color. The most ignored surface in software becomes the most
          informative.
        </p>

        {/* the inversion: then -> now */}
        <div className="grid sm:grid-cols-2 gap-8 md:gap-10 mt-8 md:mt-10 max-w-2xl">
          <div
            className="pt-3"
            style={{ borderTop: '1px solid color-mix(in oklab, var(--ink) 18%, transparent)' }}
          >
            <div
              className="mb-2 text-[11px] tracking-[0.18em]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
            >
              before
            </div>
            <p className="text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
              a spinner, a progress bar, a percentage. no read on what the answer is or how sure of it the system is.
            </p>
          </div>
          <div
            className="pt-3"
            style={{ borderTop: '1px solid color-mix(in oklab, var(--section-accent) 55%, transparent)' }}
          >
            <div
              className="mb-2 text-[11px] tracking-[0.18em]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'color-mix(in oklab, var(--section-accent) 88%, var(--ink))',
              }}
            >
              now
            </div>
            <p className="text-base leading-relaxed">
              a read on how far along the answer is and which parts have settled, on a cadence a brand can call its own.
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}

'use client'

import type { ReactNode } from 'react'
import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { NatureWord } from '@/components/chrome/nature-word'
import { DefinitionTerm } from '@/components/chrome/definition-term'
import { GrammarStage } from '@/components/arrival/grammar-stage'
import { codaPrompts } from '@/lib/coda/fixtures'
import { DERIVED, TRACE_NUMBERS } from '@/lib/traces/findings'
import {
  CRYSTAL_PRE_ROLL_MS,
  CRYSTAL_STEP_MS_MAX,
  CRYSTAL_STEP_MS_MIN,
  CRYSTAL_SWING,
  CRYSTAL_TARGET_STEPS,
  CRYSTAL_TENSION_BUDGET,
} from '@/lib/diffusion/modes/crystal'
import { LEGIBLE_GAP_MS } from '@/lib/arrival/reading-order'
import { PHRASE_MAX_WORDS } from '@/lib/arrival/phrases'

const STAGE = codaPrompts.find((p) => p.id === 'brainstorm')!
const pct = (x: number) => `${Math.round(x * 100)}%`

type Tag = 'derived' | 'constraint' | 'tuned'
type Decision = { decision: string; tag: Tag; effect: ReactNode }
type Group = { property: string; decisions: Decision[] }

const GROUPS: Group[] = [
  {
    property: 'tension',
    decisions: [
      {
        decision: `at most ${CRYSTAL_TENSION_BUDGET} phrases are open at once`,
        tag: 'constraint',
        effect: (
          <>
            nucleation is rate-limited. the <DefinitionTerm term="zeigarnik effect" />{' '}says an open loop holds attention and that
            more than two or three compete; the earlier growth regime opened five or more. the budget is the grammar&rsquo;s
            constant, outside the voice.
          </>
        ),
      },
      {
        decision: 'the next phrase opens when one closes, by salience, spread across the answer',
        tag: 'derived',
        effect: (
          <>
            the recorded sampler grows from a few confident anchors ({pct(TRACE_NUMBERS.adjacentFrac.lowconfB128)}{' '}of consecutive
            commits land beside the last one). the grammar keeps that shape and chooses the anchor by <DefinitionTerm term="gist" />:
            a list marker, a line opening, a word that echoes the prompt, a proper noun, a number. the gist opens first wherever
            it sits; the connective tissue opens last.
          </>
        ),
      },
    ],
  },
  {
    property: 'closure',
    decisions: [
      {
        decision: 'every open front advances every step, and a phrase whose remainder fits the step takes all of it',
        tag: 'derived',
        effect: (
          <>
            grains meet. steps end on completions, so the run is a sequence of small wholes on the way to the whole
            (<DefinitionTerm term="gestalt closure" />), and no front ever moves slower than a reader reads.
          </>
        ),
      },
      {
        decision: 'a lock that joins two settled neighbors settles harder',
        tag: 'tuned',
        effect: (
          <>
            a word landing between two settled words closes a gap at the scale of a phrase. its settle gets a little extra,
            so the reveal rewards its own closures. set by eye.
          </>
        ),
      },
    ],
  },
  {
    property: 'peak and end',
    decisions: [
      {
        decision: 'the nucleus locks first and lands hardest',
        tag: 'derived',
        effect: (
          <>
            the phrase&rsquo;s most salient word turns crisp the step the phrase opens, ahead of the words before it, with the
            strongest settle and the longest halo. the peak of the run is where the meaning arrives (<DefinitionTerm term="peak-end rule" />).
          </>
        ),
      },
      {
        decision: 'the exhale: after the last lock the field quiets once',
        tag: 'constraint',
        effect: (
          <>
            slot markers fade, weights equalize, the answer reads finished. the earlier wave and pulse were flourishes at the moment
            the rule wants completion. the ending is calm, and it is the cleanest state on the page (<DefinitionTerm term="processing fluency" />).
          </>
        ),
      },
    ],
  },
  {
    property: 'fluency',
    decisions: [
      {
        decision: 'a pending word is an illegible blur in a slot of its final width, and crisp text never changes',
        tag: 'constraint',
        effect: (
          <>
            4.2 pixels of blur at body size erases letterforms and keeps word shape, so the slot says a word this long is coming
            and nothing more. the model&rsquo;s guess changed {TRACE_NUMBERS.flipsPerTokenLowconf.toFixed(1)}{' '}times per word before it
            committed; a legible draft would have shown most words wrong. the pending glyphs churn every 390 ms, the sampler&rsquo;s
            own measured {DERIVED.msPerFlipRecorded}{' '}ms.
          </>
        ),
      },
      {
        decision: `inside a phrase, reading order from the first word, ${LEGIBLE_GAP_MS} ms apart at least, the next words forming a step ahead`,
        tag: 'derived',
        effect: (
          <>
            growth follows the lattice. <DefinitionTerm term="parafoveal preview" />{' '}says the eye samples the next word early; a word
            that is still noise then costs a fixation, and a crisp word that never changes costs nothing. so every preview is
            valid: the reader model finds no waits, and the ghost of the next words is already there when the eye arrives.
          </>
        ),
      },
    ],
  },
]

const TAG_LABEL: Record<Tag, string> = {
  derived: 'derived from a measurement or a mechanism',
  constraint: 'forced by what the interface has to say',
  tuned: 'set by eye, labeled so',
}

export function SectionGrammar() {
  return (
    <Section id="grammar" title="The grammar">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">
        the answer <NatureWord kind="crystal">crystallizes</NatureWord>
      </h2>
      <p className="standfirst max-w-3xl">
        a supersaturated solution does not crystallize everywhere at once. a few sites nucleate, each crystal grows
        along its lattice, grains meet at their boundaries, and the finished crystal is ordered and still. each
        stage is one property of the profile: rate-limited nucleation is the tension budget, lattice growth is
        reading order inside a phrase, grains meeting are closures, and the still crystal is the fluent end. one
        grammar replaces four metaphors.
      </p>

      <Reveal className="mt-12 md:mt-16">
        <GrammarStage prompt={STAGE.prompt} answer={STAGE.response} />
      </Reveal>

      <div className="mt-16 md:mt-24">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight max-w-2xl">eight decisions, by property</h3>
        <p className="mt-4 text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
          each decision names what drives it: derived from a measurement or a mechanism, forced by what the interface has
          to say, or set by eye and labeled so. the cadence underneath them: a {CRYSTAL_PRE_ROLL_MS}{' '}ms pre-roll while the
          answer&rsquo;s extent appears, about {CRYSTAL_TARGET_STEPS}{' '}steps {CRYSTAL_STEP_MS_MIN}{' '}to {CRYSTAL_STEP_MS_MAX}{' '}ms
          apart inside the <DefinitionTerm term="doherty threshold" />, linear on average because the recorded cadence is
          linear, with a {pct(CRYSTAL_SWING)}{' '}long-short swing for <DefinitionTerm term="groove" />, and phrases of at most{' '}
          {PHRASE_MAX_WORDS}{' '}words cut at punctuation and line breaks.
        </p>
        <div className="mt-10 grid gap-12">
          {GROUPS.map((g, gi) => (
            <Reveal key={g.property} delay={gi * 60} className="grid gap-6 md:grid-cols-[10rem_1fr] rule pt-6">
              <h4 className="text-lg font-bold tracking-tight">{g.property}</h4>
              <dl className="grid gap-7">
                {g.decisions.map((d) => (
                  <div key={d.decision}>
                    <dt className="text-base font-semibold leading-snug">{d.decision}</dt>
                    <dd className="mt-1 readout" style={{ color: 'var(--muted)' }} title={TAG_LABEL[d.tag]}>
                      {d.tag}
                    </dd>
                    <dd className="mt-2 text-base leading-relaxed max-w-[62ch]" style={{ color: 'var(--ink-2)' }}>
                      {d.effect}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  )
}

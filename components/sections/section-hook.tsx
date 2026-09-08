'use client'

import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SettleStage } from '@/components/settle/settle-stage'
import { TRACE_NUMBERS } from '@/lib/traces/findings'

// The first screen: the title, the argument in one line, and beside it the
// thing itself: a real recording, replayed through the reducer. The field's
// end settles in from the right, the words land, the sentence settles onto
// the page. Nothing in the stage was authored.

export function SectionHook() {
  return (
    <Section id="hook" title="After tokens" className="pt-14 md:pt-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 items-center">
        <div>
          <h1 className="hero-title m-0">
            <span className="hero-word" style={{ animationDelay: '120ms' }}>after</span>{' '}
            <span className="hero-word" style={{ animationDelay: '380ms' }}>tokens</span>
          </h1>
          <p className="standfirst mt-8 max-w-[34ch]">wait for the water to clear.</p>
          <p className="mt-5 text-base leading-relaxed max-w-[52ch]" style={{ color: 'var(--ink-2)' }}>
            a product design and engineering case study on how an answer from a diffusion language model should
            reach a reader: only what the model has committed, on a page that holds still, with the process in
            view. built on {TRACE_NUMBERS.trajectories} recorded sampler runs and an audit of the version that came before it.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-6 max-w-md readout" style={{ color: 'var(--muted)' }}>
            <div>
              <dt className="label mb-1">role</dt>
              <dd style={{ color: 'var(--ink)' }}>product design, design engineering</dd>
            </div>
            <div>
              <dt className="label mb-1">year</dt>
              <dd style={{ color: 'var(--ink)' }}>2026</dd>
            </div>
            <div>
              <dt className="label mb-1">status</dt>
              <dd style={{ color: 'var(--ink)' }}>working prototype, reader benefits untested</dd>
            </div>
          </dl>
        </div>
        <Reveal delay={260} className="min-w-0">
          <SettleStage source="trace:heist-plot__lowconf-b128" autoplay="immediate" pace={{ scale: 4 }} compact />
        </Reveal>
      </div>
    </Section>
  )
}

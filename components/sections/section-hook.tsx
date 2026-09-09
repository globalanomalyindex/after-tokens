'use client'

import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SettleStage } from '@/components/settle/settle-stage'
import { TRACE_NUMBERS } from '@/lib/traces/findings'

// A real trajectory drives the first screen through the causal reducer.
// Local source updates may happen together; layout and motion are authored.
// Neither text nor availability is choreographed from the eventual answer.

export function SectionHook() {
  return (
    <Section id="hook" title="After tokens" className="pt-14 md:pt-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 items-center">
        <div>
          <h1 className="hero-title m-0">
            <span className="hero-word" style={{ animationDelay: '120ms' }}>after</span>{' '}
            <span className="hero-word" style={{ animationDelay: '380ms' }}>tokens</span>
          </h1>
          <p className="standfirst mt-8 max-w-[34ch]">a little movement. then, a whole thought.</p>
          <p className="mt-5 text-base leading-relaxed max-w-[52ch]" style={{ color: 'var(--ink-2)' }}>
            a motion and interaction study for generated text. a capsule divides into breathing rows; small rounded shapes form, make room and briefly glimmer;
            the field makes room from available source content; the complete answer arrives together and settles once. the cells do not predict its words.
            a working prototype, grounded in {TRACE_NUMBERS.trajectories} original sampler recordings, four new batched runs,
            and an explicit account of the extra wait. reader benefits remain to be tested.
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
              <dd style={{ color: 'var(--ink)' }}>concept, working prototype, untested on readers</dd>
            </div>
          </dl>
        </div>
        <Reveal delay={260} className="min-w-0">
          <SettleStage source="trace:weather__random-b32" autoplay="immediate" compact />
        </Reveal>
      </div>
    </Section>
  )
}

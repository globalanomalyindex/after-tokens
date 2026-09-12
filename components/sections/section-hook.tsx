'use client'

import { Section } from '@/components/section'
import { HeroIntro } from '@/components/settle/hero-intro'
import { TRACE_NUMBERS } from '@/lib/traces/findings'

// The opening is an explicitly authored motion introduction. Recorded
// sources and their measured availability appear in the case study below.
export function SectionHook() {
  return (
    <Section id="hook" title="After tokens" className="pt-10 md:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-5 mb-8 md:mb-10">
        <h1 className="m-0 text-[clamp(2.6rem,6vw,4.5rem)] font-bold leading-none tracking-tighter">after tokens</h1>
        <p className="readout" style={{ color: 'var(--muted)' }}>web &amp; motion design · 2026</p>
      </header>
      <HeroIntro />
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16 mt-10 md:mt-14">
        <p className="standfirst max-w-[32ch]">a little movement.<br />then, a whole thought.</p>
        <div>
          <p className="text-base leading-relaxed max-w-[52ch]" style={{ color: 'var(--ink-2)' }}>
            a web and motion design study for generated text. rounded shapes carry the wait, then become a readable answer through one shared material handover.
            the opening is choreographed; the experiments below use {TRACE_NUMBERS.trajectories} original sampler recordings and four new batched runs,
            with an explicit account of the extra wait. reader benefits remain to be tested.
          </p>
          <p className="readout mt-5" style={{ color: 'var(--muted)' }}>independent study · working prototype · untested on readers</p>
        </div>
      </div>
    </Section>
  )
}

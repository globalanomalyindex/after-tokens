'use client'

import { Section } from '@/components/section'
import { HeroIntro } from '@/components/settle/hero-intro'

// The opening is an explicitly authored motion introduction. Recorded
// sources and their measured availability appear in the case study below.
export function SectionHook() {
  return (
    <Section id="hook" title="After tokens" className="pt-10 md:pt-14 !pb-0">
      <header className="flex flex-wrap items-end justify-between gap-5 mb-8 md:mb-10">
        <h1 className="m-0 text-[clamp(2.6rem,6vw,4.5rem)] font-bold leading-none tracking-tighter">after tokens</h1>
        <p className="readout" style={{ color: 'var(--muted)' }}>web &amp; motion design · 2026</p>
      </header>
      <HeroIntro />
    </Section>
  )
}

import { BrandProvider } from '@/lib/brand/provider'
import { SectionNav } from '@/components/chrome/section-nav'
import { SiteFooter } from '@/components/chrome/site-footer'
import { ScrollProgress } from '@/components/chrome/scroll-progress'
import { SectionHook } from '@/components/sections/section-hook'
import { SectionProblem } from '@/components/sections/section-problem'
import { SectionProfile } from '@/components/sections/section-profile'
import { SectionSampler } from '@/components/sections/section-sampler'
import { SectionGrammar } from '@/components/sections/section-grammar'
import { SectionVoice } from '@/components/sections/section-voice'
import { SectionPreviews } from '@/components/sections/section-previews'
import { SectionPlayground } from '@/components/sections/section-playground'
import { SectionEvidence } from '@/components/sections/section-evidence'
import { SectionOpen } from '@/components/sections/section-open'

// The case study in reading order: the thing itself, the problem, a way to
// measure an arrival, what a real sampler does, the grammar, its voice, the
// evidence and the claims, and what is open.
export default function HomePage() {
  return (
    <BrandProvider brand="after-tokens" as="main" className="min-h-screen">
      <SectionHook />
      <SectionProblem />
      <SectionProfile />
      <SectionSampler />
      <SectionGrammar />
      <SectionVoice />
      <SectionPreviews />
      <SectionPlayground />
      <SectionEvidence />
      <SectionOpen />
      <SiteFooter />
      <SectionNav />
      <ScrollProgress />
    </BrandProvider>
  )
}

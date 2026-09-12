import { BrandProvider } from '@/lib/brand/provider'
import { SectionNav } from '@/components/chrome/section-nav'
import { SiteFooter } from '@/components/chrome/site-footer'
import { ScrollProgress } from '@/components/chrome/scroll-progress'
import { SectionHook } from '@/components/sections/section-hook'
import { SectionShowcase } from '@/components/sections/section-showcase'
import { SectionProblem } from '@/components/sections/section-problem'
import { SectionAudit } from '@/components/sections/section-audit'
import { SectionContract } from '@/components/sections/section-contract'
import { SectionField } from '@/components/sections/section-field'
import { SectionCost } from '@/components/sections/section-cost'
import { SectionVoice } from '@/components/sections/section-voice'
import { SectionPreviews } from '@/components/sections/section-previews'
import { SectionConcept } from '@/components/sections/section-concept'
import { SectionPlayground } from '@/components/sections/section-playground'
import { SectionEvidence } from '@/components/sections/section-evidence'
import { SectionOpen } from '@/components/sections/section-open'

// The case study in reading order: the opening, the live comparison, the wrong shape, the
// audit of the version before, the contract, the field, the cost, the voice,
// the surface in products, the wait as a product moment, the playground,
// what is known, and what is open.
export default function HomePage() {
  return (
    <BrandProvider brand="after-tokens" as="main" className="min-h-screen">
      <SectionHook />
      <SectionShowcase />
      <SectionProblem />
      <SectionAudit />
      <SectionContract />
      <SectionField />
      <SectionCost />
      <SectionVoice />
      <SectionPreviews />
      <SectionConcept />
      <SectionPlayground />
      <SectionEvidence />
      <SectionOpen />
      <SiteFooter />
      <SectionNav />
      <ScrollProgress />
    </BrandProvider>
  )
}

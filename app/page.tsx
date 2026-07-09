import { BrandProvider } from '@/lib/brand/provider'
import { SectionNav } from '@/components/chrome/section-nav'
import { SectionHook } from '@/components/sections/section-01-hook'
import { SectionPrimer } from '@/components/sections/section-02-primer'
import { SectionThesis } from '@/components/sections/section-04-thesis'
import { SectionMycelium } from '@/components/sections/section-05-mycelium'
import { SectionBrandVariations } from '@/components/sections/section-08-brand-variations'
import { SectionCoda } from '@/components/sections/section-09-coda'
import { SectionWidget } from '@/components/sections/section-10-widget'
import { SectionStyles } from '@/components/sections/section-11-styles'
import { SectionPlayground } from '@/components/sections/section-12-playground'
import { SectionClose } from '@/components/sections/section-13-close'

// Hiring-manager reading order: orient quickly, explain the mechanism, state
// the hypothesis, expose the system, show it in product contexts, then prove
// range before closing on evidence and limits.
export default function HomePage() {
  return (
    <BrandProvider brand="after-tokens" as="main" className="min-h-screen">
      <SectionHook />
      <SectionPrimer />
      <SectionThesis />
      <SectionMycelium />
      <SectionCoda />
      <SectionWidget />
      <SectionBrandVariations />
      <SectionStyles />
      <SectionPlayground />
      <SectionClose />
      <SectionNav />
    </BrandProvider>
  )
}

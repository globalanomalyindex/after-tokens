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

// 10-section, 5-act cut.
//   I   01 hook · 02 mechanism + what it breaks
//   II  03 thesis · 04 one engine, many naturals (mycelium hero + fog/aurora)
//   III 05 brand variations · 06 coda · 07 widget
//   IV  08 specimens · 09 playground
//   V   10 close
// 02 folds the old assumptions beat; 04 folds the old fog + aurora sections.
// section-03/06/07 files are intentionally left in the tree, unimported.
export default function HomePage() {
  return (
    <BrandProvider brand="after-tokens" as="main" className="min-h-screen">
      <SectionHook />
      <SectionPrimer />
      <SectionThesis />
      <SectionMycelium />
      <SectionBrandVariations />
      <SectionCoda />
      <SectionWidget />
      <SectionStyles />
      <SectionPlayground />
      <SectionClose />
      <SectionNav />
    </BrandProvider>
  )
}

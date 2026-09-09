import { Section } from '@/components/section'
import { AmbientStudy } from '@/components/settle/ambient-study'

const assetBase = process.env.GITHUB_PAGES === 'true' ? '/after-tokens' : ''

export function SectionField() {
  return (
    <Section id="field" title="A field, then an answer">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">a field, then an answer</h2>
      <p className="standfirst max-w-3xl">
        five solid gray bars hold the answer area. compare them still, breathing, and gently changing length. their rounded ends stay crisp; their height and position stay fixed. the bars do not count words or predict line lengths. at source finality, the complete answer appears together and the letters hold still.
      </p>
      <div className="mt-12 md:mt-16"><AmbientStudy /></div>
      <p className="readout mt-6 leading-relaxed max-w-4xl" style={{ color: 'var(--muted)' }}>
        eight chromium observations at half-speed source inspection each showed one exact answer arrival and no early text. 9,648 sampled positions of final words&rsquo; first characters stayed still after arrival. the narrow long answer still grew its frame once, by 99.4 px. the gallery default remains the observed clock; reader benefits and physical iphone behavior remain untested.{' '}
        <a className="underline underline-offset-4" href="https://github.com/globalanomalyindex/after-tokens/blob/main/docs/skeleton-motion-validation-2026-09-09.json">measurement and scope</a>
      </p>
      <p className="readout mt-4 leading-relaxed max-w-4xl" style={{ color: 'var(--muted)' }}>
        fresh verification · 268 unit/component tests across 40 files and 45 browser checks passed across chromium, webkit and iphone 14 emulation.{' '}
        <a className="underline underline-offset-4" href="https://github.com/globalanomalyindex/after-tokens/blob/main/docs/skeleton-release-verification-2026-09-09.md">build and release checks</a>. actual browser recordings at half-speed inspection:{' '}
        <a className="underline underline-offset-4" href={`${assetBase}/study/skeleton-answer-mobile.webm`}>list</a>{' · '}
        <a className="underline underline-offset-4" href={`${assetBase}/study/skeleton-answer-long.webm`}>long answer</a>.{' '}
        <a className="underline underline-offset-4" href="https://github.com/globalanomalyindex/after-tokens/blob/main/docs/skeleton-motion-study-2026-09-09.md">research and proposed reader study</a>
      </p>
      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] rule pt-8">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">borrow the familiarity.<br />reconsider the promise.</h3>
        <div className="text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
          <p>A website skeleton usually previews a structure that already exists. Generated text may not yet have a known length, list count or line break. These five bars occupy an app-owned waiting area; their widths are authored independently of the answer. The same composition precedes a short refusal or a long explanation.</p>
          <p className="mt-4">The reference is a familiar solid-row loader. Its original code uses a traveling shimmer; this experiment uses a uniform fill and a slower whole-field pulse. Pulsing and static skeletons already exist, so neither is claimed as an invention. <a className="underline underline-offset-4" href="https://www.cssscript.com/skeleton-loader-placeholder/">reference</a>; <a className="underline underline-offset-4" href="https://github.com/zalog/placeholder-loading">original implementation</a>; <a className="underline underline-offset-4" href="https://mui.com/material-ui/react-skeleton/">MUI skeleton variants</a>.</p>
        </div>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">what does changing the shape add?</h3>
        <div className="text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
          <p>Still holds the bars at a fixed opacity. Breathe adds a shared 4.8-second opacity cycle. Reshape uses that same pulse and brings each rounded end inward, then back out, while height and position remain fixed. The question is whether adding this contour movement makes waiting feel more fluid or more distracting. It changes visible area and total ink as well as shape, so this is not an isolated test of a psychological mechanism.</p>
          <p className="mt-4">Common-fate research motivates related changes within a group, but both moving conditions already share a rhythm. A small controlled skeleton study found no significant perceived-speed or navigation advantage over spinners. Neither finding proves this treatment helps a reader. <a className="underline underline-offset-4" href="https://arxiv.org/html/1908.00661">Chalbi et al., 2020</a>; <a className="underline underline-offset-4" href="https://doi.org/10.1145/3232078.3232086">Mejtoft et al., 2018</a>.</p>
          <p className="mt-4">All three conditions use the same source events, answer policy and final handover. At finality the bars disappear immediately, the text is fully readable, and one thin outline fades around it for 260 milliseconds. There is no blurred glow or letter animation. The brief response follows restrained motion practice; its duration is an authored parameter, not a psychological constant. <a className="underline underline-offset-4" href="https://carbondesignsystem.com/elements/motion/overview/">Carbon motion guidance</a>.</p>
        </div>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">format can arrive early.<br />a whole layout may not.</h3>
        <div className="text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
          <p>In the original recordings, 45 of 138 final newline characters commit before both neighboring words finish. In the new list capture, the pieces of “1.” commit at 649 ms; “Create” finishes at 3,270 ms. Those are real local events, classified retrospectively for this audit. They do not reveal the final list count, wrapping or independently finished items.</p>
          <p className="mt-4">An app-owned form or an enforced schema can guarantee containers earlier. A prompt asking for three items cannot guarantee compliance. The ambient composition works with either situation because it needs only request activity and actual finality. The same treatment could serve other unknown text-generation processes; its diffusion-specific contribution here is the verified event adapter, source experiments and measured cost of holding earlier text.</p>
          <p className="mt-4">Whole-answer presentation removes intermediate readable-text reflow by withholding that text. It cannot guarantee a small final height change: long answers still grow the container. The comparison above makes that transition visible, and the cost chapter accounts for the wait. Reader comfort, preference and comprehension remain open experiments.</p>
        </div>
      </div>
    </Section>
  )
}

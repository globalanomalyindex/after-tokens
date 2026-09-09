import { Section } from '@/components/section'
import { AmbientStudy } from '@/components/settle/ambient-study'

const assetBase = process.env.GITHUB_PAGES === 'true' ? '/after-tokens' : ''

export function SectionField() {
  return (
    <Section id="field" title="A field, then an answer">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">a field, then an answer</h2>
      <p className="standfirst max-w-3xl">
        familiar loading bars, loosened from the final layout. five soft forms share an unhurried rhythm inside
        the answer area. they drift and breathe without counting words or promising a line length. when the source
        finishes, the entire answer is there to read. the motion belongs to the wait; the letters hold still.
      </p>
      <div className="mt-12 md:mt-16"><AmbientStudy /></div>
      <p className="readout mt-6 leading-relaxed max-w-4xl" style={{ color: 'var(--muted)' }}>
        rendering audit · eight Chromium observations, at 390 and 1380 px viewport widths. one complete text update per replay;
        no pre-final text; 9,667 matched first-glyph samples with no movement after arrival. the longer explanation grows the
        answer area by 99.4 px once at finality. these are engineering observations, not reader-study results or physical iPhone measurements.{' '}
        <a className="underline underline-offset-4" href="https://github.com/globalanomalyindex/after-tokens/blob/main/docs/ambient-motion-validation-2026-09-09.json">measurement</a>{' · '}
        <a className="underline underline-offset-4" href={`${assetBase}/study/ambient-answer-mobile.webm`}>mobile recording</a>{' · '}
        <a className="underline underline-offset-4" href={`${assetBase}/study/ambient-answer-long.webm`}>long-answer recording</a>
      </p>
      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] rule pt-8">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">borrow the familiarity.<br />reconsider the promise.</h3>
        <div className="text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
          <p>A website skeleton usually previews a structure that already exists. An unconstrained generated answer may not yet have a known length, list count or line break. Here, the bars describe an app-owned waiting area. Their geometry is authored independently of the text, and remains the same for a short refusal or a long explanation.</p>
          <p className="mt-4">That is an adaptation of a familiar pattern, not a proven speed benefit. A controlled skeleton-versus-spinner study with 14 people found no significant difference in perceived speed or navigation. Fluent&rsquo;s guidance favors high-level structure for variable content. Neither establishes that these bars will improve diffusion reading. <a className="underline underline-offset-4" href="https://doi.org/10.1145/3232078.3232086">Mejtoft et al., 2018</a>; <a className="underline underline-offset-4" href="https://fluent2.microsoft.design/components/web/react/core/skeleton/usage">Fluent 2</a>.</p>
        </div>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">coherence is the question</h3>
        <div className="text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
          <p>Research on common fate shows that coordinated changes can group visual elements. It motivates the shared rhythm above; it does not prove that readers find it calmer. The three conditions use identical initial forms, text, source clock and final handover. The independent condition changes the bars&rsquo; periods, so their phases diverge. Motion ranges match; time-averaged area and luminance are not guaranteed to match over every short recording. <a className="underline underline-offset-4" href="https://arxiv.org/html/1908.00661">Chalbi et al., 2020</a>.</p>
          <p className="mt-4">The construction follows motion practice: continuous position, gentle changes in direction, a persistent phase, immediate interruption and a static reduced-motion alternative. One shared 5.4-second cycle carries much smaller local movement. At completion, a 260-millisecond decorative response yields to text already at full contrast. These durations are design parameters to evaluate, not psychological constants. <a className="underline underline-offset-4" href="https://developer.apple.com/videos/play/wwdc2018/803/">Apple, Designing Fluid Interfaces</a>; <a className="underline underline-offset-4" href="https://fluent2.microsoft.design/motion">Fluent motion</a>.</p>
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

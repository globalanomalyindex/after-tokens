import { Section } from '@/components/section'
import { Highlight } from '@/components/chrome/highlight'
import { NatureWord } from '@/components/chrome/nature-word'
import { DefinitionTerm } from '@/components/chrome/definition-term'

export function SectionClose() {
  return (
    <Section id="close" n={11} act="V" title="Evidence and limits" eyebrow={['Evidence', 'What is true now']}>
      <div className="max-w-4xl">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter lowercase leading-tight mb-6">
          <span className="title-index">xi.</span>what shipped, what remains unproven
        </h2>
        <p className="text-lg leading-relaxed max-w-2xl mb-12" style={{ color: 'var(--ink-2)' }}>
          The prototype is evidence that the system can be designed and engineered. It is not evidence that the central
          comprehension hypothesis is true. That distinction is part of the product work.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mb-16">
          <div className="rounded-2xl p-7 md:p-8" style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}>
            <p className="text-[10px] uppercase tracking-[0.18em] mb-5" style={{ fontFamily: 'var(--font-mono)', color: 'color-mix(in oklab, var(--stage-text) 60%, transparent)' }}>
              + evidence in the build
            </p>
            <ul className="space-y-3 text-sm leading-relaxed">
              <li>
                Sixty recorded denoising trajectories from a real masked diffusion model (0.6B parameters, greedy,
                three sampler configurations) drive the sampler mode and are released with the source.
              </li>
              <li>
                One typed engine drives four authored reveal strategies, one of them (mycelium) with its lock order
                fitted to the recorded commit statistics, and one recorded one.
              </li>
              <li>Geometry, timing, glyph style, and brand tokens are separable.</li>
              <li>Replays are deterministic; fixture mappings are disclosed.</li>
              <li>Reduced motion resolves immediately and retains a visible state label.</li>
              <li>Unit, type, build, browser, and accessibility checks gate deployment.</li>
            </ul>
          </div>
          <div className="rounded-2xl border p-7 md:p-8" style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)' }}>
            <p className="text-[10px] uppercase tracking-[0.18em] mb-5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              + not evidence yet
            </p>
            <ul className="space-y-3 text-sm leading-relaxed">
              <li>
                Only one mode is driven by a sampler, and that sampler is a 0.6-billion-parameter research model run
                greedily on a laptop. Larger models and other samplers may order differently.
              </li>
              <li>No user study has shown a comprehension or state-identification gain.</li>
              <li>No production classifier chooses a mode; fixtures are tagged by hand.</li>
              <li>The glyph system is tuned for English and Latin-script content.</li>
              <li>This is a prototype primitive, not a packaged component library.</li>
              <li>
                Reading order is a real cost. This is the strongest argument against the whole approach. While you read
                one word your eye is already sampling the next one over; <DefinitionTerm term="parafoveal preview" /> is
                measurable, and text that changes out of order inside that zone should cost a reader time. An honest
                study has to measure reading time, not only state identification. If revealing out of order slows
                reading more than it clarifies state, the right answer is to reveal in reading order and carry the
                state signal some other way, through weight or color rather than position.
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            + the next test
          </p>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase mb-6">make the hypothesis earn its place</h3>
          <dl className="grid sm:grid-cols-2 gap-px rounded-2xl overflow-hidden border" style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)', background: 'color-mix(in oklab, var(--ink) 12%, transparent)' }}>
            {[
              ['hypothesis', 'A region-based reveal improves identification of what is still changing versus a matched linear blur.'],
              ['method', 'Interrupt both conditions at matched timestamps; randomize order; use identical text, geometry, and duration. The recorded trajectories can now serve as the stimulus, so the study measures real sampler order rather than an authored one.'],
              ['measure', 'State-identification accuracy, final-text comprehension, time to answer, distraction, and preference.'],
              ['falsified if', 'There is no accuracy benefit, comprehension drops, or participants read authored order as model certainty.'],
            ].map(([label, value]) => (
              <div key={label} className="p-6" style={{ background: 'var(--surface)' }}>
                <dt className="text-[10px] uppercase tracking-[0.16em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>+ {label}</dt>
                <dd className="text-sm leading-relaxed">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mb-16 max-w-2xl">
          <p className="text-[10px] lowercase tracking-[0.16em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            + decisions and cuts
          </p>
          <p className="text-base leading-relaxed mb-5" style={{ color: 'var(--ink-2)' }}>
            The shipped thing is the survivor. Three earlier directions did not earn their complexity:
          </p>
          <ul className="space-y-4 text-base leading-relaxed">
            <li>
              <Highlight><strong>Particle flock.</strong> Rebuilt as a chain reaction, liquid-glass orbs, and fireflies. Faster motion reduced legibility; Mycelium did the job with less visual traffic.</Highlight>
            </li>
            <li>
              <Highlight><strong>The entrance.</strong> The opening was a full cinematic entrance: giant words resolving out of noise, one beat at a time, ending on &ldquo;until now&rdquo; before fog handed off to the site. It shipped, it broke on a slow connection, it was rebuilt, and then it was cut. It performed the thesis beautifully and it cost a reviewer six seconds before the first sentence of the argument. The hero already resolves out of order. Making the same point twice is not craft, it is a toll.</Highlight>
            </li>
            <li>
              <Highlight><strong>Abstract line graphs.</strong> Replaced with actual word locks so the comparison demonstrates the interaction instead of describing it from a distance.</Highlight>
            </li>
          </ul>
        </div>

        <div className="border-t pt-8 max-w-2xl" style={{ borderColor: 'color-mix(in oklab, var(--ink) 15%, transparent)' }}>
          <p className="text-[10px] lowercase tracking-[0.16em] mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            + credit
          </p>
          <p className="text-base lowercase">
            product design and engineering by{' '}
            <span aria-label="christopher robin fiore" style={{ fontWeight: 500 }}>
              {'christopher robin fiore'.split('').map((ch, i, all) => ch === ' ' ? ' ' : (
                <span key={i} style={{ color: `oklch(0.55 0.19 ${Math.round((i / (all.length - 1)) * 320)})` }}>{ch}</span>
              ))}
            </span>
          </p>
          <p className="text-base lowercase mt-1">
            portfolio theme: looking to <NatureWord kind="nature">nature</NatureWord> for questions, then testing the answers
          </p>
        </div>
      </div>
    </Section>
  )
}

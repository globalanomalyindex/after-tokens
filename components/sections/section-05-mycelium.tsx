'use client'

import { Section } from '@/components/section'
import { ModeDemo } from './mode-demo'
import { Highlight } from '@/components/chrome/highlight'
import { GoldenCurve } from '@/components/diffusion/golden-curve'
import { NatureWord } from '@/components/chrome/nature-word'
import { DefinitionTerm } from '@/components/chrome/definition-term'
import { TRACE_NUMBERS, DERIVED } from '@/lib/traces/findings'

const pct = (x: number) => `${Math.round(x * 100)}%`

export function SectionMycelium() {
  return (
    <Section id="mycelium" n={5} act="II" title="Four authored modes, one recorded" eyebrow={['System', 'Four visual hypotheses']}>
      <ModeDemo
        mode="mycelium"
        stageSide="right"
        index="v."
        headline={
          <>
            <NatureWord kind="mycelium">Mycelium</NatureWord>, a response-seeded lock order
          </>
        }
        intro={
          <>
            Mycelium turns each answer into a stable, scattered lock sequence. A growth process fitted to the
            recorded sampler sets the order: about {pct(TRACE_NUMBERS.adjacentFrac.lowconfB32)} of commits land next
            to the previous one and a new anchor opens roughly every {Math.round(100 / TRACE_NUMBERS.seedsPer100Default)} commits,
            the statistics of a real low-confidence sampler inside a block. The seed is the response text, so every
            replay is comparable. A soft halo marks each authored lock before the answer settles uniformly. I kept it
            after cutting a particle-flock direction that made the same point with more motion and less legibility.
          </>
        }
        prompt="How does masked diffusion text generation work?"
        answer={`Masked diffusion language models refine many masked positions across repeated denoising steps instead of emitting only the next token. This interface is an authored simulation of that non-sequential process; it is not connected to live model state.`}
        specs={[
          { label: 'Signal source', value: 'Growth order fitted to 20 recorded trajectories' },
          { label: 'Use-case hypothesis', value: 'General responses' },
          { label: 'Evidence', value: 'Order statistics matched; comprehension untested' },
        ]}
      />

      <p className="max-w-2xl mt-10 md:mt-14 text-base leading-relaxed">
        <Highlight>
          A locked word gets heavier than its neighbors, not brighter. The{' '}
          <DefinitionTerm term="von restorff effect" /> is the reason difference registers at all: the item that
          stands apart from its neighbors is the one that gets read. Which difference you pick, weight or color
          or scale, is a brand decision. That there has to be one is not.
        </Highlight>
      </p>

      <div className="max-w-5xl mt-16 md:mt-24">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + Timing decision
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-8 max-w-2xl">
          phi is a tuning choice, not proof
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] gap-8 lg:gap-12 items-center">
          <GoldenCurve />
          <div className="space-y-5">
            <p className="text-base leading-relaxed">
              <Highlight>
                Branching systems, <NatureWord kind="fog">fog</NatureWord>, <NatureWord kind="aurora">aurora</NatureWord>,
                and cell division gave me a motion vocabulary. They are references, not cognitive evidence. Product
                research, not resemblance to nature, has to determine whether any treatment improves comprehension.
              </Highlight>
            </p>
            <p className="text-base leading-relaxed">
              <Highlight>
                The recorded word cadence is linear: the median lock fraction by word rank stays within about{' '}
                {pct(DERIVED.cadenceMaxDeviation)} of a straight line, because the schedule commits a fixed number of
                tokens per step. Phi decay is an authored acceleration; no sampler recorded here produces it. The
                chart above now shows both curves. Phi stays as a labeled stylization because the comparison in the
                closing hypothesis section needs a cadence that differs from linear at equal duration.
              </Highlight>
            </p>
            <p className="text-base leading-relaxed">
              <Highlight>
                The churn rate is a separate decision. The authored 440 ms cycle between pending glyphs was set by
                eye. The sampler&apos;s provisional guess changes every {DERIVED.msPerFlipRecorded} ms at recorded pace,
                within about 14 percent of that value, so it stays.
              </Highlight>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-20 md:mt-28">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + Same contract, three more registers
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-4 max-w-2xl">
          presentation changes; state semantics do not
        </h3>
        <p className="text-base leading-relaxed max-w-2xl mb-12">
          Each mode exposes the same ready → resolving → resolved contract. The suggested use cases are design hypotheses,
          and the mappings in this case study are fixtures a visitor can override.
        </p>
        <div className="space-y-16 md:space-y-20">
          <ModeDemo
            mode="fog"
            stageSide="left"
            compact
            index="v.a"
            headline={<><NatureWord kind="fog">Fog</NatureWord>, a soft spatial boundary</>}
            intro="A diagonal boundary clears measured word cells. I tuned it as a quieter register for open-ended responses, but the current build does not infer openness from the prompt."
            prompt="Write a tiny poem about a heron at dawn."
            answer={`A heron at dawn. Standing motionless in shallow water. The whole world holding its breath until it strikes.`}
            specs={[
              { label: 'Signal source', value: 'Measured word geometry' },
              { label: 'Use-case hypothesis', value: 'Open-ended responses' },
            ]}
          />
          <ModeDemo
            mode="aurora"
            stageSide="right"
            compact
            index="v.b"
            headline={<><NatureWord kind="aurora">Aurora</NatureWord>, line-level consolidation</>}
            intro="Luminous bands traverse real line groups and resolve the words beneath them. The row structure makes this the most explicit candidate for summaries and recaps."
            prompt="Summarize the design decision."
            answer={`The interface should show answer state only when it has a trustworthy signal. Until then, motion remains a clearly labeled prototype.`}
            specs={[
              { label: 'Signal source', value: 'Measured line groups' },
              { label: 'Use-case hypothesis', value: 'Summaries and recaps' },
            ]}
          />
          <ModeDemo
            mode="mitosis"
            stageSide="left"
            compact
            index="v.c"
            headline="Mitosis, structure dividing into parts"
            intro="One field divides toward measured word positions before a steady lock sequence begins. It extends the system beyond atmospheric metaphors and tests whether a more technical register still preserves the same state contract."
            prompt="Give me four names for an electric blue."
            answer={`Signal Blue. Cobalt Static. Live Wire. Midnight Current.`}
            specs={[
              { label: 'Signal source', value: 'Response hash + geometry' },
              { label: 'Use-case hypothesis', value: 'Lists and ideation' },
            ]}
          />
        </div>
      </div>
    </Section>
  )
}

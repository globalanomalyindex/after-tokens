'use client'

import { Section } from '@/components/section'
import { ModeDemo } from './mode-demo'
import { GoldenCurve } from '@/components/diffusion/golden-curve'
import { NatureWord } from '@/components/chrome/nature-word'
import { DefinitionTerm } from '@/components/chrome/definition-term'
import { TRACE_NUMBERS, DERIVED } from '@/lib/traces/findings'

const pct = (x: number) => `${Math.round(x * 100)}%`

export function SectionMycelium() {
  return (
    <Section id="mycelium" n={5} act="II" title="The shipped reveal" eyebrow={['System', 'The reveal, demonstrated']}>
      <ModeDemo
        mode="mycelium"
        stageSide="right"
        index="v."
        headline={
          <>
            <NatureWord kind="mycelium">Mycelium</NatureWord>, the shipped reveal
          </>
        }
        intro={
          <>
            Mycelium resolves each answer from several places at once. The first step seeds the whole span;
            every step after it commits a handful of words, each one growing a live cluster outward with the jump
            distribution of the recorded schedule-free sampler (about {pct(TRACE_NUMBERS.adjacentFrac.lowconfB128)} land
            next to a committed word) or opening a new seed in the largest gap left. The block schedule that makes
            the default sampler read left to right is a product decision the reveal does not inherit. The seed is
            the response text, so every replay is comparable. Each lock snaps crisp and heavy with a halo that is
            gone within a second; the field moves as a whole once, at the last lock. Every one of those choices is
            a row in the ledger above.
          </>
        }
        prompt="How does masked diffusion text generation work?"
        answer={`Masked diffusion language models refine many masked positions across repeated denoising steps instead of emitting only the next token. This interface is an authored simulation of that non-sequential process; it is not connected to live model state.`}
        specs={[
          { label: 'Signal source', value: 'Parallel growth, schedule-free sampler statistics' },
          { label: 'Cadence', value: 'About 20 steps, 140 to 260 ms apart, several words per step' },
          { label: 'Use-case hypothesis', value: 'General responses' },
          { label: 'Evidence', value: 'Order statistics matched; comprehension untested' },
        ]}
      />

      <p className="max-w-2xl mt-10 md:mt-14 text-base leading-relaxed">
        A locked word gets heavier than its neighbors as it locks. The{' '}
          <DefinitionTerm term="von restorff effect" /> is the reason that difference registers at all: the item that
        stands apart from its neighbors is the one that gets read. Weight is the channel the shipped mode uses;
        color or scale could carry the same signal in another register. Which channel carries it is a brand
        decision. That there has to be one is a constraint the effect sets.
      </p>

      <div className="max-w-5xl mt-16 md:mt-24">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + The cadence
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-8 max-w-2xl">
          the cadence the data chose
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] gap-8 lg:gap-12 items-center">
          <GoldenCurve />
          <div className="space-y-5">
            <p className="text-base leading-relaxed">
              Branching systems, <NatureWord kind="fog">fog</NatureWord>, <NatureWord kind="aurora">aurora</NatureWord>,
              and cell division gave me a motion vocabulary for the earlier authored modes. Product research has to
              determine whether any treatment improves comprehension; resemblance to nature only supplies the
              starting shapes.
            </p>
            <p className="text-base leading-relaxed">
              The shipped cadence is linear on average and batched in steps. An answer takes about twenty steps,
              140 to 260 milliseconds apart after a 320 millisecond pre-roll, and each step commits several words
              at once across a short spread, the way a fast decoder commits several positions per denoising step. The recorded
              sampler&apos;s own word cadence is linear too: the median lock fraction by word rank stays within about{' '}
              {pct(DERIVED.cadenceMaxDeviation)} of a straight line, because the schedule commits a fixed number of
              tokens per step regardless of confidence. The <DefinitionTerm term="doherty threshold" /> sets the
              other bound, so no gap between visible changes runs long enough for attention to drift. Phi decay was
              the reveal&apos;s first cadence. It now lives on as the comparison stimulus in the hypothesis section
              and as the golden curve above, drawn beside the recorded median it was meant to anticipate.
            </p>
            <p className="text-base leading-relaxed">
              The churn rate is a separate decision. The pending glyphs now change every 390 milliseconds, the
              sampler&apos;s own measured rate: its provisional guess for a pending token changed every{' '}
              {DERIVED.msPerFlipRecorded} milliseconds at recorded pace, and 390 rounds that number instead of
              approximating it.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-20 md:mt-28">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + Same contract, three more registers
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-4 max-w-2xl">
          one state contract, three more registers
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

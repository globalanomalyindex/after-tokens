'use client'

import { Section } from '@/components/section'
import { ModeDemo } from './mode-demo'
import { Highlight } from '@/components/chrome/highlight'
import { GoldenCurve } from '@/components/diffusion/golden-curve'
import { NatureWord } from '@/components/chrome/nature-word'

// One choreography engine, expressed three nature-derived ways. Mycelium is the
// hero treatment: it shows the default reading of an answer's shape and state.
// Fog and Aurora fold in beneath as compact variations, proving the same engine
// signals different kinds of answer (discovered vs. settled) without changing
// its mechanism.
export function SectionMycelium() {
  return (
    <Section
      id="mycelium"
      n={4}
      act="II"
      title="one engine, many naturals"
      eyebrow={['Modes', 'One engine']}
    >
      <ModeDemo
        mode="mycelium"
        stageSide="right"
        index="iv."
        headline={
          <>
            <NatureWord kind="mycelium">Mycelium</NatureWord>, the shape of an answer arriving
          </>
        }
        intro={
          <>
            words lock one by one in an order seeded by the response itself. each locked word is
            heavier than the rest, with a soft halo behind it, until the whole answer settles
            uniformly. you can read how far along the answer is and which parts the model is sure of,
            the way{' '}
            <NatureWord kind="pinecone">pine cones</NatureWord> and{' '}
            <NatureWord kind="nautilus">nautilus shells</NatureWord> already trained the eye to read
            growth. it earned the slot: a particle-flock mode tried three shapes for the same job
            and was cut for clarity.
          </>
        }
        prompt="How does diffusion text generation actually work?"
        answer={`Diffusion models denoise all tokens in parallel, refining over passes. Each pass increases confidence. The final output is the model's best estimate of the whole answer, not its best guess of the next word.`}
        specs={[
          { label: 'Reads as', value: 'Everyday answers' },
          { label: 'Rhythm', value: 'Golden-ratio lock' },
        ]}
      />

      {/* Golden-ratio motion: the lock timing made legible. The φ-decay easing
          curve is the engine's heartbeat; every variation rides it. */}
      <div className="max-w-5xl mt-16 md:mt-24">
        <div
          className="text-[10px] uppercase tracking-[0.18em] mb-3"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          + Golden-ratio motion
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-8 max-w-2xl">
          the rhythm the eye already knows
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] gap-8 lg:gap-12 items-center">
          <GoldenCurve />
          <div className="space-y-5">
            <p className="text-base leading-relaxed">
              <Highlight>
                the same ratio lays out the seed spiral of a{' '}
                <NatureWord kind="sunflower">sunflower</NatureWord>, the chambers of a{' '}
                <NatureWord kind="nautilus">nautilus</NatureWord>, the scales of a{' '}
                <NatureWord kind="pinecone">pine cone</NatureWord>, and the{' '}
                <NatureWord kind="leaves">leaves</NatureWord> climbing a stem.{' '}
                <NatureWord kind="nature">nature</NatureWord> keeps returning to φ because it packs the
                most growth into the least overlap, and the eye has spent a very long time learning to
                read it.
              </Highlight>
            </p>
            <p className="text-base leading-relaxed">
              <Highlight>
                so the words do not lock on a metronome. the interval between each lock shrinks by 1/φ,
                the same golden decay: deliberate at first, then a sudden flood as the answer arrives.
                it reads as something resolving on its own schedule, which is exactly what is happening
                under the surface.
              </Highlight>
            </p>
          </div>
        </div>
      </div>

      {/* Same engine, two more naturals. Compact panels: one discovered answer,
          one settled answer. The point is range, not three separate sections. */}
      <div className="mt-20 md:mt-28">
        <div
          className="text-[10px] uppercase tracking-[0.18em] mb-3"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          + Same engine, two more naturals
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-10 max-w-2xl">
          one choreography, tuned to the kind of answer
        </h3>
        <div className="space-y-16 md:space-y-20">
          <ModeDemo
            mode="fog"
            stageSide="left"
            compact
            index="iv.a"
            headline={
              <>
                <NatureWord kind="fog">Fog</NatureWord>, for an answer being discovered
              </>
            }
            intro="text sits at zero opacity behind a soft fog from frame one. a dissipation boundary sweeps diagonally and words come into focus as it clears their cell. slower on purpose, so a reader feels the answer being found rather than recalled."
            prompt="Write a tiny poem about a heron at dawn."
            answer={`A heron at dawn. Standing motionless in shallow water. The whole world holding its breath until it strikes.`}
            specs={[
              { label: 'Reads as', value: 'Discovered, open-ended' },
              { label: 'Motion', value: 'Diagonal dissipation' },
            ]}
          />
          <ModeDemo
            mode="aurora"
            stageSide="right"
            compact
            index="iv.b"
            headline={
              <>
                <NatureWord kind="aurora">Aurora</NatureWord>, for a settled answer
              </>
            }
            intro={
              <>
                luminous bands sweep across the lines, activating a row of resolved tokens at a time.
                it reads as &ldquo;this is the final shape,&rdquo; so a reader knows the answer is done
                consolidating. best for summaries, recaps, and distillations.
              </>
            }
            prompt="Sum up the last three years of model research."
            answer={`Three years of model research, summarized. Parallelism beat depth. Diffusion caught up to autoregressive. The bottleneck moved from training data to the interface.`}
            specs={[
              { label: 'Reads as', value: 'Settled, distilled' },
              { label: 'Motion', value: 'Luminous bands' },
            ]}
          />
        </div>
      </div>
    </Section>
  )
}

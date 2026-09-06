import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { Playground } from '@/components/playground/playground'

export function SectionPlayground() {
  return (
    <Section id="playground" title="Playground">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">try it</h2>
      <p className="standfirst max-w-3xl">
        every axis the piece demonstrated, freed to combine. pick an arrival, set the tension budget, swap the glyph
        vocabulary, stretch the reveal, color the answer. the profile beside the stage reads the words as they settle,
        so a scatter and the grammar can be told apart by their numbers as well as by eye.
      </p>
      <p className="mt-4 text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
        color is the one axis left out of the replay on purpose: recoloring a settled answer changes nothing about its
        meaning, so it shifts live. arrival, budget, glyphs, and timing carry meaning, so changing them runs a fresh
        read. every axis is presentation; none is labeled as model confidence or effort.
      </p>
      <Reveal className="mt-12 md:mt-16">
        <Playground />
      </Reveal>
    </Section>
  )
}

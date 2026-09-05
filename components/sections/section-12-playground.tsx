import { Section } from '@/components/section'
import { Highlight } from '@/components/chrome/highlight'
import { Playground } from '@/components/playground/playground'

export function SectionPlayground() {
  return (
    <Section
      id="playground"
      n={10}
      act="IV"
      title="Playground"
      eyebrow={['Playground', 'Drive it yourself']}
    >
      {/* The finale title paints itself across the wheel: one solid hue per
          letter, readable on the bone surface. */}
      <h2
        aria-label="x. playground"
        className="text-4xl md:text-6xl font-bold tracking-tighter lowercase leading-[1.02] mb-6 max-w-3xl"
      >
        <span className="title-index">x.</span>
        {'playground'.split('').map((ch, i, all) => (
          <span
            key={i}
            style={{ color: `oklch(0.6 0.18 ${Math.round((i / (all.length - 1)) * 320)})` }}
          >
            {ch}
          </span>
        ))}
      </h2>
      <p className="text-base leading-relaxed max-w-prose mb-4">
        The coda let the system read you. Here you drive every axis yourself. Set the motion, the
        glyph vocabulary, reveal duration, and color. Every axis is presentation-only in this
        build; none is labeled as model confidence or inference effort. One contract underneath,
        wearing whatever you put on it.
      </p>
      <p className="text-base leading-relaxed max-w-prose mb-12 md:mb-14">
        <Highlight>
          Color is the one axis left out of the replay key on purpose: recoloring a settled answer
          changes nothing about its meaning, so it shifts live without re-running. Motion, glyphs,
          and timing do carry meaning, so changing them runs a fresh read.
        </Highlight>
      </p>

      <Playground />
    </Section>
  )
}

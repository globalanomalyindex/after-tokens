'use client'

import { Section } from '@/components/section'
import { NatureWord } from '@/components/chrome/nature-word'
import { Highlight } from '@/components/chrome/highlight'
import { GeminiSpecimen } from '@/components/diffusion/specimens/gemini-specimen'
import { MinimalSpecimen } from '@/components/diffusion/specimens/minimal-specimen'
import { AsciiSpecimen } from '@/components/diffusion/specimens/ascii-specimen'
import { BrutalistSpecimen } from '@/components/diffusion/specimens/brutalist-specimen'
import { RichContentDemo } from '@/components/diffusion/specimens/rich-content-demo'

const SPECIMENS = [
  {
    name: 'Spectra',
    kind: 'Consumer',
    Comp: GeminiSpecimen,
    caption:
      'A playful consumer brand. A multicolor wash sweeps each word, then settles into something clean and friendly.',
  },
  {
    name: 'Quiet',
    kind: 'Minimal',
    Comp: MinimalSpecimen,
    caption: 'A minimalist assistant. The motion stays calm and nearly silent. Restraint is the brand.',
  },
  {
    name: 'Console',
    kind: 'Developer',
    Comp: AsciiSpecimen,
    caption:
      'A developer tool. The answer materializes out of a field of blocks, as if decoding from latent space.',
  },
  {
    name: 'Registry',
    kind: 'Brutalist',
    Comp: BrutalistSpecimen,
    caption:
      'A design studio. The layout is solved live: registration marks fly in and align into the answer’s structure.',
  },
]

export function SectionStyles() {
  return (
    <Section
      id="styles"
      n={8}
      act="IV"
      title="Infinite styles"
      eyebrow={['Designed', 'Not decorated']}
    >
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter lowercase leading-[1.02] mb-6 max-w-4xl">
        <span className="title-index">viii.</span>Nothing in <NatureWord kind="nature">nature</NatureWord> is decorative
      </h2>
      <p className="text-base leading-relaxed max-w-prose mb-12 md:mb-16">
        Every pattern that survives in nature survives because it earns its energy. This rendering
        language is built on the same rule, which is what lets it wear any brand and still feel
        intentional.
      </p>

      {/* The thesis. */}
      <div className="max-w-3xl mb-16 md:mb-24">
        <div
          className="text-[10px] uppercase tracking-[0.18em] mb-5"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          + The thesis
        </div>
        <div className="space-y-5 text-lg md:text-xl leading-relaxed">
          <p>
            Nature operates under the highest stakes: survival. A pattern does not persist unless it
            is hyper-efficient with energy and resources.
          </p>
          <p>
            Form follows function so closely that the shape{' '}
            <Highlight>tells you what the thing does</Highlight>. A reveal can work the same way: its
            shape can tell you <Highlight>what state the answer is in</Highlight>, what has settled and
            what is still resolving.
          </p>
          <p>
            Apply that constraint to a screen, and motion stops being ornament. Every frame{' '}
            <em className="not-italic font-bold">carries information you can read</em>.
          </p>
        </div>
      </div>

      {/* Proof: one contract, any brand. */}
      <div
        className="text-[10px] uppercase tracking-[0.18em] mb-2"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
      >
        + One contract, four registers
      </div>
      <p className="text-base leading-relaxed max-w-prose mb-8">
        The reveal is a contract, not a coat of paint. Earlier, one timeline ran under four different
        skins. Here the motion itself changes character: a playful sweep, an austere hush, a technical
        decode, an editorial snap. What never changes is the one job it does, showing you which parts
        of the answer have settled.
      </p>

      <div className="grid md:grid-cols-2 gap-4 md:gap-5 mb-16 md:mb-24">
        {SPECIMENS.map(({ name, kind, caption, Comp }) => (
          <div
            key={name}
            className="rounded-2xl overflow-hidden border flex flex-col"
            style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)' }}
          >
            <div data-demo className="relative w-full" style={{ height: 'clamp(248px, 30vw, 300px)' }}>
              <Comp />
            </div>
            <div className="px-5 py-4" style={{ background: 'var(--surface)' }}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="font-display text-lg tracking-tight">{name}</span>
                <span
                  className="text-[9.5px] uppercase tracking-[0.16em]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
                >
                  {kind}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                {caption}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Rich content: not just plain text. */}
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] gap-8 md:gap-12 items-center mb-16 md:mb-24">
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.18em] mb-2"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            + The loading state, made legible
          </div>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-4">
            The wait already shows the shape
          </h3>
          <p className="text-base leading-relaxed max-w-prose">
            <Highlight>
              Before a single word exists, the answer is already taking shape. A wellness brand loads
              in living green, earthy and organic, so you read its register in the first frame: the
              color alone signals the kind of answer that is coming, and on a shared surface carrying
              many products, that loading frame is branded space, not a blank. And when the words
              arrive, they carry full weight: bold, italics, scale, color, even an emoji.
            </Highlight>
          </p>
        </div>
        <div
          data-demo
          className="relative rounded-2xl overflow-hidden border w-full"
          style={{
            height: 'clamp(240px, 34vw, 300px)',
            borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)',
          }}
        >
          <RichContentDemo />
        </div>
      </div>

      {/* The UX payoff: a legible loading state. */}
      <div className="max-w-3xl">
        <div
          className="text-[10px] uppercase tracking-[0.18em] mb-4"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          + Why it earns its keep
        </div>
        <p className="text-xl md:text-2xl leading-relaxed font-bold tracking-tight">
          The motion changes character with the brand. The job underneath it does not.
        </p>
        <p className="text-base leading-relaxed max-w-prose mt-5">
          Spectra sweeps, Quiet barely moves, Console decodes, Registry snaps into alignment. Four
          registers, four feelings, and in every one you can still read how far along the answer is
          and which parts have settled. The reveal carries its meaning into any house style, which is
          what makes it a real system rather than a one-off effect.
        </p>
      </div>
    </Section>
  )
}

'use client'

import { Section } from '@/components/section'
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
      'A developer tool. A block-to-glyph decode treatment gives the same state contract a technical register.',
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
      title="Motion registers"
      eyebrow={['Generalization', 'Different motion, same semantics']}
    >
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter lowercase leading-[1.02] mb-6 max-w-4xl">
        <span className="title-index">viii.</span>nature is the source library, not the proof
      </h2>
      <p className="text-base leading-relaxed max-w-prose mb-12 md:mb-16">
        I borrowed behaviors—branching, dissipation, bands, division—because they gave each mode a
        coherent verb. That is a creative constraint, not evidence that the interaction works.
      </p>

      {/* The thesis. */}
      <div className="max-w-3xl mb-16 md:mb-24">
        <div
          className="text-[10px] uppercase tracking-[0.18em] mb-5"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          + The constraint
        </div>
        <div className="space-y-5 text-lg md:text-xl leading-relaxed">
          <p>
            Every frame has to do one of three jobs: identify the current state, preserve readable
            content, or express the product&rsquo;s visual voice.
          </p>
          <p>
            If a flourish does none of those jobs, it goes. If it claims to represent model state
            without a model signal, it is mislabeled. The shipped prototype keeps that distinction visible.
          </p>
          <p>
            Nature helped generate the vocabulary. The design contract, accessibility checks, and
            eventual user study decide whether it earns a place in a product.
          </p>
        </div>
      </div>

      {/* Generalization: one contract, multiple motion registers. */}
      <div
        className="text-[10px] uppercase tracking-[0.18em] mb-2"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
      >
        + One contract, four registers
      </div>
      <p className="text-base leading-relaxed max-w-prose mb-8">
        The brand tiles above hold motion constant and swap visual tokens. Here I do the inverse:
        surface stays comparable while motion changes character—a playful sweep, an austere hush, a
        technical decode, an editorial snap. Every specimen still exposes the same three states.
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
              Structured answers need more than plain-word choreography. This specimen keeps headings,
              emphasis, color, and emoji intact while the container changes state. It tests whether the
              engine can preserve hierarchy instead of flattening rich content into a text effect.
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
          Spectra sweeps, Quiet barely moves, Console decodes, Registry snaps into alignment. The
          visual character changes; the state vocabulary stays ready, resolving, resolved. That
          separation is what makes this a system to evaluate rather than a collection of effects.
        </p>
      </div>
    </Section>
  )
}

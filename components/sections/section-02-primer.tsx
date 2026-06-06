'use client'

import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

// Two short setup beats folded into one section: how diffusion text actually
// resolves, then the rendering assumption it quietly breaks. The payoff both
// beats serve is legibility: a reader needs the mechanism in order to read the
// shape and state of a provisional answer.
const breaks = [
  {
    title: 'the cursor sentinel',
    body: 'a blinking caret at the end of a partial line says more text is coming, next, in order. diffusion has no insertion point and no next.',
  },
  {
    title: 'the growing bubble',
    body: 'bubble height tracks token count, so size reads as progress. diffusion bubbles snap to full size or grow out of order as cells resolve.',
  },
  {
    title: 'partial-output trust',
    body: 'streaming taught readers that text on screen is settled so far. under diffusion every word is provisional until the final pass lands.',
  },
]

export function SectionPrimer() {
  return (
    <Section
      id="primer"
      n={2}
      act="I"
      title="the mechanism, and what it breaks"
      eyebrow={['Primer', 'what breaks']}
    >
      {/* beat one: the mechanism */}
      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter lowercase leading-[1.04] mb-10 max-w-3xl">
        <span className="title-index">ii.</span>how diffusion text works, in sixty seconds
      </h2>
      <div className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_280px] items-start">
        <div
          className="panel-accent rounded-2xl p-8 md:p-12"
          style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
        >
          <DiffusionText mode="fog" trigger="inView" className="text-lg md:text-xl leading-relaxed">
            {`A diffusion model resolves a full response in a single pass. It starts from noise spread across the whole answer surface and refines toward clarity over several iterations. Tokens do not arrive in sequence. They sharpen everywhere at once, with confidence rising in parallel.`}
          </DiffusionText>
        </div>
        <dl className="spec-rail w-full">
          <div className="spec-row">
            <dt>arrival</dt>
            <dd>all at once</dd>
          </div>
          <div className="spec-row">
            <dt>direction</dt>
            <dd>non-sequential</dd>
          </div>
          <div className="spec-row">
            <dt>method</dt>
            <dd>iterative denoise</dd>
          </div>
          <div className="spec-row">
            <dt>confidence</dt>
            <dd>builds in parallel</dd>
          </div>
        </dl>
      </div>

      {/* beat two: the assumption it breaks — token-by-token rendering */}
      <div className="mt-16 md:mt-24">
        <h3 className="text-3xl md:text-4xl font-bold tracking-tighter lowercase leading-tight mb-3 max-w-3xl">
          the assumption it breaks: token-by-token rendering
        </h3>
        <p className="text-base leading-relaxed max-w-2xl mb-10" style={{ color: 'var(--muted)' }}>
          every chat convention quietly encodes a left-to-right cursor. three of them stop telling
          the truth the moment the answer resolves in parallel.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {breaks.map((b, i) => (
            <div
              key={b.title}
              className="panel-accent rounded-2xl p-7 min-h-[280px] flex flex-col"
              style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
            >
              <div
                className="text-xs uppercase tracking-[0.16em] mb-3"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'color-mix(in oklab, var(--stage-text) 70%, transparent)',
                }}
              >
                + 0{i + 1}
              </div>
              <h4 className="text-2xl font-semibold lowercase mb-4">{b.title}</h4>
              <DiffusionText mode="mycelium" trigger="inView" className="text-base leading-relaxed">
                {b.body}
              </DiffusionText>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

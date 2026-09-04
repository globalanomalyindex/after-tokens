'use client'

import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { TRACE_NUMBERS } from '@/lib/traces/findings'

// Two short setup beats folded into one section: how diffusion text actually
// resolves, then the rendering assumption it quietly breaks. The payoff both
// beats serve is legibility: a reader needs the mechanism in order to read the
// shape and state of a provisional answer.
const breaks = [
  {
    title: 'the cursor sentinel',
    body: 'a blinking caret says more text is coming next, at one insertion point. a masked diffusion sampler can revise many positions in the same denoising step.',
  },
  {
    title: 'the growing bubble',
    body: 'bubble height usually tracks emitted token count. a non-sequential answer may reserve its full surface before individual positions settle.',
  },
  {
    title: 'partial-output trust',
    body: `streaming makes earlier text look committed. masked positions can remain provisional, or be masked again, across iterative denoising steps. in the recorded trajectories the model's provisional guess for a position changed about ${TRACE_NUMBERS.flipsPerTokenLowconf.toFixed(1)} times before it committed.`,
  },
]

export function SectionPrimer() {
  return (
    <Section
      id="primer"
      n={2}
      act="I"
      title="Brief and mechanism"
      eyebrow={['Project brief', 'Working speculative prototype']}
    >
      <div className="mb-20 md:mb-28">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter lowercase leading-[1.02] mb-6 max-w-4xl">
          <span className="title-index">ii.</span>a rendering system for answers that do not arrive left to right
        </h2>
        <p className="text-lg md:text-xl leading-relaxed max-w-3xl mb-10" style={{ color: 'var(--ink-2)' }}>
          After Tokens asks a product question before it makes a motion argument: if a language model
          resolves many positions in parallel, what should the interface reveal, and what must it never imply?
        </p>

        <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border" style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)', background: 'color-mix(in oklab, var(--ink) 12%, transparent)' }}>
          {[
            ['brief', 'Invent an arrival language for masked diffusion responses.'],
            ['role', 'Solo product design and design engineering.'],
            ['built', 'Reusable engine, four authored modes plus one driven by recorded sampler trajectories, brand tokens, widget, and playground.'],
            ['status', 'Working prototype. One mode replays a real sampler. The comprehension hypothesis is not yet validated.'],
          ].map(([label, value]) => (
            <div key={label} className="p-5 md:p-6" style={{ background: 'var(--surface)' }}>
              <dt className="text-[10px] uppercase tracking-[0.16em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                + {label}
              </dt>
              <dd className="text-sm leading-relaxed">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#playground"
            className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold"
            style={{ background: 'var(--ink)', color: 'var(--surface)' }}
          >
            Try the prototype ↓
          </a>
          <a
            href="https://github.com/globalanomalyindex/after-tokens"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold"
            style={{ borderColor: 'color-mix(in oklab, var(--ink) 24%, transparent)' }}
          >
            Inspect the source ↗
          </a>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            Scope: framing, interaction model, motion system, implementation, accessibility, and testing.
          </span>
        </div>
      </div>

      {/* beat one: the mechanism */}
      <div className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
        + The mechanism
      </div>
      <h3 className="text-3xl md:text-5xl font-bold tracking-tighter lowercase leading-[1.04] mb-10 max-w-3xl">
        masked diffusion, in sixty seconds
      </h3>
      <div className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_280px] items-start">
        <div
          className="panel-accent rounded-2xl p-8 md:p-12"
          style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
        >
          <DiffusionText mode="fog" trigger="inView" className="text-lg md:text-xl leading-relaxed">
            {`A masked diffusion language model begins with masked positions and refines a candidate response across multiple denoising steps. At each step it can predict many positions in parallel, and a sampler decides which positions stay fixed or are masked again. Unlike autoregressive generation, the process is not locked to left-to-right next-token order.`}
          </DiffusionText>
        </div>
        <dl className="spec-rail w-full">
          <div className="spec-row">
            <dt>model family</dt>
            <dd>masked diffusion</dd>
          </div>
          <div className="spec-row">
            <dt>generation</dt>
            <dd>many positions per step</dd>
          </div>
          <div className="spec-row">
            <dt>process</dt>
            <dd>iterative denoising</dd>
          </div>
          <div className="spec-row">
            <dt>this demo</dt>
            <dd>authored timing</dd>
          </div>
        </dl>
      </div>
      <p className="mt-5 text-xs leading-relaxed max-w-2xl" style={{ color: 'var(--muted)' }}>
        Mechanism references:{' '}
        <a className="underline underline-offset-4" href="https://arxiv.org/abs/2502.09992" target="_blank" rel="noreferrer">
          LLaDA
        </a>{' '}
        and{' '}
        <a className="underline underline-offset-4" href="https://arxiv.org/abs/2406.07524" target="_blank" rel="noreferrer">
          Simple and Effective Masked Diffusion Language Models
        </a>. The interface below simulates state; it is not connected to either model.
      </p>

      {/* beat two: the assumption it breaks, token-by-token rendering */}
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

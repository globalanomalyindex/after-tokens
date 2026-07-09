'use client'

import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { RevealComparison } from '@/components/diffusion/reveal-comparison'

const PRINCIPLES = [
  {
    n: '01',
    title: 'state fidelity',
    body: 'A lock may represent sampler state only when a real model signal drives it. Authored timing must be labeled as simulation.',
  },
  {
    n: '02',
    title: 'glanceability',
    body: 'Ready, changing, and resolved should be distinguishable without reading every word or decoding a decorative effect.',
  },
  {
    n: '03',
    title: 'equivalent access',
    body: 'The same state must survive reduced motion, keyboard use, screen readers, and a paused or interrupted reveal.',
  },
]

const PIPELINE = [
  ['01', 'content', 'Response text or structured answer'],
  ['02', 'tokenize', 'Stable visual atoms'],
  ['03', 'measure', 'Real line and word geometry'],
  ['04', 'strategy', 'One of four reveal timelines'],
  ['05', 'choreograph', 'Ready → resolving → resolved'],
  ['06', 'render', 'Brand tokens, glyphs, and overlays'],
]

export function SectionThesis() {
  return (
    <Section id="thesis" n={3} act="II" title="Hypothesis and system" eyebrow={['Hypothesis', 'Signal, not spectacle']}>
      <div className="max-w-3xl mb-16 md:mb-24">
        <div className="text-xs uppercase tracking-[0.16em] mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + The product position
        </div>
        <div className="panel-accent rounded-2xl p-8 md:p-12" style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}>
          <DiffusionText
            mode="aurora"
            trigger="inView"
            showStatus
            className="text-2xl md:text-3xl font-bold tracking-tight leading-tight"
          >
            {`If a sampler exposes meaningful answer state, the interface should make that state legible. Until then, the reveal is an authored prototype—not evidence about what the model knows.`}
          </DiffusionText>
        </div>
      </div>

      <div className="text-xs uppercase tracking-[0.16em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
        + A testable interaction hypothesis
      </div>
      <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-3 max-w-2xl">
        can a reveal communicate progress better than a uniform blur?
      </h3>
      <p className="text-base leading-relaxed max-w-2xl mb-8 md:mb-10">
        Both panels use the same words, blur range, and total duration. One sharpens everything on a flat ramp; the other
        resolves authored regions out of order. This is a prototype stimulus, not a research result.
      </p>

      <RevealComparison />
      <p className="mt-4 text-xs leading-relaxed max-w-2xl" style={{ color: 'var(--muted)' }}>
        Study prompt: after interrupting the sequence at matched timestamps, can a participant identify what is still
        changing, understand the visible text, and do so without added distraction?
      </p>

      <div className="mt-16 md:mt-24">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + Design contract
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {PRINCIPLES.map((principle) => (
            <article key={principle.n} className="rounded-2xl border p-6" style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)' }}>
              <div className="text-[10px] tracking-[0.18em] mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                {principle.n}
              </div>
              <h4 className="text-xl font-semibold lowercase mb-3">{principle.title}</h4>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{principle.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-16 md:mt-24">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + System anatomy
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-4 max-w-2xl">
          a reusable engine, not ten one-off animations
        </h3>
        <p className="text-base leading-relaxed max-w-2xl mb-8">
          The implementation separates meaning, timing, and visual identity. That makes the prototype testable: a study can
          swap one strategy while holding content, duration, geometry, and brand constant.
        </p>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden border" style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)', background: 'color-mix(in oklab, var(--ink) 12%, transparent)' }}>
          {PIPELINE.map(([n, title, body]) => (
            <li key={n} className="p-5 md:p-6" style={{ background: 'var(--surface)' }}>
              <div className="text-[10px] tracking-[0.16em] mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{n} · {title}</div>
              <p className="text-sm leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-16 md:mt-24 grid md:grid-cols-2 gap-5 max-w-4xl">
        <div className="rounded-2xl p-7" style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}>
          <div className="text-[10px] uppercase tracking-[0.18em] mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'color-mix(in oklab, var(--stage-text) 60%, transparent)' }}>
            tested in this build
          </div>
          <p className="text-base leading-relaxed">
            Typed strategy contracts, deterministic replays, reduced-motion completion, screen-reader text, responsive
            geometry, unit tests, and browser-level accessibility checks.
          </p>
        </div>
        <div className="rounded-2xl border p-7" style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)' }}>
          <div className="text-[10px] uppercase tracking-[0.18em] mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            still to validate
          </div>
          <p className="text-base leading-relaxed">
            Whether region-based revealing improves state identification or comprehension. If it performs no better than
            the baseline—or adds distraction—the legibility thesis fails.
          </p>
        </div>
      </div>

      <div className="mt-10 max-w-3xl border-l-2 pl-5" style={{ borderColor: 'var(--section-accent)' }}>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          <strong className="font-semibold">Decision:</strong> I replaced abstract progress graphs with the live word
          comparison above. The graph explained the idea; the paired stimulus makes the interaction itself inspectable.
        </p>
      </div>
    </Section>
  )
}

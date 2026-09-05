'use client'

import type { ReactNode } from 'react'
import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { NatureWord } from '@/components/chrome/nature-word'
import { DefinitionTerm } from '@/components/chrome/definition-term'
import { RevealComparison } from '@/components/diffusion/reveal-comparison'
import { TRACE_NUMBERS, SYNTHESIS, HYPOTHESES, type SynthesisTag } from '@/lib/traces/findings'

// The three reasons a region-by-region, phi-spaced reveal is worth testing against
// a generic linear blur -> unblur, from a comprehension standpoint. Reason 01 ties
// the cadence to a measured rhythm in nature, framed as a hypothesis that could be
// wrong; 02 and 03 carry the cognitive science as inline definition chips you can
// open. None of this is evidence the reveal works: it is why the hypothesis is
// worth the study described above.
const REASONS: { n: string; lead: string; body: ReactNode }[] = [
  {
    n: '01',
    lead: 'a cadence the eye already reads',
    body: (
      <>
        The rhythm is not arbitrary. It is the 1/φ spacing that lays out{' '}
        <NatureWord kind="nautilus">shells</NatureWord>, <NatureWord kind="sunflower">seed heads</NatureWord>, and the
        spiral of <NatureWord kind="leaves">leaves</NatureWord> up a stem. The bet is that growth the eye evolved
        alongside reads as ordered, faster than a flat ramp does. That is a hypothesis you can test. Nature hands you
        a pattern here; whether it reads that way on a screen is the open question.
      </>
    ),
  },
  {
    n: '02',
    lead: 'a process you can read while it runs',
    body: (
      <>
        A linear blur gives the eye one job: wait, with no read on how far along the answer is. A region-by-region
        reveal exposes that progress directly, and the <DefinitionTerm term="zeigarnik effect" /> is why an open,
        resolving structure stays legible: you can see which parts are settled and which are still forming. The reveal
        reports state instead of hiding it.
      </>
    ),
  },
  {
    n: '03',
    lead: 'the brain fills the gaps',
    body: (
      <>
        The brain runs on <DefinitionTerm term="predictive coding" />, always guessing the next word. Each one that
        lands collapses a <DefinitionTerm term="prediction error" />, and the <DefinitionTerm term="dopamine" /> system
        marks the resolution. The final gaps snapping shut is <DefinitionTerm term="gestalt closure" />, the moment the{' '}
        <DefinitionTerm term="peak-end rule" /> says we remember a sequence by. Arrive all at once and there is no
        partial state to read.
      </>
    ),
  },
]

// Tag colors for the decision ledger (SYNTHESIS in lib/traces/findings.ts):
//   derived    the value falls out of a measurement or a property
//   constraint forced by what the interface has to communicate
//   tuned      set by eye, labeled so, safe to change
//   retired    kept only as the comparison stimulus
const TAG_COLOR: Record<SynthesisTag, string> = {
  derived: 'color-mix(in oklab, var(--section-accent) 88%, var(--ink))',
  constraint: 'var(--ink-2)',
  tuned: 'var(--muted)',
  retired: 'var(--muted)',
}

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
    <Section id="thesis" n={4} act="II" title="Hypothesis and design" eyebrow={['Hypothesis', 'Legible state']}>
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
            {`A sampler exposes real answer state: which positions have committed, in what order, with what confidence. The interface should make that state legible. One mode here replays recorded sampler state. The other four are authored simulations, and they say so.`}
          </DiffusionText>
        </div>
        <p className="text-base leading-relaxed max-w-2xl mt-5">
          The goal is <DefinitionTerm term="trust calibration" />: a reader&apos;s confidence in an answer should track what
          the system has actually settled. A reveal that overstates certainty is worse than no reveal at all.
        </p>
        <p className="text-base leading-relaxed max-w-2xl mt-3">
          The previous section shows what that state looks like in a real sampler. The order follows the sampler&apos;s
          confidence inside each block of its schedule, and the model&apos;s provisional guess for an uncommitted
          position changes about {TRACE_NUMBERS.flipsPerTokenLowconf.toFixed(1)} times before it commits. Those are the
          numbers the reveal below is designed against.
        </p>
      </div>

      <div className="mt-16 md:mt-24">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + What a reader needs
        </div>
        <p className="text-base leading-relaxed max-w-2xl mb-8 md:mb-10">
          The mechanisms below are documented findings about how people read and wait. They say what a reveal has to
          respect. None of them was measured on this prototype, and none of them is evidence that the reveal helps.
        </p>
        <div className="grid md:grid-cols-3 gap-8 md:gap-10">
          {REASONS.map((r) => (
            <div key={r.n}>
              <div
                className="mb-3 text-[11px] tracking-[0.18em]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'color-mix(in oklab, var(--section-accent) 88%, var(--ink))',
                }}
              >
                {r.n} · {r.lead}
              </div>
              <p className="text-base leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The decision ledger: the design itself, one row per rendering decision,
          with the principle and the finding that drive it and how the value was
          arrived at. The reasoning in order is docs/redesign.md. */}
      <div className="mt-16 md:mt-24">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + The reveal, decision by decision
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-4 max-w-2xl">
          every choice traces to a principle, a measurement, or an admitted guess
        </h3>
        <p className="text-base leading-relaxed max-w-2xl mb-8 md:mb-10">
          Twelve decisions make the shipped reveal. Each row names what drives it and how the value was arrived at: derived
          from a measurement or a property, forced by what the interface has to say, tuned by eye and labeled so, or
          retired to the comparison stimulus. Saying which is which is the difference between a system and a look.
        </p>
        <dl className="max-w-4xl" style={{ borderTop: '1px solid color-mix(in oklab, var(--ink) 14%, transparent)' }}>
          {SYNTHESIS.map((row) => (
            <div
              key={row.decision}
              className="grid md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] gap-x-8 gap-y-2 py-6"
              style={{ borderBottom: '1px solid color-mix(in oklab, var(--ink) 14%, transparent)' }}
            >
              <dt>
                <span className="block text-base font-semibold lowercase leading-snug">{row.decision}</span>
                <span
                  className="mt-1.5 block text-[10px] uppercase tracking-[0.18em]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'color-mix(in oklab, var(--section-accent) 88%, var(--ink))' }}
                >
                  {row.from}
                </span>
                <span
                  className="mt-1 block text-[10px] uppercase tracking-[0.18em]"
                  style={{ fontFamily: 'var(--font-mono)', color: TAG_COLOR[row.tag] }}
                >
                  [{row.tag}]
                </span>
              </dt>
              <dd className="text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                {row.effect}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-16 md:mt-24">
        <div className="text-xs uppercase tracking-[0.16em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + The hypothesis, as three claims a study can break
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-8 max-w-2xl">
          legible state, no reading cost, calibrated trust
        </h3>
        <dl className="grid md:grid-cols-3 gap-px rounded-2xl overflow-hidden border mb-10" style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)', background: 'color-mix(in oklab, var(--ink) 12%, transparent)' }}>
          {HYPOTHESES.map((h) => (
            <div key={h.id} className="p-6" style={{ background: 'var(--surface)' }}>
              <dt className="text-[10px] uppercase tracking-[0.16em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'color-mix(in oklab, var(--section-accent) 88%, var(--ink))' }}>
                {h.id} · {h.lead}
              </dt>
              <dd className="text-sm leading-relaxed">{h.claim}</dd>
              <dd className="mt-3 text-[11px] leading-relaxed" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                falsified if {h.falsifiedIf}
              </dd>
            </div>
          ))}
        </dl>

        <div className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + The stimulus for H1
        </div>
        <p className="text-base leading-relaxed max-w-2xl mb-8 md:mb-10">
          Both panels use the same words, blur range, and total duration. One sharpens everything on a flat ramp; the
          other resolves regions out of order on the retired phi cadence. This is a prototype stimulus. It is not a
          research result.
        </p>
        <RevealComparison />
        <p className="mt-4 text-xs leading-relaxed max-w-2xl" style={{ color: 'var(--muted)' }}>
          Interrupt the loop at any instant and both panels are a matched pair: same words, same clock. The study asks
          which one lets a participant say what is still changing.
        </p>
        <p className="mt-2 text-xs leading-relaxed max-w-2xl" style={{ color: 'var(--muted)' }}>
          An answer that arrives whole gives the eye nothing to track, and <DefinitionTerm term="change blindness" /> is
          why a large simultaneous change can pass unread. Staging the arrival is what makes the change perceivable at
          all, which is the part of H1 a study would have to break first.
        </p>
      </div>

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
          a reusable engine
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
            Sixty recorded denoising trajectories from a real masked diffusion model drive the sampler mode; typed
            strategy contracts, deterministic replays, reduced-motion completion, screen-reader text, responsive
            geometry, unit tests, and browser-level accessibility checks.
          </p>
        </div>
        <div className="rounded-2xl border p-7" style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)' }}>
          <div className="text-[10px] uppercase tracking-[0.18em] mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            still to validate
          </div>
          <p className="text-base leading-relaxed">
            All three claims. The prototype supplies the stimuli, including real sampler order and real commit
            probabilities; a study supplies the readers.
          </p>
        </div>
      </div>

      <div className="mt-10 max-w-3xl border-l-2 pl-5" style={{ borderColor: 'var(--section-accent)' }}>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          <strong className="font-semibold">Decision:</strong> the reveal was rebuilt from these rows after the
          trajectories were measured. Four earlier choices were retired by them: a phi cadence, a field-wide sweep during
          the reveal, a halo left on every locked word, and a closing beat at a fixed fraction of the run. The reasoning
          in order is in the repository as docs/redesign.md.
        </p>
      </div>
    </Section>
  )
}

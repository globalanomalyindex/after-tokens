'use client'

import type { ReactNode } from 'react'
import { Section } from '@/components/section'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { NatureWord } from '@/components/chrome/nature-word'
import { DefinitionTerm } from '@/components/chrome/definition-term'
import { RevealComparison } from '@/components/diffusion/reveal-comparison'

// The three reasons a region-by-region, phi-spaced reveal is worth testing against
// a generic linear blur -> unblur, from a comprehension standpoint. Reason 01 ties
// the cadence to a measured rhythm in nature (framed as a hypothesis, not a law);
// 02 and 03 carry the cognitive science as inline definition chips you can open.
// None of this is evidence the reveal works: it is why the hypothesis is worth the
// study described above.
const REASONS: { n: string; lead: string; body: ReactNode }[] = [
  {
    n: '01',
    lead: 'a cadence the eye already reads',
    body: (
      <>
        The rhythm is not arbitrary. It is the 1/φ spacing that lays out{' '}
        <NatureWord kind="nautilus">shells</NatureWord>, <NatureWord kind="sunflower">seed heads</NatureWord>, and the
        spiral of <NatureWord kind="leaves">leaves</NatureWord> up a stem. The bet is that growth the eye evolved
        alongside reads as ordered, not random, faster than a flat ramp does. That is a hypothesis you can test, not a
        law nature hands you.
      </>
    ),
  },
  {
    n: '02',
    lead: 'a process you can read, not a wait',
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

// The rationale ledger. A reveal system is mostly numbers, and a reviewer is right
// to ask which of them had to be that. Each row is tagged with how the value was
// arrived at, because the honest answer differs per row:
//   derived    - falls out of a property, and the argument for it survives scrutiny
//   constraint - forced by what the interface has to communicate
//   tuned      - eyeballed, frozen, and safe to change
// Every claim here is checkable against the code: lib/diffusion/modes/mycelium.ts
// holds the cadence and the hash order, components/diffusion/reveal-comparison.tsx
// holds the golden-angle stride and the shared blur range.
type Tag = 'derived' | 'constraint' | 'tuned'

const TAG_COLOR: Record<Tag, string> = {
  derived: 'color-mix(in oklab, var(--section-accent) 88%, var(--ink))',
  constraint: 'var(--ink-2)',
  tuned: 'var(--muted)',
}

const RATIONALE: { decision: string; tag: Tag; body: ReactNode }[] = [
  {
    decision: 'the 1/φ decay between locks',
    tag: 'derived',
    body: (
      <>
        Each gap is the previous one divided by φ, so the reveal opens as a breadcrumb and ends as a flood. The ratio
        is the part worth defending. At 1/φ, and only at 1/φ, every gap equals the sum of the next two: the wait you
        are in is always exactly as long as the two waits after it combined. That is the defining property of φ, not a
        resemblance to one. A faster decay spends most of the window on the first gap and then dumps the rest; a slower
        one flattens toward a metronome. This is the balance point that has a definition instead of a preference. The
        series is floored at 45 milliseconds, roughly three frames, because the pure curve runs to zero and two words
        landing on the same frame is simultaneity, which erases the signal the reveal exists to send.
      </>
    ),
  },
  {
    decision: 'the golden-angle order in the comparison',
    tag: 'derived',
    body: (
      <>
        Which word goes next is not random. The order steps across the line on a stride near n/φ, forced coprime to the
        word count so it visits every word exactly once. φ is the hardest number to approximate with a fraction, and
        that is precisely why the stride never settles into a repeating pattern and never lands two neighbours back to
        back. An out-of-order reveal has two failure modes: it can look like a pattern, which reads as mechanical, or it
        can keep landing adjacent words, which quietly turns back into left to right. This is the one stride that avoids
        both at any sentence length with no hand-tuned table of magic numbers. The{' '}
        <NatureWord kind="sunflower">seed heads</NatureWord> are why I looked here. The coprimality is why I stayed.
      </>
    ),
  },
  {
    decision: 'a text-seeded hash for the shipped order',
    tag: 'constraint',
    body: (
      <>
        The shipped mycelium mode does not use the golden-angle stride, and the difference is deliberate. A fixed stride
        gives every sentence of the same length the identical order, which is correct for a controlled stimulus and
        wrong for a product: a reader would start recognising the animation instead of the answer. So the order is
        hashed from the response text. The same answer always resolves the same way, different answers resolve
        differently, and nothing about the order pretends to carry model information.
      </>
    ),
  },
  {
    decision: 'blur, not a fade or a scramble',
    tag: 'constraint',
    body: (
      <>
        A pending word has to say three things at once: I exist, I am this long, and you cannot read me yet. A fade
        leaves it readable. A character scramble invents content and changes the length. Blur is the only channel that
        removes legibility continuously while holding position, length, and word shape, and length is what keeps the
        line still so the eye can plan ahead into it.
      </>
    ),
  },
  {
    decision: 'nine pixels of blur, a 0.32 opacity floor',
    tag: 'tuned',
    body: (
      <>
        Eyeballed, then frozen. Nine pixels is where a short word stops being readable but has not yet bled into its
        neighbour; the floor is high enough that a pending word holds its slot instead of the line reading as
        half-empty. Neither number is derived from anything and a study could move both without touching the thesis.
        What matters is that both panels above use identical values, which is the only reason that comparison is a fair
        test rather than a strawman.
      </>
    ),
  },
  {
    decision: 'the word as the unit of state',
    tag: 'constraint',
    body: (
      <>
        The word is the smallest thing that means anything on its own, so it is the smallest thing whose state is worth
        reporting. Half a resolved character is noise. A whole resolved line is too coarse to tell you which part of the
        answer has settled.
      </>
    ),
  },
  {
    decision: 'four modes',
    tag: 'tuned',
    body: (
      <>
        One mode is an effect. Two is a comparison. Four is the smallest set that varies order, spacing, overlay, and
        glyph treatment independently enough to show the contract is separable from the look. There is nothing special
        about four.
      </>
    ),
  },
]

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
            {`If a sampler exposes meaningful answer state, the interface should make that state legible. Until then, the reveal is an authored prototype: not evidence about what the model knows.`}
          </DiffusionText>
        </div>
        <p className="text-base leading-relaxed max-w-2xl mt-5">
          The goal is <DefinitionTerm term="trust calibration" />: a reader&apos;s confidence in an answer should track what
          the system has actually settled. A reveal that overstates certainty is worse than no reveal at all.
        </p>
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
        changing, understand the visible text, and do so without added distraction? Drag the scrubber to stop both
        panels on the same instant and compare what each one is telling you.
      </p>
      <p className="mt-2 text-xs leading-relaxed max-w-2xl" style={{ color: 'var(--muted)' }}>
        An answer that arrives whole gives the eye nothing to track, and <DefinitionTerm term="change blindness" /> is
        why a large simultaneous change can pass unread. Staging the arrival is what makes the change perceivable at
        all, which is the part of the hypothesis a study would have to break first.
      </p>

      <div className="mt-16 md:mt-24">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + Why the hypothesis is plausible
        </div>
        <p className="text-base leading-relaxed max-w-2xl mb-8 md:mb-10">
          The mechanisms below are documented findings about how people read and wait. They are why this hypothesis is
          worth testing, not evidence that it holds. None of them was measured on this prototype.
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

      {/* The rationale ledger. Reason 01 above claims the cadence is not arbitrary,
          which invites the obvious next question. This answers it in the open, and
          labels the values that genuinely are arbitrary as arbitrary. */}
      <div className="mt-16 md:mt-24">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          + Defending the arbitrary-looking choices
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-4 max-w-2xl">
          every number here is either derived or eyeballed. this is which.
        </h3>
        <p className="text-base leading-relaxed max-w-2xl mb-8 md:mb-10">
          A reveal system is mostly numbers, and numbers invite the question of whether any of them had to be that.
          Some did, for reasons that hold up under argument. Some were tuned by eye and would survive being changed.
          Saying which is which is the difference between a system and a look.
        </p>
        <dl className="max-w-4xl" style={{ borderTop: '1px solid color-mix(in oklab, var(--ink) 14%, transparent)' }}>
          {RATIONALE.map((r) => (
            <div
              key={r.decision}
              className="grid md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] gap-x-8 gap-y-2 py-6"
              style={{ borderBottom: '1px solid color-mix(in oklab, var(--ink) 14%, transparent)' }}
            >
              <dt>
                <span className="block text-base font-semibold lowercase leading-snug">{r.decision}</span>
                <span
                  className="mt-1.5 block text-[10px] uppercase tracking-[0.18em]"
                  style={{ fontFamily: 'var(--font-mono)', color: TAG_COLOR[r.tag] }}
                >
                  [{r.tag}]
                </span>
              </dt>
              <dd className="text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                {r.body}
              </dd>
            </div>
          ))}
        </dl>
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
            the baseline, or adds distraction, the legibility thesis fails.
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

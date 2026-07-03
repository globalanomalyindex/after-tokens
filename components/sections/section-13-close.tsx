import { Section } from '@/components/section'
import { Highlight } from '@/components/chrome/highlight'
import { NatureWord } from '@/components/chrome/nature-word'

export function SectionClose() {
  return (
    <Section id="close" n={10} act="V" title="Close" eyebrow={['Close', '2026']}>
      <div className="max-w-2xl">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter lowercase leading-tight mb-8">
          <span className="title-index">x.</span>What this case study does not solve
        </h2>
        <ul className="space-y-4 text-base leading-relaxed mb-12">
          <li>
            <Highlight>
              <strong>Real-time classification.</strong> The coda's mode mapping is hard-coded per prompt.
              A production system would need an actual classifier, with all the failure modes that entails.
            </Highlight>
          </li>
          <li>
            <Highlight>
              <strong>Accessibility tradeoffs.</strong> Reduced motion collapses the reveal to a single
              fade, and the signal about what has settled versus what is still resolving goes with it.
              A richer accessible version, one that carries answer state without motion, is still to be
              designed.
            </Highlight>
          </li>
          <li>
            <Highlight>
              <strong>The thesis is unvalidated.</strong> The claim is that a reveal can make a
              provisional answer more legible, not just less boring. The next step is research, not
              more design.
            </Highlight>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              <strong className="font-semibold">Hypothesis:</strong> a phi-cadence, region-by-region
              reveal lets a reader judge an answer&rsquo;s state more accurately than a linear blur that
              finishes at the same instant. <strong className="font-semibold">Measure:</strong>
              {' '}comprehension accuracy on the resolved text, calibration between a reader&rsquo;s
              stated confidence and the answer&rsquo;s actual correctness, and preference between the two
              conditions. <strong className="font-semibold">Falsified if:</strong> the phi reveal shows
              no comprehension or calibration gain over the linear baseline, or readers report it as
              decorative; at that point the legibility argument fails and it is back to ornament.
            </p>
          </li>
          <li>
            <Highlight>
              <strong>An honest cadence only.</strong> The reveal is only as truthful as the confidence
              signal driving it. Decorative timing that is not derived from real model uncertainty
              teaches false trust, which is worse than teaching none.
            </Highlight>
          </li>
          <li>
            <Highlight>
              <strong>Latin script, for now.</strong> The glyph choreography and golden-angle stride were
              tuned on English tokens. CJK, RTL, and diacritic-heavy scripts break per-glyph assumptions
              this system has not yet earned.
            </Highlight>
          </li>
        </ul>
        <div className="mb-12">
          <p
            className="text-[10px] lowercase tracking-[0.16em] mb-3"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            + cut on the way here
          </p>
          <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--ink-2)' }}>
            the shipped thing is the survivor. three earlier shapes did not make it:
          </p>
          <ul className="space-y-4 text-base leading-relaxed">
            <li>
              <Highlight>
                <strong>A fourth reveal mode.</strong> A particle flock, rebuilt three times:
                chain-reaction swarm, liquid-glass orbs, fireflies. The faster it moved the harder it was
                to read; mycelium said the same thing simpler, so the flock went.
              </Highlight>
            </li>
            <li>
              <Highlight>
                <strong>The first entrance.</strong> Shipped, broke, removed. Rebuilt only after the
                failure taught what it had to survive: reduced motion, replays, impatient scrolls.
              </Highlight>
            </li>
            <li>
              <Highlight>
                <strong>Line graphs.</strong> The first thesis comparison plotted resolution as curves.
                Graphs describe a process, they do not feel like one. Rows of crosshairs lit by the
                actual word locks replaced them.
              </Highlight>
            </li>
          </ul>
        </div>
        <div className="border-t pt-8" style={{ borderColor: 'color-mix(in oklab, var(--ink) 15%, transparent)' }}>
          <p
            className="text-[10px] lowercase tracking-[0.16em] mb-2"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            + credit
          </p>
          <p className="text-base lowercase">
            designed and built by{' '}
            <span aria-label="christopher robin fiore" style={{ fontWeight: 500 }}>
              {'christopher robin fiore'.split('').map((ch, i, all) =>
                ch === ' ' ? (
                  ' '
                ) : (
                  <span
                    key={i}
                    style={{ color: `oklch(0.55 0.19 ${Math.round((i / (all.length - 1)) * 320)})` }}
                  >
                    {ch}
                  </span>
                ),
              )}
            </span>
          </p>
          <p className="text-base lowercase mt-1">
            portfolio theme: looking to <NatureWord kind="nature">nature</NatureWord> for answers
          </p>
        </div>
      </div>
    </Section>
  )
}

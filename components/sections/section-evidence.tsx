import { Section } from '@/components/section'
import { DefinitionTerm } from '@/components/chrome/definition-term'
import { ARRIVAL, HYPOTHESES, LIMITS, TRACE_NUMBERS } from '@/lib/traces/findings'

const pct = (x: number) => `${Math.round(x * 100)}%`

export function SectionEvidence() {
  const a = ARRIVAL.arrivals
  const CUTS: { what: string; why: string }[] = [
    {
      what: 'fog, aurora, and mitosis, three of the four nature modes',
      why: `scored on the profile: fog and aurora hold ${a.fog.tensionMax} and ${a.aurora.tensionMax} loops open through their sweep and end at ${a.fog.endWeight.toFixed(1)} and ${a.aurora.endWeight.toFixed(1)} times the mean; mitosis scatters inside phrases (${pct(a.mitosis.inversions)} of pairs out of order). they stay in the repository as reference arrivals.`,
    },
    {
      what: 'unbounded seeding in the growth mode',
      why: `mycelium opened ${a.mycelium.tensionMax} loops at once at the median and made a reader wait on ${pct(a.mycelium.previewCost)} of fixations; it bought an earlier gist (${pct(a.mycelium.gistAt)} of the run against ${pct(a.crystal.gistAt)}). the budget trades that tenth for calm, and the fifth claim tests the trade.`,
    },
    {
      what: 'the closing wave and the whole-field pulse',
      why: 'a flourish at the moment the peak-end rule wants completion. the exhale replaces both.',
    },
    {
      what: 'the four hand-built brand specimens and the glyph styles',
      why: 'each was a separate animation, which is the opposite of a system. the voice tokens carry the same range on one grammar.',
    },
    {
      what: 'the drafting chrome',
      why: 'a custom cursor, registration marks, section numerals, spines, a grid, a rainbow title, chips in nineteen hues. the reveal is the design; the page gets out of its way.',
    },
  ]
  return (
    <Section id="evidence" title="The evidence">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">what is measured, what is claimed</h2>
      <p className="standfirst max-w-3xl">
        the profile measures arrivals. the trajectories measure a sampler. neither measures a reader, and the piece
        never says otherwise. what it does instead is state five claims precisely enough for a study to break them,
        and ship the stimuli that study needs.
      </p>

      <div className="mt-12 md:mt-16">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">five claims a study can break</h3>
        <dl className="mt-6 grid gap-6 rule pt-6">
          {HYPOTHESES.map((h) => (
            <div key={h.id} className="grid gap-2 md:grid-cols-[9rem_1fr] md:gap-6">
              <dt className="readout" style={{ color: 'var(--cobalt)' }}>
                {h.id} · {h.lead}
              </dt>
              <dd>
                <span className="block text-base leading-relaxed">{h.claim}</span>
                <span className="mt-1 block readout leading-relaxed" style={{ color: 'var(--muted)' }}>
                  falsified if {h.falsifiedIf}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
          the study: within subjects, the same answers under typewriter, fade, and crystallize at matched durations,
          and crystallize at four budgets; interruptions at matched timestamps for state identification; reading time of
          the final answer; per-word confidence ratings against the recorded commit probabilities; and satisfaction and
          quality ratings after each arrival. text, geometry, and duration are held constant; order is randomized. the
          recorded trajectories, the eight reference arrivals, and the grammar at every budget are the stimuli, all in
          the repository.
        </p>
      </div>

      <div className="mt-16 md:mt-24">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">what was cut, by the numbers</h3>
        <dl className="mt-6 grid gap-6 rule pt-6">
          {CUTS.map((c) => (
            <div key={c.what} className="grid gap-1 md:grid-cols-[16rem_1fr] md:gap-6">
              <dt className="text-base font-semibold leading-snug">{c.what}</dt>
              <dd className="text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                {c.why}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-16 md:mt-24 max-w-[64ch]">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">limits</h3>
        <p className="mt-5 text-base leading-relaxed">{LIMITS}</p>
        <p className="mt-4 text-base leading-relaxed">
          the profile has limits of its own. the phrase rule is punctuation and line breaks, stated for english and latin
          script; a product would use a parser. the salience score that seeds the growth is authored, with a real sampler
          the nucleus would be its surest token. the reader model is one number, a fixation every quarter second, and it
          knows nothing about skimming or rereading. the medians are over {ARRIVAL.stimuli.fixtures}{' '}fixtures and{' '}
          {ARRIVAL.stimuli.curatedRuns}{' '}curated runs of a {TRACE_NUMBERS.params}{' '}model. and the strongest argument against
          the whole approach still stands until the study runs: <DefinitionTerm term="parafoveal preview" />{' '}is measurable,
          and the reader model is a model of it, never a measurement.
        </p>
      </div>
    </Section>
  )
}

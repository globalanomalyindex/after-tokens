import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { CostTable } from '@/components/settle/cost-table'
import { SETTLE, TRACE_NUMBERS } from '@/lib/traces/findings'

// What waiting costs, measured, and what a faster clock changes.

export function SectionCost() {
  const s = SETTLE.all60.sentence.uniform
  const sr = SETTLE.all60.sentence.recorded
  const w = SETTLE.all60.word.uniform
  const p = SETTLE.all60.paragraph.uniform
  const secs = (ms: number | null) => (ms === null ? '·' : (ms / 1000).toFixed(1))
  const formingPct = Math.round((s.medianFormingShare ?? 0) * 100)
  return (
    <Section id="cost" title="What waiting costs">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">what waiting costs</h2>
      <p className="standfirst max-w-3xl">
        holding text until it is complete makes its first words readable later. the cost is measured on every
        recording, per policy, on the recording&rsquo;s own clock, and shown here rather than argued away.
      </p>
      <Reveal className="mt-12 md:mt-16">
        <CostTable scope="all60" />
      </Reveal>
      <div className="mt-12 md:mt-16 grid gap-10 md:grid-cols-3">
        <Reveal className="rule pt-6">
          <h3 className="text-xl font-bold tracking-tight leading-tight">each sentence</h3>
          <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            the first sentence lands after a median of {s.medianFirstPassageAt} steps, {secs(sr.medianFirstPassageAt)} seconds on this machine and
            a fraction of that on a production model. text waits a mean of {s.meanExtraHold?.toFixed(0)} steps after it is in order. and for
            {' '}{formingPct} percent of the run that waiting text is in view, forming, so the page is still while the process is not hidden.
          </p>
        </Reveal>
        <Reveal delay={80} className="rule pt-6">
          <h3 className="text-xl font-bold tracking-tight leading-tight">each word</h3>
          <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            the honest typewriter. the first word lands at {w.medianFirstPassageAt} steps and the only wait is the word rule itself, a mean of
            {' '}{w.meanWordSafeLag?.toFixed(1)} steps: the price of never drawing a piece of a word. the page moves as the prefix moves, in bursts.
          </p>
        </Reveal>
        <Reveal delay={160} className="rule pt-6">
          <h3 className="text-xl font-bold tracking-tight leading-tight">each paragraph</h3>
          <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            on this corpus a paragraph is the whole answer: the first passage lands at step {p.medianFirstPassageAt} of {TRACE_NUMBERS.steps}. it is an
            explicit trade for a product that would rather show nothing than a sentence out of context, and it is priced as such.
          </p>
        </Reveal>
      </div>
      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] rule pt-8">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">what margin paid, and what settle does instead</h3>
        <div className="text-base leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }}>
          <p>
            margin held the in-order text invisible until its sentence closed and paid the whole hold in blankness. settle releases the page on
            the same boundary at the same moment, so the page&rsquo;s wait is identical, and draws the held text dim beneath it, so the wait is
            not blank. the forming text is real, in order, and never changes once drawn; what it lacks is only the status of a place to read.
          </p>
          <p className="mt-4">
            the clock here is a 0.6B model at {TRACE_NUMBERS.msPerStepRecorded} ms a step on a laptop. a production diffusion model runs its steps
            an order of magnitude faster, which shrinks every second in the table without changing a single shape: the bursts, the holes and
            the end settling first are properties of the sampler, and the surface renders the same events at any tempo. the stages on this page
            play at the recorded clock unless a control says otherwise, and every stage names the clock it is on.
          </p>
        </div>
      </div>
    </Section>
  )
}

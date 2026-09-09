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
        the ambient composition waits for the whole answer. that removes intermediate word arrivals by giving up early reading. the earlier policies remain available, and their real availability costs are measured separately from how the motion feels.
      </p>
      <Reveal className="mt-12 md:mt-16">
        <CostTable scope="all60" />
      </Reveal>
      <div className="mt-12 md:mt-16 grid gap-10 md:grid-cols-3">
        <Reveal className="rule pt-6">
          <h3 className="text-xl font-bold tracking-tight leading-tight">each sentence</h3>
          <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            the earlier-sentence alternative releases its first passage after a median of {s.medianFirstPassageAt} steps, {secs(sr.medianFirstPassageAt)} seconds on this machine. production latency depends on the model, sampler and hardware. text waits a mean of {s.meanExtraHold?.toFixed(0)} steps after it is in order. its forming-text channel is nonempty for a median {' '}{formingPct} percent of the recorded run. that reducer measure is not a viewport exposure or readability result.
          </p>
        </Reveal>
        <Reveal delay={80} className="rule pt-6">
          <h3 className="text-xl font-bold tracking-tight leading-tight">each word</h3>
          <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            the earlier-word alternative. the first word lands at {w.medianFirstPassageAt} steps and the only wait is the word rule itself, a mean of
            {' '}{w.meanWordSafeLag?.toFixed(1)} steps: the price of keeping incomplete words off the released page. release follows the word-safe prefix in bursts.
          </p>
        </Reveal>
        <Reveal delay={160} className="rule pt-6">
          <h3 className="text-xl font-bold tracking-tight leading-tight">each paragraph</h3>
          <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            the median first paragraph arrives at step {p.medianFirstPassageAt} of {TRACE_NUMBERS.steps}. a paragraph boundary can still precede source finality, so this policy is not equivalent to waiting for the whole answer.
          </p>
        </Reveal>
      </div>
      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] rule pt-8">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">the cost of one arrival</h3>
        <div className="text-base leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }}>
          <p>
            whole-answer release becomes eligible at a median 15.8 seconds on the original recordings. across 57 nonempty matched runs, its first passage waits a median 10.5 seconds longer than sentence release. that is the median of paired differences, not a subtraction of the two medians. three empty outputs remain in the exact-output audit. these are reducer eligibility times, not measured browser paint or human reading times. the adaptive renderer’s final size fit adds a separate presentation cost when more room is needed. {' '}<a className="underline underline-offset-4" href="https://github.com/globalanomalyindex/after-tokens/blob/main/data/experiments/answer-policy-cost-2026-09-09.json">policy report and definitions</a>.
          </p>
          <p className="mt-4">
            the clock here is a 0.6B model at {TRACE_NUMBERS.msPerStepRecorded} ms a step on a laptop. it is the capture&rsquo;s
            forward-pass clock, not end-to-end response latency or a production benchmark. a faster replay preserves this recording&rsquo;s
            events; another model or sampler may change both their timing and their pattern. the stages play at the recorded clock
            unless a control says otherwise.
          </p>
        </div>
      </div>
    </Section>
  )
}

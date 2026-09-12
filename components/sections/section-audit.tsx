import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { ExposureFigure } from '@/components/settle/exposure-figure'
import { CAUSAL } from '@/lib/traces/findings'

// The audit of the version that came before this one. Every finding is
// accepted; the contract in the next chapter is built so none can recur.

export function SectionAudit() {
  const share = `${(CAUSAL.multiStepShare * 100).toFixed(0)}%`
  return (
    <Section id="audit" title="The first version cheated">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">the first version cheated</h2>
      <p className="standfirst max-w-3xl">
        the crystallize reveal shipped on september 6 choreographed an answer it already had. an independent audit
        of that build, run against the pinned source by a second agent, found how and by how much. every finding
        is accepted here, reproduced by this repository&rsquo;s own report, and built against.
      </p>
      <dl className="mt-12 md:mt-16 grid gap-8 md:grid-cols-3">
        <Reveal className="rule pt-6">
          <dt className="label">words drawn before they were spelled</dt>
          <dd className="mt-3 text-4xl md:text-5xl font-bold tracking-tighter font-display">{CAUSAL.multiStepWords.toLocaleString()} <span className="text-2xl" style={{ color: 'var(--muted)' }}>/ {CAUSAL.words.toLocaleString()}</span></dd>
          <dd className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            {share}{' '}of the corpus&rsquo;s words commit across more than one step, and the old rule drew the final spelling at the first piece.
            {' '}{CAUSAL.matchedAtFirst}{' '}of them happened to match the model&rsquo;s guess at that moment; the rest were words a reader could have read wrong.
          </dd>
        </Reveal>
        <Reveal delay={80} className="rule pt-6">
          <dt className="label">&ldquo;length fixed&rdquo; before it was</dt>
          <dd className="mt-3 text-4xl md:text-5xl font-bold tracking-tighter font-display">{CAUSAL.tailStatEarly} <span className="text-2xl" style={{ color: 'var(--muted)' }}>/ {CAUSAL.traces}</span></dd>
          <dd className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            runs where the stage announced the answer&rsquo;s length from a statistic computed after the fact. causally, the length is known
            only when the committed prefix reaches its first end token.
          </dd>
        </Reveal>
        <Reveal delay={160} className="rule pt-6">
          <dt className="label">&ldquo;no phrase reads out of order&rdquo;</dt>
          <dd className="mt-3 text-4xl md:text-5xl font-bold tracking-tighter font-display">{CAUSAL.inversionsLeft}</dd>
          <dd className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            the median share of word pairs inside a phrase that still arrived out of order under that claim, because each phrase&rsquo;s anchor
            was allowed to jump the queue. the claim was too strong and the page said it anyway.
          </dd>
        </Reveal>
      </dl>

      <Reveal className="mt-12 md:mt-16">
        <ExposureFigure traceId="sky-blue__random-b32" />
      </Reveal>

      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">what it had, and what a live renderer has</h3>
        <div className="text-base leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }}>
          <p>
            the old engine joined the final word table into a string, tokenized and measured it before the first step, reserved every
            word&rsquo;s final width, scored every word&rsquo;s salience, and then played the recording&rsquo;s order over that finished
            geometry. a live renderer receives commits: a position, a token, a step. it has no final word table, exact final widths or future salience map. a configured token budget does not supply that geometry.
          </p>
          <p className="mt-4">
            the arrival profile that scored the old grammar measured reveals a live source cannot produce. its numbers, including the
            540 ms and 36 percent this page once cited, describe a replay that knew the answer. they are kept in the repository as history
            and cited nowhere else.
          </p>
          <p className="mt-4">
            I used the audit to establish the first reading contract on 7 september 2026, under the name margin.
            this chapter keeps its contract and its rigor. the chapters after it are what the contract makes possible once the process is
            shown where it is real.
          </p>
        </div>
      </div>
    </Section>
  )
}

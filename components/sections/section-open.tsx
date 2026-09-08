import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { NatureWord } from '@/components/chrome/nature-word'

// What is open: what a live integration needs, what the contract does not
// yet cover, and how to reproduce every number on the page.

const OPEN: { title: string; body: string }[] = [
  {
    title: 'a live sampler on the other end',
    body: 'the adapter consumes commits: a position, a token, a step. a protocol that promises irreversibility, or explicit finality for snapshots, is all the surface needs. reconnection, cancellation, version ids and bounded buffering are the plumbing a product adds.',
  },
  {
    title: 'samplers that change their mind',
    body: 'remasking samplers can send a committed token back to mask. for them the contract already has the snapshot path: nothing reaches the page until a snapshot is final, and a revision after that is an event the reader applies. a field for a reversible source is undesigned.',
  },
  {
    title: 'markdown, code and math',
    body: 'the boundary rule holds fenced code, inline code and lists until a blank line, which keeps a half-open fence off the page. a production renderer needs keyed blocks so a passage that is a list item does not reflow its neighbors, and rules for math, citations and right-to-left text.',
  },
  {
    title: 'other scripts',
    body: 'the word rule reads whitespace, so it is a rule for scripts that use it. sentence boundaries are an english punctuation heuristic. scripts without word spacing need a segmenter, and the field needs no change at all.',
  },
  {
    title: 'structured answers',
    body: 'an answer carries color, data and layout as well as words. the earlier version ran a weather card on the old contract; the new contract has no unit smaller than a passage for a non-text atom yet.',
  },
  {
    title: 'the study',
    body: 'stimuli are shipped. the sentence policy with forming text is the candidate; the raw prefix is the baseline; margin&rsquo;s held variant is a condition. the strongest argument against the design, that waiting costs more than stillness gives back, stands until it runs.',
  },
]

const REPRO: { label: string; cmd: string; note: string }[] = [
  { label: 'the cost report', cmd: 'pnpm traces:settle', note: 'regenerates lib/traces/settle.json: every policy, every recording, both clocks, and the causal audit' },
  { label: 'the checks', cmd: 'pnpm check', note: 'lint, types, the reducer and corpus tests, the build' },
  { label: 'the browser checks', cmd: 'pnpm test:e2e:chromium', note: 'axe at wcag 2.1 aa, reduced motion, the eleven sections at desktop and phone width' },
]

export function SectionOpen() {
  return (
    <Section id="open" title="Open">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">open</h2>
      <p className="standfirst max-w-3xl">
        a contract earns its keep by what it leaves room for. six directions, each a real extension of the same
        rules, none of them needed to make the argument above, and a way to reproduce every number on this page.
      </p>
      <dl className="mt-12 md:mt-16 grid gap-x-12 gap-y-8 md:grid-cols-2 rule pt-8">
        {OPEN.map((o, i) => (
          <Reveal key={o.title} delay={i * 50}>
            <dt className="text-base font-semibold">{o.title}</dt>
            <dd className="mt-1 text-base leading-relaxed max-w-[56ch]" style={{ color: 'var(--ink-2)' }} dangerouslySetInnerHTML={{ __html: o.body }} />
          </Reveal>
        ))}
      </dl>

      <div className="mt-16 md:mt-24 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] rule pt-8">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">inspect it, reproduce it, change it</h3>
        <div className="grid gap-5">
          <dl className="grid gap-5">
            {REPRO.map((r) => (
              <div key={r.cmd} className="grid gap-1">
                <dt className="text-base font-semibold">{r.label}</dt>
                <dd><code className="keep-case readout" style={{ color: 'var(--ink)' }}>{r.cmd}</code></dd>
                <dd className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{r.note}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }}>
            the written case study, the research note with the literature ledger, the design record, the settle spec and the margin handoff
            it absorbs are in the repository under docs. the legacy reveal engine is kept as the labeled retrospective reference the audit
            compares against.
          </p>
        </div>
      </div>

      <div className="mt-16 md:mt-24 rule pt-8 max-w-2xl">
        <p className="text-base">
          product design and engineering by <span style={{ fontWeight: 600 }}>christopher robin fiore</span>, with claude as design and engineering
          partner. the causal audit and the first implementation of the reading contract were made by codex on 7 september 2026, under the name
          margin, and are credited in the design record.
        </p>
        <p className="text-base mt-1" style={{ color: 'var(--ink-2)' }}>
          portfolio theme: looking to <NatureWord kind="nature">nature</NatureWord>{' '}for questions, then measuring the answers.
        </p>
      </div>
    </Section>
  )
}

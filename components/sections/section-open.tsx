import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { NatureWord } from '@/components/chrome/nature-word'

// What is open: what a live integration needs, what the contract does not
// yet cover, and how to reproduce every number on the page.

const OPEN: { title: string; body: string }[] = [
  {
    title: 'a live sampler on the other end',
    body: 'the waiting animation needs no draft stream. showing the answer still requires a source that can identify eligible passages or explicitly finish a result. a live integration must define cancellation, reconnection, revisions and errors; this motion study does not solve that protocol for every model.',
  },
  {
    title: 'samplers that change their mind',
    body: 'remasking samplers can send a token back to mask. the snapshot path keeps candidate words off the protected page. their approximate amount can reserve height, but individual bar widths never copy the candidate. only a final snapshot releases the answer; a later revision requires review and apply. the authored exercise tests this contract, but a production snapshot protocol still needs integration.',
  },
  {
    title: 'markdown, code and math',
    body: 'whole-answer release avoids progressively parsing guessed formatting. a production renderer still needs a safe Markdown pipeline, code, math, citations and right-to-left layout. earlier passage policies also need stable keyed blocks and explicit structural boundaries.',
  },
  {
    title: 'other scripts',
    body: 'the earlier-word rule uses whitespace and the sentence rule uses English punctuation heuristics. other scripts need appropriate segmentation. whole-answer release avoids those incremental boundaries, but typography, wrapping and accessibility still need language-specific validation.',
  },
  {
    title: 'structured answers',
    body: 'an application can own three answer fields before generation; a prompt asking for three bullets cannot guarantee them. independently finished items need source-backed region finality. grammar-constrained diffusion is relevant prior work, not an integration already supplied by this prototype.',
  },
  {
    title: 'the study',
    body: 'compare still, breathing and the combined reshape treatment with shared source timing, coarse sizing and final handover rules; measure actual visual arrival separately. measure whether the division introduction, pill formation, neighbor movement and glimmer feel fluid or distracting, and whether readers mistake the shapes for actual words, model stages or progress. test earlier-sentence access separately, with its real wait advantage. waiting may cost more than the final answer arriving together gives back; no reader study has answered that yet.',
  },
]

const REPRO: { label: string; cmd: string; note: string }[] = [
  { label: 'the cost report', cmd: 'pnpm traces:settle', note: 'regenerates lib/traces/settle.json: every policy, every recording, both clocks, and the causal audit' },
  { label: 'the checks', cmd: 'pnpm check', note: 'lint, types, the reducer and corpus tests, the build' },
  { label: 'the browser checks', cmd: 'pnpm test:e2e:chromium', note: 'accessibility, reduced motion, identity, legibility, playback and final output; mobile emulation is not a physical iPhone test' },
]

export function SectionOpen() {
  return (
    <Section id="open" title="Open">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">open</h2>
      <p className="standfirst max-w-3xl">
        the website makes the motion inspectable, and its source contract makes the experiment reproducible. production integration, richer structures and reader benefit remain open. these are the next checks, and the commands that reproduce the existing evidence.
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
          web design, motion design and implementation by <span style={{ fontWeight: 600 }}>Christopher Robin Fiore</span>.
          my design record follows the causal audit and reading contract of 7 september 2026, the skeleton motion experiments,
          and the source-evidence refresh of 9 september.
        </p>
        <p className="text-base mt-1" style={{ color: 'var(--ink-2)' }}>
          portfolio theme: looking to <NatureWord kind="nature">nature</NatureWord>{' '}for questions, then measuring the answers.
        </p>
      </div>
    </Section>
  )
}

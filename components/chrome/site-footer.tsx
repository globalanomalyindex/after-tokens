// The last thing on the page: where the work lives and how to cite it.
const LINKS: { label: string; href: string; note: string }[] = [
  { label: 'source', href: 'https://github.com/globalanomalyindex/after-tokens', note: 'the engine, the metric suite, the tests' },
  { label: 'latest study', href: 'https://github.com/globalanomalyindex/after-tokens/blob/main/docs/skeleton-motion-study-2026-09-09.md', note: 'the motion direction, primary sources and testable claims' },
  { label: 'research note', href: 'https://github.com/globalanomalyindex/after-tokens/blob/main/docs/research-note.md', note: 'method, results, the causal audit, the literature ledger, limits' },
  { label: 'design record', href: 'https://github.com/globalanomalyindex/after-tokens/blob/main/docs/redesign.md', note: 'the reasoning, in order, margin included' },
  { label: 'handoff', href: 'https://github.com/globalanomalyindex/after-tokens/blob/main/docs/skeleton-handoff-2026-09-09.md', note: 'implementation, decisions, motion parameters and acceptance gates' },
  { label: 'experiments', href: 'https://github.com/globalanomalyindex/after-tokens/tree/main/data/experiments', note: 'new batched captures, original-corpus audits and rendering evidence' },
]

export function SiteFooter() {
  return (
    <footer className="section-shell rule" aria-label="colophon" style={{ paddingTop: '3.5rem', paddingBottom: '4rem' }}>
      <div className="section-column grid gap-10 md:grid-cols-2">
        <div>
          <p className="text-base leading-relaxed max-w-md" style={{ color: 'var(--ink-2)' }}>
            after tokens is an independent product design and engineering case study on how an answer from a
            diffusion language model should reach a reader. solid skeleton bars, a whole-answer arrival, brand voices,
            sixty original recordings, four new batched captures, and a measured cost for waiting.
          </p>
          <p className="mt-5 readout max-w-md" style={{ color: 'var(--muted)' }}>
            cite as: fiore, c. r. (2026). after tokens: a skeleton motion study for generated text.
            github.com/globalanomalyindex/after-tokens
          </p>
        </div>
        <dl className="grid gap-3">
          {LINKS.map((l) => (
            <div key={l.label} className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
              <dt>
                <a className="text-sm" href={l.href} target="_blank" rel="noreferrer">
                  {l.label} ↗
                </a>
              </dt>
              <dd className="readout" style={{ color: 'var(--muted)' }}>
                {l.note}
              </dd>
            </div>
          ))}
          <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline mt-2 pt-4 rule">
            <dt className="readout" style={{ color: 'var(--muted)' }}>license</dt>
            <dd className="readout" style={{ color: 'var(--muted)' }}>mit · text and data cc by 4.0 · 2026</dd>
          </div>
        </dl>
      </div>
    </footer>
  )
}

// The last thing on the page: where the work lives and how to cite it. Quiet
// mono, one rule, the same instrument-panel register as the section chrome.
const LINKS: { label: string; href: string; note: string }[] = [
  { label: 'source', href: 'https://github.com/globalanomalyindex/after-tokens', note: 'the engine, the case study, the tests' },
  { label: 'research note', href: 'https://github.com/globalanomalyindex/after-tokens/blob/main/docs/research-note.md', note: 'method, results, limits' },
  { label: 'design record', href: 'https://github.com/globalanomalyindex/after-tokens/blob/main/docs/redesign.md', note: 'the reasoning, in order' },
  { label: 'data', href: 'https://github.com/globalanomalyindex/after-tokens/tree/main/data/traces', note: 'sixty recorded trajectories, mit' },
]

export function SiteFooter() {
  return (
    <footer
      className="px-6 md:px-16 pt-14 pb-16 border-t"
      style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)' }}
      aria-label="colophon"
    >
      <div className="max-w-5xl mx-auto grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            + after tokens
          </p>
          <p className="text-base leading-relaxed max-w-md" style={{ color: 'var(--ink-2)' }}>
            An independent product design and engineering case study on how an answer from a diffusion language model
            should arrive on screen. A working prototype, sixty recorded trajectories, and four claims a study can break.
          </p>
          <p className="mt-5 text-[11px] leading-relaxed max-w-md" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            cite as: fiore, c. r. (2026). after tokens: a rendering system for answers that do not arrive left to right.
            github.com/globalanomalyindex/after-tokens
          </p>
        </div>
        <dl className="grid gap-3">
          {LINKS.map((l) => (
            <div key={l.label} className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
              <dt>
                <a
                  className="text-sm underline underline-offset-4 decoration-[0.8px]"
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {l.label} ↗
                </a>
              </dt>
              <dd className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                {l.note}
              </dd>
            </div>
          ))}
          <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline mt-2 pt-4 border-t" style={{ borderColor: 'color-mix(in oklab, var(--ink) 10%, transparent)' }}>
            <dt className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>license</dt>
            <dd className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>mit · text and data cc by 4.0 · 2026</dd>
          </div>
        </dl>
      </div>
    </footer>
  )
}

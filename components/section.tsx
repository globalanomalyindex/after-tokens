import type { ReactNode } from 'react'

// One shell for every section: a labeled region, a padded band, a centered
// column. Sections render their own headings, so the shell carries no
// eyebrow, numeral, rule, or mark of its own; the reveal is the design and
// the page gets out of its way.
type SectionProps = {
  id: string
  title: string
  children: ReactNode
  className?: string
}

export function Section({ id, title, children, className = '' }: SectionProps) {
  return (
    <section id={id} aria-label={title} data-section={id} className={`section-shell ${className}`}>
      <div className="section-column">{children}</div>
    </section>
  )
}

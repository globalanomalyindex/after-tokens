import type { ReactNode } from 'react'

// Inline marker highlight for body text. Same visual contract as the
// MonoLabel highlight: flat accent fill, no border, no rounded corners —
// the way a cursor selection paints across text. `box-decoration-break:
// clone` makes the highlight wrap cleanly onto each line on long paragraphs.
export function Highlight({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        background: 'var(--marker)',
        color: 'var(--ink)',
        padding: '0.08em 0.2em',
        boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone',
      }}
    >
      {children}
    </span>
  )
}

import { Fragment } from 'react'

type MonoLabelProps = {
  parts: string[]
  // Optional leading index (e.g. the roman numeral "ii.") rendered before the
  // parts with no `+` separator, so the eyebrow reads "ii.  primer + fog".
  index?: string
  // When set, the strip becomes a solid colored tag (cream text on the accent)
  // instead of the neutral marker wash: the section's technical-color layer.
  accentColor?: string
  size?: 'sm' | 'md'
  className?: string
}

// Flat marker-highlight across the entire label, every part plus the `+`
// separators. Same shape as a cursor text selection: solid bg, no border,
// no radius. The whole subtitle reads as one highlighted strip.
export function MonoLabel({ parts, index, accentColor, size = 'md', className = '' }: MonoLabelProps) {
  const fontSize = size === 'sm' ? '9px' : '10.5px'
  return (
    <span
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-0 lowercase ${className}`}
      style={{
        fontFamily: 'var(--font-brand-mono, var(--font-mono))',
        fontSize,
        letterSpacing: '0.16em',
        color: accentColor ? 'var(--bone)' : 'var(--ink)',
        background: accentColor ?? 'var(--marker)',
        padding: '0.22em 0.4em',
      }}
    >
      {index && <span style={{ fontWeight: 500 }}>{index}</span>}
      {parts.map((part, i) => (
        <Fragment key={`${part}-${i}`}>
          {i > 0 && (
            <span aria-hidden="true" style={{ opacity: 0.5 }}>
              +
            </span>
          )}
          <span>{part}</span>
        </Fragment>
      ))}
    </span>
  )
}

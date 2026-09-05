type Corner = 'tl' | 'tr' | 'bl' | 'br'

function cornerPos(c: Corner): React.CSSProperties {
  // Inset into the corner so adjacent sections' numerals never bleed into
  // each other.
  switch (c) {
    case 'tl':
      return { top: '1rem', left: '1.5rem' }
    case 'tr':
      return { top: '1rem', right: '1.5rem' }
    case 'bl':
      return { bottom: '1rem', left: '1.5rem' }
    case 'br':
      return { bottom: '1rem', right: '1.5rem' }
  }
}

// One faint architectural numeral per section, the folio in the top-left
// corner. It used to stamp all four corners, which read as a watermark; one
// mark registers the section and leaves the other corners to the data code
// and the registration crosses.
export function SectionNumeral({ n, size = 96, corner = 'tl' }: { n: number; size?: number; corner?: Corner }) {
  const display = String(n).padStart(2, '0')
  return (
    <span
      aria-hidden="true"
      className="absolute select-none pointer-events-none font-bold"
      style={{
        ...cornerPos(corner),
        // Responsive: a subtle registration mark on mobile, scaling up to
        // the full architectural size on desktop.
        fontSize: `clamp(2.5rem, 7.5vw, ${size / 16}rem)`,
        lineHeight: 0.82,
        letterSpacing: '-0.04em',
        color: 'currentColor',
        opacity: 0.06,
      }}
    >
      {display}
    </span>
  )
}

type Corner = 'tl' | 'tr' | 'bl' | 'br'

const CORNERS: Corner[] = ['tl', 'tr', 'bl', 'br']

function cornerPos(c: Corner): React.CSSProperties {
  // Position each numeral inside its corner so adjacent sections' numerals
  // don't bleed into each other. Slight inset rather than overflow.
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

// Four faint architectural numerals — one in each corner. Sized smaller
// than the original single-numeral treatment so they read as registration
// marks rather than dominant decoration.
export function SectionNumeral({ n, size = 96 }: { n: number; size?: number }) {
  const display = String(n).padStart(2, '0')
  return (
    <>
      {CORNERS.map((c) => (
        <span
          key={c}
          aria-hidden="true"
          className="absolute select-none pointer-events-none font-bold"
          style={{
            ...cornerPos(c),
            // Responsive: a subtle registration mark on mobile, scaling up to
            // the full architectural size on desktop. Fixed px was far too
            // dominant on small screens.
            fontSize: `clamp(2.5rem, 7.5vw, ${size / 16}rem)`,
            lineHeight: 0.82,
            letterSpacing: '-0.04em',
            color: 'currentColor',
            opacity: 0.06,
          }}
        >
          {display}
        </span>
      ))}
    </>
  )
}

import { naturePalette, type NatureKind } from '@/lib/nature/palettes'

// A natural noun, painted letter by letter in the colors of the thing it names
// (sunflower in golds, nautilus in shell-russets, leaves in greens, ...). Solid
// color per letter — no clipped gradient — so it matches the rainbow name/title
// already in the piece. Pure render (no hooks), usable in server or client trees.
//
// Assistive tech gets one visually hidden copy of the word while the painted
// letter spans stay decorative. This avoids both character-by-character reading
// and an aria-label on a generic span (which is prohibited without a valid role).
export function NatureWord({
  kind,
  children,
  className,
}: {
  kind: NatureKind
  children: string
  className?: string
}) {
  const text = children
  const letters = Array.from(text)
  const visibleCount = letters.filter((c) => c !== ' ').length
  const colors = naturePalette(kind, visibleCount)
  let ci = 0
  return (
    <span className={className} data-nature={kind}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {letters.map((ch, i) =>
          ch === ' ' ? (
            ' '
          ) : (
            <span key={i} style={{ color: colors[ci++] }}>
              {ch}
            </span>
          ),
        )}
      </span>
    </span>
  )
}

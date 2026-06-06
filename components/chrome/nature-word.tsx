import { naturePalette, type NatureKind } from '@/lib/nature/palettes'

// A natural noun, painted letter by letter in the colors of the thing it names
// (sunflower in golds, nautilus in shell-russets, leaves in greens, ...). Solid
// color per letter — no clipped gradient — so it matches the rainbow name/title
// already in the piece. Pure render (no hooks), usable in server or client trees.
//
// The whole word carries an aria-label so assistive tech reads the word, not the
// letter spans; inheriting weight/size means it sits naturally in body or display.
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
    <span aria-label={text} className={className} data-nature={kind}>
      {letters.map((ch, i) =>
        ch === ' ' ? (
          ' '
        ) : (
          <span key={i} aria-hidden="true" style={{ color: colors[ci++] }}>
            {ch}
          </span>
        ),
      )}
    </span>
  )
}

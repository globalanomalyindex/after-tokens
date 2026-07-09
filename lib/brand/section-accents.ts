// The "technical color" layer. Each section carries an accent hue that runs
// through its chrome — the eyebrow tag, the top rule, the edge spine, the corner
// data marks — so color threads through the whole piece while the body copy
// stays ink + the nature multicolor. A tight, cycling set reads as one system,
// not a random hue per section.
//
// Saturated, with each hue darkened enough for cream text to clear WCAG AA on
// the compact eyebrow tags. Deliberately no high-lightness yellow-green.
const ACCENTS = [
  'oklch(0.55 0.19 252)', // blue
  'oklch(0.52 0.21 300)', // violet
  'oklch(0.57 0.22 352)', // magenta
  'oklch(0.57 0.20 27)', // red
  'oklch(0.57 0.12 196)', // teal
  'oklch(0.54 0.14 158)', // deep green
  'oklch(0.5 0.19 282)', // indigo
  'oklch(0.5 0.14 60)', // amber
]

export function sectionAccent(n: number): string {
  const i = (((n - 1) % ACCENTS.length) + ACCENTS.length) % ACCENTS.length
  return ACCENTS[i]!
}

// The playground is the spectrum section — its chrome rides a rainbow built
// from hard-edged color BLOCKS (no blend), echoing the stepped per-letter title
// rather than a smooth gradient. Lightness stays moderate so cream text reads on
// it, and the green band is a clean emerald rather than a vivid electric lime.
export const RAINBOW_ACCENT =
  'linear-gradient(90deg, oklch(0.58 0.2 25) 0 14.286%, oklch(0.62 0.16 65) 14.286% 28.571%, oklch(0.6 0.13 160) 28.571% 42.857%, oklch(0.58 0.12 198) 42.857% 57.143%, oklch(0.55 0.19 255) 57.143% 71.429%, oklch(0.52 0.21 300) 71.429% 85.714%, oklch(0.57 0.22 352) 85.714% 100%)'

// A single representative hue for the rainbow section's faint mixed marks
// (spine, corner data, base rail), where a gradient cannot be color-mixed.
export const RAINBOW_FALLBACK = 'oklch(0.54 0.2 300)'

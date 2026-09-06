// Per-thing color palettes for the "nature words wear their own colors" treatment.
// Each natural noun in the prose (sunflower, nautilus, pine cone, leaves, ...) is
// painted letter by letter with a ramp evoking the actual thing, on the cream
// surface. Solid color per letter (not a clipped gradient) keeps it cohesive with
// the rainbow name/title already in the piece.
//
// Stops are OKLCH [L, C, H], tuned to stay legible on the bone background
// (mostly L 0.45–0.7): the lightest end of each ramp still reads as ink-dark
// enough to be a word, not a smear.

export type NatureKind =
  | 'sunflower'
  | 'nautilus'
  | 'pinecone'
  | 'leaves'
  | 'heron'
  | 'dawn'
  | 'aurora'
  | 'fog'
  | 'mycelium'
  | 'nature'
  | 'amber'
  | 'crystal'

type Stop = [number, number, number] // L, C, H

const PALETTES: Record<NatureKind, Stop[]> = {
  // brown seed center → golden petals
  sunflower: [
    [0.45, 0.1, 64],
    [0.58, 0.13, 74],
    [0.67, 0.15, 85],
    [0.7, 0.15, 95],
  ],
  // russet + tan shell banding, warm
  nautilus: [
    [0.46, 0.08, 40],
    [0.55, 0.1, 48],
    [0.63, 0.09, 58],
    [0.5, 0.08, 36],
  ],
  // woody brown → sienna
  pinecone: [
    [0.4, 0.06, 50],
    [0.49, 0.08, 56],
    [0.57, 0.09, 62],
    [0.45, 0.07, 46],
  ],
  // fresh → olive → deep green
  leaves: [
    [0.5, 0.13, 136],
    [0.57, 0.15, 142],
    [0.62, 0.13, 150],
    [0.52, 0.12, 126],
  ],
  // slate blue-gray of the bird
  heron: [
    [0.52, 0.035, 236],
    [0.6, 0.045, 242],
    [0.56, 0.03, 256],
    [0.63, 0.04, 228],
  ],
  // sunrise: deep rose → peach → gold
  dawn: [
    [0.62, 0.13, 25],
    [0.7, 0.13, 45],
    [0.72, 0.12, 72],
    [0.63, 0.15, 8],
  ],
  // aurora borealis: green → teal → blue → violet
  aurora: [
    [0.62, 0.15, 150],
    [0.6, 0.14, 178],
    [0.56, 0.15, 215],
    [0.55, 0.16, 300],
  ],
  // cool, soft grays
  fog: [
    [0.52, 0.03, 250],
    [0.6, 0.025, 242],
    [0.48, 0.02, 262],
    [0.57, 0.025, 235],
  ],
  // mushroom taupe + earth
  mycelium: [
    [0.5, 0.045, 60],
    [0.57, 0.05, 52],
    [0.61, 0.04, 46],
    [0.52, 0.05, 66],
  ],
  // a whole natural spread: leaf-green → gold → sky → earth
  nature: [
    [0.52, 0.13, 142],
    [0.64, 0.14, 88],
    [0.55, 0.07, 232],
    [0.47, 0.08, 54],
  ],
  amber: [
    [0.55, 0.13, 68],
    [0.64, 0.15, 78],
    [0.6, 0.14, 74],
    [0.58, 0.14, 82],
  ],
  // ice: cobalt deepening to a cold slate, the color of a lock on the stage
  crystal: [
    [0.5, 0.19, 262],
    [0.56, 0.13, 250],
    [0.62, 0.08, 238],
    [0.52, 0.12, 258],
  ],
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Shortest-path hue interpolation so a ramp never spins the long way around.
function lerpHue(a: number, b: number, t: number): number {
  const d = (((b - a + 540) % 360) - 180) * t
  return (a + d + 360) % 360
}

// n solid OKLCH colors stepped smoothly across the kind's ramp — one per letter.
export function naturePalette(kind: NatureKind, n: number): string[] {
  const stops = PALETTES[kind] ?? PALETTES.nature
  const first = stops[0]!
  if (n <= 1) return [`oklch(${first[0]} ${first[1]} ${first[2]})`]
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const pos = (i / (n - 1)) * (stops.length - 1)
    const idx = Math.min(stops.length - 2, Math.floor(pos))
    const f = pos - idx
    const a = stops[idx]!
    const b = stops[idx + 1]!
    const L = lerp(a[0], b[0], f)
    const C = lerp(a[1], b[1], f)
    const H = lerpHue(a[2], b[2], f)
    out.push(`oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`)
  }
  return out
}

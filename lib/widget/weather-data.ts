// Multiple weather fixtures. Each fixture commits to a sky palette, a
// condition icon, a default diffusion mode, and a short conversational
// answer the AI returns alongside the widget. The point of the section is
// to show that the diffusion contract carries graphics + color + data +
// text in one arrived-at-once answer — and that the SAME modes that drive
// text diffusion also drive widget diffusion.

export type Condition = 'sun' | 'partly-cloudy' | 'cloud' | 'rain' | 'snow' | 'storm'

import type { ModeName } from '@/lib/diffusion/types'

export type HourPoint = {
  hour: string
  temp: number
}

export type WeatherFixture = {
  id: string
  city: string
  region: string
  localTime: string
  prompt: string
  answer: string
  condition: Condition
  conditionLabel: string
  // Default diffusion mode that drives the widget's entrance. The user can
  // override per-fixture in the section UI. Same mode names as the text
  // diffusion: mycelium, fog, aurora, mitosis.
  defaultMode: ModeName
  temperature: number
  feelsLike: number
  windMph: number
  windDir: string
  uv?: number
  humidity?: number
  hourly: HourPoint[]
  skyStops: {
    top: string
    upperMid: string
    lowerMid: string
    bottom: string
  }
  // Text color for the foreground content on this widget — picked per palette
  // so the temp/labels stay legible regardless of sky lightness.
  ink: string
  inkMuted: string
  // Warm hue used for the locked-temperature glow halo.
  glow: string
}

export const weatherFixtures: WeatherFixture[] = [
  {
    id: 'brooklyn',
    city: 'Brooklyn',
    region: 'NY',
    localTime: '2:14 PM',
    prompt: "What's the weather like in Brooklyn?",
    answer:
      "Mild today. Partly cloudy with a high near 73 by 3pm, then easing into the low 60s after sunset. Winds light from the southeast. You won't need an umbrella.",
    condition: 'partly-cloudy',
    conditionLabel: 'Partly cloudy, easing',
    defaultMode: 'mycelium',
    temperature: 72,
    feelsLike: 71,
    windMph: 8,
    windDir: 'SE',
    uv: 4,
    humidity: 62,
    hourly: [
      { hour: '2P', temp: 72 },
      { hour: '3P', temp: 73 },
      { hour: '4P', temp: 71 },
      { hour: '5P', temp: 69 },
      { hour: '6P', temp: 66 },
      { hour: '7P', temp: 64 },
      { hour: '8P', temp: 62 },
    ],
    skyStops: {
      top: 'oklch(0.78 0.12 230)',
      upperMid: 'oklch(0.85 0.10 215)',
      lowerMid: 'oklch(0.90 0.08 95)',
      bottom: 'oklch(0.86 0.13 75)',
    },
    ink: 'oklch(0.22 0.04 240)',
    inkMuted: 'oklch(0.24 0.04 240 / 0.66)',
    glow: 'oklch(0.96 0.04 80 / 0.45)',
  },
  {
    id: 'seattle',
    city: 'Seattle',
    region: 'WA',
    localTime: '10:42 AM',
    prompt: "What's the weather in Seattle?",
    answer:
      "Steady rain all day. 54° now, won't climb past 56. Heaviest cells roll through mid-afternoon, then taper by dinner. Bring the jacket. Take the inside route.",
    condition: 'rain',
    conditionLabel: 'Light rain, persistent',
    defaultMode: 'fog',
    temperature: 54,
    feelsLike: 51,
    windMph: 12,
    windDir: 'SW',
    uv: 1,
    humidity: 88,
    hourly: [
      { hour: '11A', temp: 54 },
      { hour: '12P', temp: 55 },
      { hour: '1P', temp: 56 },
      { hour: '2P', temp: 55 },
      { hour: '3P', temp: 54 },
      { hour: '4P', temp: 53 },
      { hour: '5P', temp: 52 },
    ],
    skyStops: {
      top: 'oklch(0.55 0.04 235)',
      upperMid: 'oklch(0.62 0.05 230)',
      lowerMid: 'oklch(0.68 0.05 220)',
      bottom: 'oklch(0.70 0.06 205)',
    },
    ink: 'oklch(0.96 0.01 230)',
    inkMuted: 'oklch(0.92 0.02 230 / 0.7)',
    glow: 'oklch(0.85 0.10 230 / 0.5)',
  },
  {
    id: 'reykjavik',
    city: 'Reykjavik',
    region: 'IS',
    localTime: '3:08 PM',
    prompt: "How cold is it in Reykjavík?",
    answer:
      "28° and dropping. Light snow through the evening, picking up after dark. Wind chill makes it feel closer to 18. Layer up if you're out for more than a few blocks.",
    condition: 'snow',
    conditionLabel: 'Light snow, evening',
    defaultMode: 'mycelium',
    temperature: 28,
    feelsLike: 18,
    windMph: 14,
    windDir: 'N',
    uv: 1,
    humidity: 84,
    hourly: [
      { hour: '3P', temp: 28 },
      { hour: '4P', temp: 27 },
      { hour: '5P', temp: 26 },
      { hour: '6P', temp: 24 },
      { hour: '7P', temp: 23 },
      { hour: '8P', temp: 22 },
      { hour: '9P', temp: 22 },
    ],
    skyStops: {
      top: 'oklch(0.82 0.02 250)',
      upperMid: 'oklch(0.88 0.02 240)',
      lowerMid: 'oklch(0.92 0.02 230)',
      bottom: 'oklch(0.94 0.02 220)',
    },
    ink: 'oklch(0.28 0.03 240)',
    inkMuted: 'oklch(0.32 0.03 240 / 0.66)',
    glow: 'oklch(0.88 0.08 220 / 0.6)',
  },
  {
    id: 'phoenix',
    city: 'Phoenix',
    region: 'AZ',
    localTime: '1:24 PM',
    prompt: "Is it really 104 in Phoenix?",
    answer:
      "Yes. 104° and climbing. Peak heat hits around 4pm before it eases into the mid-90s overnight. UV is extreme, hydration is non-optional. Avoid direct sun 11 to 5.",
    condition: 'sun',
    conditionLabel: 'Clear, intense sun',
    defaultMode: 'aurora',
    temperature: 104,
    feelsLike: 108,
    windMph: 5,
    windDir: 'W',
    uv: 11,
    humidity: 14,
    hourly: [
      { hour: '1P', temp: 104 },
      { hour: '2P', temp: 106 },
      { hour: '3P', temp: 107 },
      { hour: '4P', temp: 108 },
      { hour: '5P', temp: 106 },
      { hour: '6P', temp: 103 },
      { hour: '7P', temp: 99 },
    ],
    skyStops: {
      top: 'oklch(0.74 0.13 240)',
      upperMid: 'oklch(0.84 0.10 230)',
      lowerMid: 'oklch(0.90 0.10 90)',
      bottom: 'oklch(0.84 0.18 65)',
    },
    ink: 'oklch(0.22 0.05 60)',
    inkMuted: 'oklch(0.26 0.05 60 / 0.68)',
    glow: 'oklch(0.92 0.14 70 / 0.6)',
  },
]

export const fixtureById = (id: string) =>
  weatherFixtures.find((f) => f.id === id) ?? weatherFixtures[0]!

// Backwards-compat export used elsewhere — keep so older imports don't break
// while we transition components to the multi-fixture API.
export const brooklynNow = weatherFixtures[0]!

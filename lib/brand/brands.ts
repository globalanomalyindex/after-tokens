import type { BrandId, BrandTokens, BrandVoice } from './types'

export const VOICE_RANGES: Record<keyof BrandVoice, readonly [number, number]> = {
  tempo: [0.7, 1.4],
  attack: [90, 280],
  weight: [0, 1],
  glow: [0, 1],
  hush: [0, 1],
  swing: [0, 0.12],
}

export const DEFAULT_VOICE: BrandVoice = {
  tempo: 1,
  attack: 110,
  weight: 0.66,
  glow: 0.6,
  hush: 0.5,
  swing: 0.08,
}

/** A voice inside its ranges: the invariants the grammar keeps whatever the brand asks for. */
export function clampVoice(voice: Partial<BrandVoice>): BrandVoice {
  const out = { ...DEFAULT_VOICE }
  for (const key of Object.keys(VOICE_RANGES) as (keyof BrandVoice)[]) {
    const v = voice[key]
    if (typeof v !== 'number' || Number.isNaN(v)) continue
    const [lo, hi] = VOICE_RANGES[key]
    out[key] = Math.min(hi, Math.max(lo, v))
  }
  return out
}

export const brands: Record<BrandId, BrandTokens> = {
  'after-tokens': {
    id: 'after-tokens',
    name: 'After tokens',
    surface: '#EBE7DA',
    surfaceTint: '#E2DCCB',
    ink: '#15140F',
    inkSecondary: '#2A2820',
    muted: '#636058',
    stage: '#0B0A08',
    stageText: '#EBE7DA',
    // ice: the cool white a lock glows on the dark stage
    accent: '#D9E3F2',
    particleColor: '#D9E3F2',
    fontDisplay: 'var(--font-display)',
    fontBody: 'var(--font-body)',
    fontMono: 'var(--font-mono)',
    cornerRadius: 12,
    voice: clampVoice({ tempo: 1, attack: 110, weight: 0.66, glow: 0.6, hush: 0.5, swing: 0.08 }),
  },
  halcyon: {
    id: 'halcyon',
    name: 'Halcyon',
    surface: '#1A1F28',
    surfaceTint: '#22293A',
    ink: '#D8D4C6',
    inkSecondary: '#A8A398',
    muted: '#A09B8F',
    stage: '#0E1218',
    stageText: '#D8D4C6',
    accent: '#8AA093',
    particleColor: '#8AA093',
    fontDisplay: '"Tiempos Headline", Georgia, serif',
    fontBody: '"Tiempos Text", Georgia, serif',
    fontMono: 'var(--font-mono)',
    cornerRadius: 8,
    voice: clampVoice({ tempo: 0.85, attack: 220, weight: 0.4, glow: 0.25, hush: 0.6, swing: 0.05 }),
  },
  felt: {
    id: 'felt',
    name: 'Felt',
    surface: '#A8453A',
    surfaceTint: '#923A30',
    ink: '#F4ECDC',
    inkSecondary: '#E0D8C8',
    muted: '#F4ECDC',
    stage: '#0B0A08',
    stageText: '#F4ECDC',
    accent: '#F4C9A8',
    particleColor: '#F4C9A8',
    fontDisplay: 'var(--font-display)',
    fontBody: 'var(--font-body)',
    fontMono: 'var(--font-mono)',
    cornerRadius: 16,
    voice: clampVoice({ tempo: 1.05, attack: 110, weight: 0.9, glow: 0.9, hush: 0.45, swing: 0.1 }),
  },
  pulse: {
    id: 'pulse',
    name: 'Pulse',
    surface: '#E9EEF2',
    surfaceTint: '#DDE4EA',
    ink: '#1F2A36',
    inkSecondary: '#3D4956',
    muted: '#596571',
    stage: '#0F141B',
    stageText: '#E9EEF2',
    accent: '#6FA9B4',
    particleColor: '#6FA9B4',
    fontDisplay: 'var(--font-display)',
    fontBody: 'var(--font-body)',
    fontMono: 'var(--font-mono)',
    cornerRadius: 12,
    voice: clampVoice({ tempo: 0.95, attack: 150, weight: 0.5, glow: 0.4, hush: 0.65, swing: 0.06 }),
  },
  voltage: {
    id: 'voltage',
    name: 'Voltage',
    surface: '#0A0D12',
    surfaceTint: '#12161D',
    ink: '#EBE7DA',
    inkSecondary: '#B8B3A4',
    muted: '#928C7E',
    stage: '#000000',
    stageText: '#EBE7DA',
    accent: '#FF5E1F',
    particleColor: '#FF5E1F',
    fontDisplay: 'var(--font-display)',
    fontBody: 'var(--font-mono)',
    fontMono: 'var(--font-mono)',
    cornerRadius: 4,
    voice: clampVoice({ tempo: 1.3, attack: 90, weight: 1, glow: 0, hush: 0.35, swing: 0.02 }),
  },
}

export function getBrand(id: BrandId): BrandTokens {
  return brands[id] ?? brands['after-tokens']
}

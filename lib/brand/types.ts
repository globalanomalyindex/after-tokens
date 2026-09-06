export type BrandId = 'after-tokens' | 'halcyon' | 'felt' | 'pulse' | 'voltage'

// The voice: six tokens on the one grammar. Each has a range that keeps every
// property of the arrival profile inside its rule, so a brand can color the
// reveal and cannot break it. The tension budget, the phrase segmentation,
// the forming lead, and the exhale are grammar, outside the voice.
export type BrandVoice = {
  /** speed multiplier on the cadence; step intervals stay inside the Doherty window */
  tempo: number
  /** the lock's snap to crisp, in milliseconds; never gradual enough to lose the aha */
  attack: number
  /** how much heavier a settled word gets, 0 to 1 (400 to 700) */
  weight: number
  /** halo strength at lock, 0 to 1; gone within a second either way */
  glow: number
  /** how dim the open field rests, 0 to 1; pending text stays illegible either way */
  hush: number
  /** long-short syncopation of the steps, 0 to 0.12; the average rate stays linear */
  swing: number
}

export type BrandTokens = {
  id: BrandId
  name: string
  surface: string
  surfaceTint: string
  ink: string
  inkSecondary: string
  muted: string
  stage: string
  stageText: string
  accent: string
  particleColor: string
  fontDisplay: string
  fontBody: string
  fontMono: string
  cornerRadius: number
  voice: BrandVoice
}

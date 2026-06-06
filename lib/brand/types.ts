export type BrandId = 'after-tokens' | 'halcyon' | 'felt' | 'pulse' | 'voltage'

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
}

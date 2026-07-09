import { describe, expect, it } from 'vitest'
import { brands, getBrand } from '@/lib/brand/brands'
import { RAINBOW_ACCENT, sectionAccent } from '@/lib/brand/section-accents'

function luminance(hex: string): number {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? []
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return 0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0)
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

function oklchLuminance(value: string): number {
  const match = value.match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/)
  if (!match) throw new Error(`Expected an OKLCH color, received: ${value}`)
  const [, lightness, chroma, hue] = match
  const l = Number(lightness)
  const c = Number(chroma)
  const radians = (Number(hue) * Math.PI) / 180
  const a = c * Math.cos(radians)
  const b = c * Math.sin(radians)
  const lRoot = l + 0.3963377774 * a + 0.2158037573 * b
  const mRoot = l - 0.1055613458 * a - 0.0638541728 * b
  const sRoot = l - 0.0894841775 * a - 1.291485548 * b
  const lCube = lRoot ** 3
  const mCube = mRoot ** 3
  const sCube = sRoot ** 3
  const linear = [
    4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube,
    -1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube,
    -0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube,
  ].map((channel) => Math.max(0, Math.min(1, channel)))
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!
}

function contrastWithBone(oklch: string): number {
  return (luminance('#EBE7DA') + 0.05) / (oklchLuminance(oklch) + 0.05)
}

describe('brand tokens', () => {
  it('exposes the five spec brands', () => {
    expect(Object.keys(brands)).toEqual(
      expect.arrayContaining(['after-tokens', 'halcyon', 'felt', 'pulse', 'voltage']),
    )
  })

  it('every brand defines required tokens', () => {
    for (const brand of Object.values(brands)) {
      expect(brand.surface).toBeTruthy()
      expect(brand.ink).toBeTruthy()
      expect(brand.accent).toBeTruthy()
      expect(brand.stage).toBeTruthy()
      expect(brand.fontDisplay).toBeTruthy()
    }
  })

  it('getBrand("after-tokens") returns the case study brand', () => {
    expect(getBrand('after-tokens').surface).toBe('#EBE7DA')
  })

  it('getBrand falls back to after-tokens on unknown id', () => {
    expect(getBrand('nonexistent' as never).name).toBe('After tokens')
  })

  it('keeps primary and muted text AA-readable on every brand surface', () => {
    for (const brand of Object.values(brands)) {
      expect(contrast(brand.ink, brand.surface), `${brand.name} primary text`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(brand.muted, brand.surface), `${brand.name} muted text`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps cream eyebrow text AA-readable across every solid and rainbow accent', () => {
    const accents = Array.from({ length: 8 }, (_, index) => sectionAccent(index + 1))
    const rainbowBands = [...RAINBOW_ACCENT.matchAll(/oklch\([^)]+\)/g)].map(([color]) => color)
    expect(rainbowBands).toHaveLength(7)
    for (const accent of [...accents, ...rainbowBands]) {
      expect(contrastWithBone(accent), accent).toBeGreaterThanOrEqual(4.5)
    }
  })
})

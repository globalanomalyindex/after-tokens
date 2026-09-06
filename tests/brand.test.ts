import { describe, expect, it } from 'vitest'
import { brands, getBrand } from '@/lib/brand/brands'

function luminance(hex: string): number {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? []
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return 0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0)
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
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

})

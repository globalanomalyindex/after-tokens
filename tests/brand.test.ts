import { describe, expect, it } from 'vitest'
import { brands, getBrand } from '@/lib/brand/brands'

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
})

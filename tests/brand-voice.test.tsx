import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { brands, clampVoice, DEFAULT_VOICE, VOICE_RANGES } from '@/lib/brand/brands'
import { BrandProvider, voiceStyle } from '@/lib/brand/provider'

describe('brand voice', () => {
  it('every brand ships a voice inside the ranges', () => {
    for (const brand of Object.values(brands)) {
      for (const key of Object.keys(VOICE_RANGES) as (keyof typeof VOICE_RANGES)[]) {
        const [lo, hi] = VOICE_RANGES[key]
        expect(brand.voice[key], `${brand.name} ${key}`).toBeGreaterThanOrEqual(lo)
        expect(brand.voice[key], `${brand.name} ${key}`).toBeLessThanOrEqual(hi)
      }
    }
  })

  it('clamps a voice that asks for more than the grammar allows', () => {
    const v = clampVoice({ tempo: 9, attack: 10, weight: 2, glow: -1, hush: 3, swing: 0.5 })
    expect(v).toEqual({ tempo: 1.4, attack: 90, weight: 1, glow: 0, hush: 1, swing: 0.12 })
    expect(clampVoice({})).toEqual(DEFAULT_VOICE)
  })

  it('maps the voice to CSS variables on the provider', () => {
    const { container } = render(
      <BrandProvider brand="voltage">
        <span />
      </BrandProvider>,
    )
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue('--voice-attack')).toBe('90ms')
    expect(el.style.getPropertyValue('--voice-weight')).toBe('1.00')
    expect(el.style.getPropertyValue('--voice-glow')).toBe('0.00')
  })

  it('lets a voice override ride on top of the brand, still clamped', () => {
    const { container } = render(
      <BrandProvider brand="halcyon" voice={{ attack: 1000 }}>
        <span />
      </BrandProvider>,
    )
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue('--voice-attack')).toBe('280ms')
    expect(voiceStyle(DEFAULT_VOICE)).toMatchObject({ '--voice-hush': '0.50' })
  })
})

import { describe, expect, it } from 'vitest'
import { brands } from '@/lib/brand/brands'
import type { BrandId } from '@/lib/brand/types'
import { BREATH_MS, SECONDARY_CONTRAST_FLOOR, SETTLE_PRESETS, SETTLE_RANGES, clampSettleVoice, contrastRatio, mixHex, secondaryInk, settleVoiceStyle } from '@/lib/settle/voice'

describe('the settle voice', () => {
  it('clamps every token to its range and rejects unknown marks', () => {
    const v = clampSettleVoice({ mark: 'circle' as never, bloom: 4, onset: 900, tempo: 0.1, grain: -1 })
    expect(v.mark).toBe('tick')
    expect(v.bloom).toBe(SETTLE_RANGES.bloom[1])
    expect(v.onset).toBe(SETTLE_RANGES.onset[1])
    expect(v.tempo).toBe(SETTLE_RANGES.tempo[0])
    expect(v.grain).toBe(SETTLE_RANGES.grain[0])
  })

  it('never lets the settling exceed 240 ms', () => {
    expect(SETTLE_RANGES.onset[1]).toBe(240)
    for (const preset of Object.values(SETTLE_PRESETS)) expect(preset.onset).toBeLessThanOrEqual(240)
  })

  it('writes the variables the stylesheet reads', () => {
    const style = settleVoiceStyle({ grain: 1, tempo: 1.2 }) as Record<string, string>
    expect(style['--settle-breath']).toBe(`${Math.round(BREATH_MS / 1.2)}ms`)
    expect(style['--settle-ink-2-keep']).toMatch(/%$/)
    expect(Number(style['--settle-open-alpha'])).toBeGreaterThan(0.1)
  })

  it('gives every brand a secondary ink that clears the contrast floor on both its grounds', () => {
    for (const id of Object.keys(brands) as BrandId[]) {
      const b = brands[id]
      const pairs = [{ ink: b.ink, ground: b.surface }, { ink: b.stageText, ground: b.stage }]
      const { keep, tint } = secondaryInk(pairs, b.accent, b.settle.grain)
      for (const { ink, ground } of pairs) {
        const secondary = mixHex(mixHex(ink, ground, keep), b.accent, 1 - tint)
        expect(contrastRatio(secondary, ground), `${id} on ${ground}`).toBeGreaterThanOrEqual(SECONDARY_CONTRAST_FLOOR)
      }
      // and it is still a different ink from the page's: dimmer, or tinted
      expect(keep < 1 || tint > 0, `${id} secondary is distinct`).toBe(true)
    }
  })

  it('carries the state in a tint where a palette leaves no room to dim', () => {
    const felt = brands.felt
    const { keep, tint } = secondaryInk([{ ink: felt.ink, ground: felt.surface }, { ink: felt.stageText, ground: felt.stage }], felt.accent, felt.settle.grain)
    expect(keep).toBeGreaterThan(0.86)
    expect(tint).toBeGreaterThan(0)
  })
})

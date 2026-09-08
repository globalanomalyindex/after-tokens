import { describe, expect, it } from 'vitest'
import { BREATH_MS, SETTLE_PRESETS, SETTLE_RANGES, clampSettleVoice, settleVoiceStyle } from '@/lib/settle/voice'

describe('the settle voice', () => {
  it('clamps every token to its range and rejects unknown marks', () => {
    const v = clampSettleVoice({ mark: 'circle' as never, bloom: 4, onset: 900, tempo: 0.1, grain: -1 })
    expect(v.mark).toBe('tick')
    expect(v.bloom).toBe(SETTLE_RANGES.bloom[1])
    expect(v.onset).toBe(SETTLE_RANGES.onset[1])
    expect(v.tempo).toBe(SETTLE_RANGES.tempo[0])
    expect(v.grain).toBe(SETTLE_RANGES.grain[0])
  })

  it('never lets a passage onset exceed 240 ms', () => {
    expect(SETTLE_RANGES.onset[1]).toBe(240)
    for (const preset of Object.values(SETTLE_PRESETS)) expect(preset.onset).toBeLessThanOrEqual(240)
  })

  it('writes the variables the stylesheet reads, with forming text kept legible', () => {
    const style = settleVoiceStyle({ grain: 1, tempo: 1.2 }) as Record<string, string>
    expect(style['--settle-breath']).toBe(`${Math.round(BREATH_MS / 1.2)}ms`)
    expect(Number(style['--settle-forming-alpha'])).toBeGreaterThanOrEqual(0.62)
    expect(Number(style['--settle-open-alpha'])).toBeGreaterThan(0.1)
  })
})

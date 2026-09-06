import { describe, expect, it } from 'vitest'
import { codaPrompts } from '@/lib/coda/fixtures'

describe('coda fixtures', () => {
  it('exposes eight prompts, every one with a recorded run of the same prompt', () => {
    expect(codaPrompts).toHaveLength(8)
  })
  it('each prompt has a default mode and a response', () => {
    for (const p of codaPrompts) {
      expect(p.defaultMode).toMatch(/^(mycelium|fog|aurora|mitosis)$/)
      expect(p.response.length).toBeGreaterThan(20)
    }
  })
  it('covers all four modes', () => {
    const modes = new Set(codaPrompts.map((p) => p.defaultMode))
    expect(modes.size).toBe(4)
  })
})

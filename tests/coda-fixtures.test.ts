import { describe, expect, it } from 'vitest'
import { codaPrompts } from '@/lib/coda/fixtures'

describe('coda fixtures', () => {
  it('exposes seven prompts (4 narrative modes + the wild card)', () => {
    expect(codaPrompts).toHaveLength(7)
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

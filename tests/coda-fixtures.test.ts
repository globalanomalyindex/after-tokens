import { describe, expect, it } from 'vitest'
import { codaPrompts } from '@/lib/coda/fixtures'

describe('coda fixtures', () => {
  it('exposes eight prompts, every one with a recorded run of the same prompt', () => {
    expect(codaPrompts).toHaveLength(8)
  })
  it('each prompt defaults to the grammar and carries a response', () => {
    for (const p of codaPrompts) {
      expect(p.defaultMode).toBe('crystal')
      expect(p.response.length).toBeGreaterThan(20)
    }
  })
})

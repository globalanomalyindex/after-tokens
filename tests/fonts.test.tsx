import { describe, expect, it } from 'vitest'
import { displayFont, monoFont } from '@/lib/fonts'

describe('fonts', () => {
  it('exposes a display CSS variable', () => {
    expect(displayFont.variable).toMatch(/^--font-display$|^[-_a-z0-9]+$/i)
  })
  it('exposes a mono CSS variable', () => {
    expect(monoFont.variable).toMatch(/^--font-mono$|^[-_a-z0-9]+$/i)
  })
})

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('design tokens', () => {
  const css = readFileSync('app/globals.css', 'utf-8')

  it('defines the seven case-study tokens', () => {
    expect(css).toMatch(/--bone:\s*#EBE7DA/i)
    expect(css).toMatch(/--bone-2:\s*#E2DCCB/i)
    expect(css).toMatch(/--ink:\s*#15140F/i)
    expect(css).toMatch(/--ink-2:\s*#2A2820/i)
    expect(css).toMatch(/--muted:\s*#636058/i)
    expect(css).toMatch(/--stage:\s*#0B0A08/i)
    expect(css).toMatch(/--stage-text:\s*#EBE7DA/i)
  })

  it('defines the warm-white accent', () => {
    expect(css).toMatch(/--accent:\s*#F5F2EA/i)
  })

  it('keeps the case-study root palette off pure black and white', () => {
    const tokenBlock = css.match(/:root\s*\{[^}]+\}/)?.[0] ?? ''
    expect(tokenBlock).not.toMatch(/#000000|#FFFFFF|#000\b|#FFF\b/i)
  })
})

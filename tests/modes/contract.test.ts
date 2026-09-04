import { describe, expect, it } from 'vitest'
import diffusionExplainJson from '@/data/traces/compact/diffusion-explain__lowconf-b32.json'
import { mycelium } from '@/lib/diffusion/modes/mycelium'
import { fog } from '@/lib/diffusion/modes/fog'
import { aurora } from '@/lib/diffusion/modes/aurora'
import { mitosis } from '@/lib/diffusion/modes/mitosis'
import { asTrace, traceStrategy } from '@/lib/diffusion/traces'
import type { MeasuredAtom, ModeStrategy } from '@/lib/diffusion/types'

// The recorded trajectory mode runs through the same shared contract as the
// authored ones: it is a ModeStrategy like any other, just built from data
// at runtime instead of a formula (see lib/diffusion/traces.ts).
const strategies: ModeStrategy[] = [
  mycelium,
  fog,
  aurora,
  mitosis,
  traceStrategy(asTrace(diffusionExplainJson), { msPerStep: 40 }),
]

function words(count: number): MeasuredAtom[] {
  return Array.from({ length: count }, (_, index) => ({
    text: `word-${index}`,
    index,
    lineIndex: Math.floor(index / 4),
    bbox: {
      x: (index % 4) * 80,
      y: Math.floor(index / 4) * 28,
      w: 68,
      h: 20,
    },
  }))
}

describe.each(strategies)('$name strategy contract', (strategy) => {
  it('handles empty input', () => {
    expect(strategy.computeTimeline([])).toEqual([])
    expect(strategy.totalDuration([])).toBe(0)
  })

  it('resolves every word exactly once within its advertised duration', () => {
    const input = words(24)
    const events = strategy.computeTimeline(input)
    const validIndexes = new Set(input.map((word) => word.index))
    const total = strategy.totalDuration(input)

    expect(events).toHaveLength(input.length * 2)
    for (const word of input) {
      expect(events.filter((event) => event.wordIndex === word.index && event.state === 'resolving')).toHaveLength(1)
      expect(events.filter((event) => event.wordIndex === word.index && event.state === 'resolved')).toHaveLength(1)
    }
    for (const event of events) {
      expect(validIndexes.has(event.wordIndex)).toBe(true)
      expect(Number.isFinite(event.t)).toBe(true)
      expect(event.t).toBeGreaterThanOrEqual(0)
      expect(event.t).toBeLessThanOrEqual(total)
    }
  })

  it('is deterministic for identical content and geometry', () => {
    const input = words(12)
    expect(strategy.computeTimeline(input)).toEqual(strategy.computeTimeline(input))
  })
})

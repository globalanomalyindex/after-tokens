import { describe, expect, it } from 'vitest'
import derived from '@/data/traces/derived/drafts.json'
import { PROVISIONAL_FLOOR } from '@/lib/diffusion/traces'
import { DRAFT_FLOOR } from '@/lib/settle/reader'
import { TRACE_IDS, loadTrace } from '@/lib/traces/index'

// The drafts the site loads against the statistics the case study cites.
// scripts/derive-drafts.py computed both from the full recordings; this
// recomputes what the compact files allow (visibility, accuracy by text,
// the polish time) and checks that the cited numbers are the same numbers.

const EOS = new Set(['<|endoftext|>', '<|im_end|>'])

describe('the drafts the site loads', () => {
  it('use the one floor the piece names', () => {
    expect(DRAFT_FLOOR).toBe(PROVISIONAL_FLOOR)
    expect(derived.displayFloor).toBe(PROVISIONAL_FLOOR)
    expect(derived.recordFloor).toBeLessThan(derived.displayFloor)
  })

  it('agree with the derived statistics at the display floor', async () => {
    let pairs = 0
    let visible = 0
    let correct = 0
    let stepsWith = 0
    let steps = 0
    const polish: number[] = []
    for (const id of TRACE_IDS) {
      const trace = await loadTrace(id)
      const content = trace.tokens.filter((t) => !t.tail)
      if (content.length < derived.minContentTokens) continue
      const commitStep = new Map(trace.tokens.map((t) => [t.pos, t.step]))
      const finalText = new Map(trace.tokens.map((t) => [t.pos, t.text]))
      const contentSet = new Set(content.map((t) => t.pos))
      const held = new Map<number, { text: string; p: number; shown: boolean }>()
      const firstClear = new Map<number, number>()
      expect(trace.drafts).toBeDefined()
      expect(trace.drafts!.length).toBe(trace.step_ms.length)
      trace.drafts!.forEach((entries, step) => {
        for (const [pos, text, p] of entries) {
          expect(commitStep.get(pos)!).toBeGreaterThan(step)
          if (text === '') held.delete(pos)
          else {
            const before = held.get(pos)
            held.set(pos, { text, p, shown: p >= derived.displayFloor || Boolean(before?.shown && before.text === text) })
          }
        }
        steps += 1
        let any = false
        for (const pos of contentSet) {
          if (commitStep.get(pos)! <= step) continue
          pairs += 1
          const d = held.get(pos)
          if (!d?.shown) continue
          visible += 1
          any = true
          if (d.text === finalText.get(pos) || (EOS.has(d.text) && EOS.has(finalText.get(pos)!))) correct += 1
          if (!firstClear.has(pos)) firstClear.set(pos, step)
        }
        if (any) stepsWith += 1
      })
      for (const [pos, s0] of firstClear) polish.push(commitStep.get(pos)! - s0)
    }
    const at = derived.shown
    expect(Number((visible / pairs).toFixed(4))).toBe(at.visibleShare)
    expect(Number((correct / visible).toFixed(4))).toBe(at.accuracy)
    expect(Number((stepsWith / steps).toFixed(4))).toBe(at.stepsWithDraftShare)
    const sorted = [...polish].sort((a, b) => a - b)
    const median = sorted.length % 2 ? sorted[sorted.length >> 1]! : (sorted[(sorted.length >> 1) - 1]! + sorted[sorted.length >> 1]!) / 2
    expect(median).toBe(at.medianPolishSteps)
  }, 20000) // Full-corpus audit; allow for concurrent browser verification.

  it('cites a commit lifting its neighbors far more than the rest', () => {
    for (const cfg of Object.values(derived.byConfig)) {
      expect(cfg.neighborLift).toBeGreaterThan(cfg.otherLift * 10)
      expect(cfg.neighborLiftN).toBeGreaterThan(50)
    }
  })
})
